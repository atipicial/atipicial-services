import {
  generateAccountForBlockchainService,
  BSKeychainHelper,
  type TBSAccount,
  type TGetLedgerTransport,
  type ILedgerService,
  type TLedgerServiceEmitter,
  type TUntilIndexRecord,
} from '@atipicial/blockchain-service'
import Transport from '@ledgerhq/hw-transport'
import EventEmitter from 'events'
import {
  EAtipicialDappKitLedgerServiceAtipicialCommand,
  EAtipicialDappKitLedgerServiceAtipicialSecondParameter,
  EAtipicialDappKitLedgerServiceAtipicialStatus,
  type IBSAtipicial,
  type TBSAtipicialName,
} from '../../types'
import { api, BSAtipicialAtipicialJsSingletonHelper } from '../../helpers/BSAtipicialAtipicialJsSingletonHelper'
import { BSAtipicialAtipicialDappKitSingletonHelper } from '../../helpers/BSAtipicialAtipicialDappKitSingletonHelper'

export class AtipicialDappKitLedgerServiceAtipicial implements ILedgerService<TBSAtipicialName> {
  readonly #service: IBSAtipicial
  readonly getLedgerTransport?: TGetLedgerTransport<TBSAtipicialName>

  emitter: TLedgerServiceEmitter = new EventEmitter() as TLedgerServiceEmitter

  constructor(blockchainService: IBSAtipicial, getLedgerTransport?: TGetLedgerTransport<TBSAtipicialName>) {
    this.#service = blockchainService
    this.getLedgerTransport = getLedgerTransport
  }

  // This verification is necessary because the ATC2 Ledger App also detects ATIPICIAL
  async verifyAppName(transport: Transport): Promise<boolean> {
    try {
      const response = await this.#sendChunk(
        transport,
        EAtipicialDappKitLedgerServiceAtipicialCommand.GET_APP_NAME,
        0x00,
        EAtipicialDappKitLedgerServiceAtipicialSecondParameter.LAST_DATA,
        undefined
      )
      const version = response.toString('ascii')
      const appName = version.substring(0, version.length - 2)

      return appName === 'ATC '
    } catch {
      return false
    }
  }

  async getAccount(transport: Transport, index: number): Promise<TBSAccount<TBSAtipicialName>> {
    const bipPath = BSKeychainHelper.getBipPath(this.#service.bipDerivationPath, index)
    const bipPathHex = this.#bipPathToHex(bipPath)

    const isAtipicialN3App = await this.verifyAppName(transport)
    if (!isAtipicialN3App) throw new Error('App is not ATC ')

    const result = await this.#sendChunk(
      transport,
      EAtipicialDappKitLedgerServiceAtipicialCommand.GET_PUBLIC_KEY,
      0x00,
      EAtipicialDappKitLedgerServiceAtipicialSecondParameter.LAST_DATA,
      bipPathHex
    )

    const publicKey = result.toString('hex').substring(0, 130)
    const { wallet } = BSAtipicialAtipicialJsSingletonHelper.getInstance()
    const { address } = new wallet.Account(publicKey)

    return {
      address,
      key: publicKey,
      type: 'publicKey',
      bipPath,
      blockchain: this.#service.name,
      isHardware: true,
    }
  }

  async getAccounts(
    transport: Transport,
    untilIndexByBlockchainService?: TUntilIndexRecord<TBSAtipicialName>
  ): Promise<TBSAccount<TBSAtipicialName>[]> {
    const accountsByBlockchainService = await generateAccountForBlockchainService(
      [this.#service],
      async (_service, index) => {
        return this.getAccount(transport, index)
      },
      untilIndexByBlockchainService
    )

    const accounts = accountsByBlockchainService.get(this.#service.name)
    return accounts ?? []
  }

  getSigningCallback(transport: Transport, account: TBSAccount<TBSAtipicialName>): api.SigningFunction {
    return async (transaction, { witnessIndex, network }) => {
      const isAtipicialN3App = await this.verifyAppName(transport)
      if (!isAtipicialN3App) throw new Error('App is not ATC ')

      try {
        this.emitter.emit('getSignatureStart')

        if (!account.bipPath) {
          throw new Error('Account must have BIP path to sign with Ledger')
        }

        const { wallet } = BSAtipicialAtipicialJsSingletonHelper.getInstance()

        const atipicialJsAccount = new wallet.Account(account.key)

        const witnessScriptHash = wallet.getScriptHashFromVerificationScript(
          transaction.witnesses[witnessIndex].verificationScript.toString()
        )

        if (atipicialJsAccount.scriptHash !== witnessScriptHash) {
          throw new Error('Invalid witness script hash')
        }

        const bipPathHex = this.#bipPathToHex(account.bipPath)

        // Send the BIP path account as first chunk
        await this.#sendChunk(
          transport,
          EAtipicialDappKitLedgerServiceAtipicialCommand.SIGN,
          0,
          EAtipicialDappKitLedgerServiceAtipicialSecondParameter.MORE_DATA,
          bipPathHex
        )

        const { AtipicialParser } = BSAtipicialAtipicialDappKitSingletonHelper.getInstance()

        // Send the network magic as second chunk
        await this.#sendChunk(
          transport,
          EAtipicialDappKitLedgerServiceAtipicialCommand.SIGN,
          1,
          EAtipicialDappKitLedgerServiceAtipicialSecondParameter.MORE_DATA,
          AtipicialParser.numToHex(network, 4, true)
        )

        const serializedTransaction = transaction.serialize(false)

        // Split the serialized transaction into chunks of 510 bytes
        const chunks = serializedTransaction.match(/.{1,510}/g) || []

        // Send all chunks except the last one
        for (let i = 0; i < chunks.length - 1; i++) {
          // We plus 2 because we already sent 2 chunks before
          const commandIndex = 2 + i
          await this.#sendChunk(
            transport,
            EAtipicialDappKitLedgerServiceAtipicialCommand.SIGN,
            commandIndex,
            EAtipicialDappKitLedgerServiceAtipicialSecondParameter.MORE_DATA,
            chunks[i]
          )
        }

        // Again, we plus 2 because we already sent 2 chunks before getting the chunks
        const lastChunkIndex = 2 + chunks.length

        // Send the last chunk signaling that it is the last one and get the signature
        const response = await this.#sendChunk(
          transport,
          EAtipicialDappKitLedgerServiceAtipicialCommand.SIGN,
          lastChunkIndex,
          EAtipicialDappKitLedgerServiceAtipicialSecondParameter.LAST_DATA,
          chunks[chunks.length - 1]
        )

        if (response.length <= 2) {
          throw new Error('Invalid signature returned from Ledger')
        }

        return this.#derSignatureToHex(response.toString('hex'))
      } finally {
        this.emitter.emit('getSignatureEnd')
      }
    }
  }

  #sendChunk(
    transport: Transport,
    command: EAtipicialDappKitLedgerServiceAtipicialCommand,
    commandIndex: number,
    secondParameter: EAtipicialDappKitLedgerServiceAtipicialSecondParameter,
    chunk?: string
  ) {
    return transport.send(0x80, command, commandIndex, secondParameter, chunk ? Buffer.from(chunk, 'hex') : undefined, [
      EAtipicialDappKitLedgerServiceAtipicialStatus.OK,
    ])
  }

  #bipPathToHex(path: string): string {
    let result = ''
    const components = path.split('/')

    components.forEach(element => {
      let number = parseInt(element, 10)

      if (isNaN(number)) {
        return
      }

      if (element.length > 1 && element[element.length - 1] === "'") {
        number += 0x80000000
      }

      result += number.toString(16).padStart(8, '0')
    })

    return result
  }

  #derSignatureToHex(response: string): string {
    const { u } = BSAtipicialAtipicialJsSingletonHelper.getInstance()

    const ss = new u.StringStream(response)
    // The first byte is format. It is usually 0x30 (SEQ) or 0x31 (SET)
    // The second byte represents the total length of the DER module.
    ss.read(2)
    // Now we read each field off
    // Each field is encoded with a type byte, length byte followed by the data itself
    ss.read(1) // Read and drop the type
    const r = ss.readVarBytes()
    ss.read(1)
    const s = ss.readVarBytes()

    // We will need to ensure both integers are 32 bytes long
    const integers = [r, s].map(i => {
      if (i.length < 64) {
        i = '0'.repeat(i.length - 64) + i
      }
      if (i.length > 64) {
        i = i.substr(-64)
      }
      return i
    })

    return integers.join('')
  }
}
