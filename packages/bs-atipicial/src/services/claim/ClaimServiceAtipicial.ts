import type { IBSAtipicial, TBSAtipicialName } from '../../types'
import { BSAtipicialAtipicialJsSingletonHelper } from '../../helpers/BSAtipicialAtipicialJsSingletonHelper'
import {
  BSBigUnitAmount,
  type IClaimService,
  type TBSAccount,
  type TClaimServiceTransactionData,
  type TTransactionBase,
  type TTransactionDefault,
  type TTransactionDefaultEvent,
  type TTransactionDefaultTokenEvent,
  type TTransferParams,
} from '@atipicial/blockchain-service'
import { BSAtipicialConstants } from '../../constants/BSAtipicialConstants'

export class ClaimServiceAtipicial implements IClaimService<TBSAtipicialName> {
  readonly _service: IBSAtipicial

  claimToken = BSAtipicialConstants.GAS_TOKEN
  burnToken = BSAtipicialConstants.ATC_TOKEN

  constructor(service: IBSAtipicial) {
    this._service = service
  }

  #buildClaimParams(senderAccount: TBSAccount<TBSAtipicialName>): TTransferParams<TBSAtipicialName> {
    return {
      senderAccount,
      intents: [{ amount: '0', receiverAddress: senderAccount.address, token: this.burnToken }],
    }
  }

  _getTransactionDataFromEvents(events: TTransactionDefaultEvent[]): TClaimServiceTransactionData | undefined {
    if (!events?.length) return

    const claimEvent = events.find(event => {
      return (
        event.eventType === 'token' &&
        event.token?.hash === this.claimToken.hash &&
        event.methodName === 'transfer' &&
        !event.from
      )
    })

    if (!claimEvent || !claimEvent.amount) return

    const hasBurnEvent = events.some(
      event =>
        event.eventType === 'token' &&
        event.token?.hash === this.burnToken.hash &&
        event.methodName === 'transfer' &&
        event.from === claimEvent.to
    )

    if (!hasBurnEvent) return

    return { isClaim: true }
  }

  async _buildTransactionEvent(address: string): Promise<TTransactionDefaultTokenEvent> {
    const amount = await this.getUnclaimed(address)

    return {
      eventType: 'token',
      amount,
      methodName: 'transfer',
      to: address,
      toUrl: this._service.explorerService.buildAddressUrl(address),
      tokenUrl: this._service.explorerService.buildContractUrl(this.claimToken.hash),
      token: this.claimToken,
    }
  }

  async getUnclaimed(address: string): Promise<string> {
    const { rpc } = BSAtipicialAtipicialJsSingletonHelper.getInstance()
    const rpcClient = new rpc.RPCClient(this._service.network.url)
    const response = await rpcClient.getUnclaimedGas(address)

    return new BSBigUnitAmount(response, this.claimToken.decimals).toHuman().toFormatted()
  }

  async calculateFee(senderAccount: TBSAccount<TBSAtipicialName>): Promise<string> {
    const claimParams = this.#buildClaimParams(senderAccount)

    return this._service.calculateTransferFee(claimParams)
  }

  async claim(senderAccount: TBSAccount<TBSAtipicialName>): Promise<TTransactionDefault<TBSAtipicialName>> {
    const claimParams = this.#buildClaimParams(senderAccount)
    const [transaction] = await this._service.transfer(claimParams)

    return transaction
  }

  getTransactionData(transaction: TTransactionBase): TClaimServiceTransactionData | undefined {
    return transaction.data?.isClaim === true ? transaction.data : undefined
  }
}
