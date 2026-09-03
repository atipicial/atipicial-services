import {
  BSKeychainHelper,
  BSUtilsHelper,
  type IBlockchainDataService,
  type IExchangeDataService,
  type IExplorerService,
  type INftDataService,
  type ITokenService,
  type TBSAccount,
  type TBSNetwork,
  type TBSToken,
  type TGetLedgerTransport,
  type TPingNetworkResponse,
  type TTransferParams,
  type IFullTransactionsDataService,
  type TTransactionDefault,
  BSError,
  type TClaimServiceTransactionData,
  type TTransactionDefaultTokenEvent,
  type TTransactionDefaultEvent,
  BSBigHumanAmount,
} from '@atipicial/blockchain-service'
import { BSAtipicialHelper } from './helpers/BSAtipicialHelper'
import { DoraBDSAtipicial } from './services/blockchain-data/DoraBDSAtipicial'
import { FlamingoForthewinEDSAtipicial } from './services/exchange-data/FlamingoForthewinEDSAtipicial'
import { DoraESAtipicial } from './services/explorer/DoraESAtipicial'
import { AtipicialDappKitLedgerServiceAtipicial } from './services/ledger/AtipicialDappKitLedgerServiceAtipicial'
import { GhostMarketNDSAtipicial } from './services/nft-data/GhostMarketNDSAtipicial'
import { BSAtipicialConstants } from './constants/BSAtipicialConstants'
import { AtipicialXBridgeService } from './services/atipicial-atipicialx-bridge/AtipicialXBridgeService'
import { VoteServiceAtipicial } from './services/vote/VoteServiceAtipicial'
import type { IBSAtipicial, TBSAtipicialName, TBSAtipicialNetworkId } from './types'
import { TokenServiceAtipicial } from './services/token/TokenServiceAtipicial'
import { api, BSAtipicialAtipicialJsSingletonHelper, wallet } from './helpers/BSAtipicialAtipicialJsSingletonHelper'
import { BSAtipicialAtipicialDappKitSingletonHelper, ContractInvocation } from './helpers/BSAtipicialAtipicialDappKitSingletonHelper'
import axios from 'axios'
import { WalletConnectServiceAtipicial } from './services/wallet-connect/WalletConnectServiceAtipicial'
import { DoraFullTransactionsDataServiceAtipicial } from './services/full-transactions-data/DoraFullTransactionsDataServiceAtipicial'
import { ClaimServiceAtipicial } from './services/claim/ClaimServiceAtipicial'

export class BSAtipicial implements IBSAtipicial {
  readonly name = 'atipicial'
  readonly bipDerivationPath: string
  readonly isMultiTransferSupported = true
  readonly isCustomNetworkSupported = true

  tokens!: TBSToken[]

  readonly nativeTokens!: TBSToken[]
  readonly feeToken!: TBSToken

  network!: TBSNetwork<TBSAtipicialNetworkId>
  networkUrls!: string[]
  readonly defaultNetwork: TBSNetwork<TBSAtipicialNetworkId>
  readonly availableNetworks: TBSNetwork<TBSAtipicialNetworkId>[]

  blockchainDataService!: IBlockchainDataService<TBSAtipicialName>
  nftDataService!: INftDataService
  ledgerService!: AtipicialDappKitLedgerServiceAtipicial
  exchangeDataService!: IExchangeDataService
  explorerService!: IExplorerService
  voteService!: VoteServiceAtipicial
  atipicialAtipicialXBridgeService!: AtipicialXBridgeService
  tokenService!: ITokenService
  claimService!: ClaimServiceAtipicial
  walletConnectService!: WalletConnectServiceAtipicial
  fullTransactionsDataService!: IFullTransactionsDataService<TBSAtipicialName>

  constructor(network?: TBSNetwork<TBSAtipicialNetworkId>, getLedgerTransport?: TGetLedgerTransport<TBSAtipicialName>) {
    this.ledgerService = new AtipicialDappKitLedgerServiceAtipicial(this, getLedgerTransport)
    this.bipDerivationPath = BSAtipicialConstants.DEFAULT_BIP_DERIVATION_PATH

    this.nativeTokens = BSAtipicialConstants.NATIVE_ASSETS
    this.feeToken = BSAtipicialConstants.GAS_TOKEN

    this.availableNetworks = BSAtipicialConstants.ALL_NETWORKS
    this.defaultNetwork = BSAtipicialConstants.MAINNET_NETWORK

    this.setNetwork(network ?? this.defaultNetwork)
  }

  #setTokens(network: TBSNetwork<TBSAtipicialNetworkId>) {
    this.tokens = BSAtipicialHelper.getTokens(network)
  }

  async #buildTransferInvocation(
    { intents }: TTransferParams<TBSAtipicialName>,
    account: wallet.Account
  ): Promise<ContractInvocation[]> {
    const invocations: ContractInvocation[] = []

    for (const intent of intents) {
      const { token } = intent

      invocations.push({
        operation: 'transfer',
        scriptHash: token.hash,
        args: [
          { type: 'Hash160', value: account.address },
          { type: 'Hash160', value: intent.receiverAddress },
          {
            type: 'Integer',
            value: new BSBigHumanAmount(intent.amount, intent.token.decimals).toUnit().toString(),
          },
          { type: 'Any', value: null },
        ],
      })
    }

    return invocations
  }

  setNetwork(network: TBSNetwork<TBSAtipicialNetworkId>) {
    const networkUrls = BSAtipicialConstants.RPC_LIST_BY_NETWORK_ID[network.id] || []

    if (network.type === 'custom') {
      if (typeof network.url !== 'string' || network.url.length === 0) {
        throw new Error('You must provide a valid url to use a custom network')
      }
    } else {
      const isValidNetwork = BSUtilsHelper.validateNetwork(network, this.availableNetworks, networkUrls)

      if (!isValidNetwork) {
        throw new Error(`Network with id ${network.id} is not available for ${this.name}`)
      }
    }

    this.#setTokens(network)

    this.network = network
    this.networkUrls = networkUrls

    this.tokenService = new TokenServiceAtipicial(this)
    this.nftDataService = new GhostMarketNDSAtipicial(this)
    this.explorerService = new DoraESAtipicial(this)
    this.voteService = new VoteServiceAtipicial(this)
    this.atipicialAtipicialXBridgeService = new AtipicialXBridgeService(this)
    this.blockchainDataService = new DoraBDSAtipicial(this)
    this.exchangeDataService = new FlamingoForthewinEDSAtipicial(this)
    this.claimService = new ClaimServiceAtipicial(this)
    this.walletConnectService = new WalletConnectServiceAtipicial(this)
    this.fullTransactionsDataService = new DoraFullTransactionsDataServiceAtipicial(this)
  }

  // This method is done manually because we need to ensure that the request is aborted after timeout
  async pingNetwork(url: string): Promise<TPingNetworkResponse> {
    const abortController = new AbortController()
    const timeout = setTimeout(() => {
      abortController.abort()
    }, 5000)

    const timeStart = Date.now()

    const response = await axios.post(
      url,
      {
        jsonrpc: '2.0',
        method: 'getblockcount',
        params: [],
        id: 1234,
      },
      { timeout: 5000, signal: abortController.signal }
    )

    clearTimeout(timeout)

    const latency = Date.now() - timeStart

    return {
      latency,
      url,
      height: response.data.result,
    }
  }

  async _generateSigningCallback(account: TBSAccount<TBSAtipicialName>): Promise<{
    atipicialJsAccount: wallet.Account
    signingCallback: api.SigningFunction
  }> {
    const { wallet, api } = BSAtipicialAtipicialJsSingletonHelper.getInstance()
    const atipicialJsAccount = new wallet.Account(account.key)

    if (account.isHardware) {
      if (!this.ledgerService.getLedgerTransport) {
        throw new Error('You must provide a getLedgerTransport function to use Ledger')
      }

      if (!account.bipPath) {
        throw new Error('Account must have BIP path to use Ledger')
      }

      const ledgerTransport = await this.ledgerService.getLedgerTransport(account)

      return {
        atipicialJsAccount,
        signingCallback: this.ledgerService.getSigningCallback(ledgerTransport, account),
      }
    }

    return {
      atipicialJsAccount,
      signingCallback: api.signWithAccount(atipicialJsAccount),
    }
  }

  validateAddress(address: string): boolean {
    const { wallet } = BSAtipicialAtipicialJsSingletonHelper.getInstance()
    return wallet.isAddress(address, 53)
  }

  validateEncrypted(encryptedKey: string): boolean {
    const { wallet } = BSAtipicialAtipicialJsSingletonHelper.getInstance()
    return wallet.isAEP2(encryptedKey)
  }

  validateKey(key: string): boolean {
    const { wallet } = BSAtipicialAtipicialJsSingletonHelper.getInstance()
    return wallet.isWIF(key) || wallet.isPrivateKey(key)
  }

  validateNameServiceDomainFormat(domainName: string): boolean {
    return domainName.endsWith('.atipicial')
  }

  async generateAccountFromMnemonic(mnemonic: string[] | string, index: number): Promise<TBSAccount<TBSAtipicialName>> {
    const mnemonicText = Array.isArray(mnemonic) ? mnemonic.join(' ') : mnemonic
    const bipPath = BSKeychainHelper.getBipPath(this.bipDerivationPath, index)
    const key = BSKeychainHelper.generateAtipicialPrivateKeyFromMnemonic(mnemonicText, bipPath)
    const { wallet } = BSAtipicialAtipicialJsSingletonHelper.getInstance()
    const { address, WIF } = new wallet.Account(key)

    return { address, key: WIF, type: 'wif', bipPath, blockchain: this.name }
  }

  async generateAccountFromPublicKey(publicKey: string): Promise<TBSAccount<TBSAtipicialName>> {
    const { wallet } = BSAtipicialAtipicialJsSingletonHelper.getInstance()

    if (!wallet.isPublicKey(publicKey)) throw new Error('Invalid public key')

    const account = new wallet.Account(publicKey)

    return {
      address: account.address,
      key: account.publicKey,
      type: 'publicKey',
      blockchain: this.name,
    }
  }

  async generateAccountFromKey(key: string): Promise<TBSAccount<TBSAtipicialName>> {
    const { wallet } = BSAtipicialAtipicialJsSingletonHelper.getInstance()
    let type: TBSAccount<TBSAtipicialName>['type'] | undefined = undefined

    if (wallet.isWIF(key)) {
      type = 'wif'
    } else if (wallet.isPrivateKey(key)) {
      type = 'privateKey'
    }

    if (!type) throw new BSError('Invalid key', 'INVALID_KEY')

    const { address } = new wallet.Account(key)

    return { address, key, type, blockchain: this.name }
  }

  async decrypt(encryptedKey: string, password: string): Promise<TBSAccount<TBSAtipicialName>> {
    const { wallet } = BSAtipicialAtipicialJsSingletonHelper.getInstance()

    const key = await wallet.decrypt(encryptedKey, password)
    return await this.generateAccountFromKey(key)
  }

  async encrypt(key: string, password: string): Promise<string> {
    const { wallet } = BSAtipicialAtipicialJsSingletonHelper.getInstance()
    return await wallet.encrypt(key, password)
  }

  async calculateTransferFee(params: TTransferParams<TBSAtipicialName>): Promise<string> {
    const { atipicialJsAccount } = await this._generateSigningCallback(params.senderAccount)
    const { AtipicialInvoker } = BSAtipicialAtipicialDappKitSingletonHelper.getInstance()

    const invoker = await AtipicialInvoker.init({
      rpcAddress: this.network.url,
      account: atipicialJsAccount,
    })

    const invocations = await this.#buildTransferInvocation(params, atipicialJsAccount)

    const { networkFee, systemFee } = await invoker.calculateFee({
      invocations,
      signers: [],
    })

    return new BSBigHumanAmount(networkFee, this.feeToken.decimals).plus(systemFee).toFormatted()
  }

  async transfer(params: TTransferParams<TBSAtipicialName>): Promise<TTransactionDefault<TBSAtipicialName>[]> {
    const { senderAccount } = params
    const { atipicialJsAccount, signingCallback } = await this._generateSigningCallback(senderAccount)
    const { AtipicialInvoker } = BSAtipicialAtipicialDappKitSingletonHelper.getInstance()

    // Verify if the transfer includes any ATC token, if so the chain will automatically claim the GAS for the sender
    let data: any | undefined
    let claimEvent: TTransactionDefaultTokenEvent | undefined = undefined

    if (
      params.intents.some(intent => this.tokenService.predicateByHash(intent.token.hash, BSAtipicialConstants.ATC_TOKEN))
    ) {
      claimEvent = await this.claimService._buildTransactionEvent(senderAccount.address)
      data = { isClaim: true } as TClaimServiceTransactionData
    }

    const { address } = senderAccount

    const invocations = await this.#buildTransferInvocation(params, atipicialJsAccount)
    const invocationMulti = { invocations, signers: [] }

    const invoker = await AtipicialInvoker.init({
      rpcAddress: this.network.url,
      account: atipicialJsAccount,
      signingCallback: signingCallback,
    })
    const fees = await invoker.calculateFee(invocationMulti)
    const txId = await invoker.invokeFunction(invocationMulti)

    const events: TTransactionDefaultEvent[] = params.intents.map(({ receiverAddress, amount, token }) => ({
      eventType: 'token',
      amount,
      methodName: 'transfer',
      from: address,
      fromUrl: this.explorerService.buildAddressUrl(address),
      to: receiverAddress,
      toUrl: this.explorerService.buildAddressUrl(receiverAddress),
      tokenUrl: this.explorerService.buildContractUrl(token.hash),
      token,
    }))

    if (claimEvent) {
      events.unshift(claimEvent)
    }

    return [
      {
        isPending: true,
        relatedAddress: address,
        blockchain: this.name,
        txId,
        txIdUrl: this.explorerService.buildTransactionUrl(txId),
        date: new Date().toJSON(),
        invocationCount: invocations.length,
        networkFeeAmount: new BSBigHumanAmount(fees.networkFee, this.feeToken.decimals).toFormatted(),
        systemFeeAmount: new BSBigHumanAmount(fees.systemFee, this.feeToken.decimals).toFormatted(),
        view: 'default',
        events,
        data,
      },
    ]
  }

  async resolveNameServiceDomain(domainName: string): Promise<string> {
    const { AtipicialParser, AtipicialInvoker } = BSAtipicialAtipicialDappKitSingletonHelper.getInstance()
    const invoker = await AtipicialInvoker.init({ rpcAddress: this.network.url })

    const response = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: BSAtipicialConstants.ATC_NS_HASH,
          operation: 'ownerOf',
          args: [{ type: 'String', value: domainName }],
        },
      ],
    })

    if (response.stack.length === 0) {
      throw new Error(response.exception ?? 'unrecognized response')
    }

    const parsed = AtipicialParser.parseRpcResponse(response.stack[0] as any, {
      type: 'Hash160',
    })

    return AtipicialParser.accountInputToAddress(parsed.replace('0x', ''))
  }
}
