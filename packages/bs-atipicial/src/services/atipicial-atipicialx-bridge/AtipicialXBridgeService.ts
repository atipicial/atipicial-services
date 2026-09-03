import {
  BSBigHumanAmount,
  BSBigUnitAmount,
  BSError,
  IAtipicialXBridgeService,
  TBridgeToken,
  TAtipicialXBridgeServiceBridgeParam,
  TAtipicialXBridgeServiceConstants,
  TAtipicialXBridgeServiceGetNonceParams,
  TAtipicialXBridgeServiceGetTransactionHashByNonceParams,
  type TAtipicialXBridgeTransactionData,
  type TTransactionBase,
} from '@atipicial/blockchain-service'
import type { StateResponse, TypedResponse } from '@atipicial/dora-ts/dist/interfaces/api/common'
import { LogResponse, type Notification } from '@atipicial/dora-ts/dist/interfaces/api/atipicial'
import axios from 'axios'
import { BSAtipicialConstants } from '../../constants/BSAtipicialConstants'
import { BSAtipicialHelper } from '../../helpers/BSAtipicialHelper'
import {
  BSAtipicialAtipicialDappKitSingletonHelper,
  ContractInvocation,
  Signer,
} from '../../helpers/BSAtipicialAtipicialDappKitSingletonHelper'
import type { IBSAtipicial, TBSAtipicialName, TAtipicialXBridgeServiceGetBridgeTxByNonceApiResponse } from '../../types'
import { DoraBDSAtipicial } from '../blockchain-data/DoraBDSAtipicial'

export class AtipicialXBridgeService implements IAtipicialXBridgeService<TBSAtipicialName> {
  static readonly BRIDGE_SCRIPT_HASH: string = '0xbb19cfc864b73159277e1fd39694b3fd5fc613d2'

  readonly #service: IBSAtipicial

  readonly gasToken: TBridgeToken<TBSAtipicialName>
  readonly atipicialToken: TBridgeToken<TBSAtipicialName>
  readonly ndmemeToken: TBridgeToken<TBSAtipicialName>
  readonly tokens: TBridgeToken<TBSAtipicialName>[]

  constructor(service: IBSAtipicial) {
    this.#service = service

    const ndmemeToken = BSAtipicialHelper.getNdmemeToken(this.#service.network)

    this.gasToken = { ...BSAtipicialConstants.GAS_TOKEN, blockchain: service.name, multichainId: 'gas' }
    this.atipicialToken = { ...BSAtipicialConstants.ATC_TOKEN, blockchain: service.name, multichainId: 'atipicial' }
    this.ndmemeToken = {
      ...ndmemeToken,
      blockchain: service.name,
      multichainId: 'ndmeme',
    }
    this.tokens = [this.gasToken, this.atipicialToken, this.ndmemeToken]
  }

  async getApprovalFee(): Promise<string> {
    throw new BSError('Atipicial does not require approval', 'APPROVAl_NOT_NEEDED')
  }

  async getBridgeConstants(token: TBridgeToken<TBSAtipicialName>): Promise<TAtipicialXBridgeServiceConstants> {
    const { TypeChecker, AtipicialInvoker } = BSAtipicialAtipicialDappKitSingletonHelper.getInstance()

    const invoker = await AtipicialInvoker.init({
      rpcAddress: this.#service.network.url,
    })

    const isNativeToken = this.#service.tokenService.predicateByHash(token, BSAtipicialConstants.GAS_TOKEN)

    let invocations: ContractInvocation[]

    if (isNativeToken) {
      invocations = [
        { operation: 'nativeDepositFee', scriptHash: AtipicialXBridgeService.BRIDGE_SCRIPT_HASH, args: [] },
        { operation: 'minNativeDeposit', scriptHash: AtipicialXBridgeService.BRIDGE_SCRIPT_HASH, args: [] },
        { operation: 'maxNativeDeposit', scriptHash: AtipicialXBridgeService.BRIDGE_SCRIPT_HASH, args: [] },
      ]
    } else {
      invocations = [
        {
          operation: 'tokenDepositFee',
          scriptHash: AtipicialXBridgeService.BRIDGE_SCRIPT_HASH,
          args: [{ type: 'Hash160', value: token.hash }],
        },
        {
          operation: 'minTokenDeposit',
          scriptHash: AtipicialXBridgeService.BRIDGE_SCRIPT_HASH,
          args: [{ type: 'Hash160', value: token.hash }],
        },
        {
          operation: 'maxTokenDeposit',
          scriptHash: AtipicialXBridgeService.BRIDGE_SCRIPT_HASH,
          args: [{ type: 'Hash160', value: token.hash }],
        },
      ]
    }

    const response = await invoker.testInvoke({
      invocations,
    })

    const [depositFeeItem, minDepositItem, maxDepositItem] = response.stack

    if (
      !TypeChecker.isStackTypeInteger(depositFeeItem) ||
      !TypeChecker.isStackTypeInteger(minDepositItem) ||
      !TypeChecker.isStackTypeInteger(maxDepositItem)
    )
      throw new BSError('Invalid response', 'INVALID_RESPONSE')

    const bridgeFee = new BSBigUnitAmount(depositFeeItem.value, BSAtipicialConstants.GAS_TOKEN.decimals)
      .toHuman()
      .toFormatted()
    const bridgeMinAmount = new BSBigUnitAmount(minDepositItem.value, token.decimals).toHuman().toFormatted()
    const bridgeMaxAmount = new BSBigUnitAmount(maxDepositItem.value, token.decimals).toHuman().toFormatted()

    return {
      bridgeFee,
      bridgeMinAmount,
      bridgeMaxAmount,
    }
  }

  async bridge(params: TAtipicialXBridgeServiceBridgeParam<TBSAtipicialName>): Promise<string> {
    if (this.#service.network.type !== 'mainnet') {
      throw new BSError('Bridging to AtipicialX is only supported on mainnet', 'UNSUPPORTED_NETWORK')
    }

    const { account } = params

    const { atipicialJsAccount, signingCallback } = await this.#service._generateSigningCallback(account)

    const { AtipicialInvoker } = BSAtipicialAtipicialDappKitSingletonHelper.getInstance()

    const invoker = await AtipicialInvoker.init({
      rpcAddress: this.#service.network.url,
      account: atipicialJsAccount,
      signingCallback,
    })

    const contractInvocation: ContractInvocation = {
      scriptHash: AtipicialXBridgeService.BRIDGE_SCRIPT_HASH,
      operation: 'depositNative',
      args: [
        { type: 'Hash160', value: atipicialJsAccount.address },
        { type: 'Hash160', value: params.receiverAddress },
        {
          type: 'Integer',
          value: new BSBigHumanAmount(params.amount, params.token.decimals).toUnit().toFixed(),
        },
        {
          type: 'Integer',
          value: new BSBigHumanAmount(params.bridgeFee, BSAtipicialConstants.GAS_TOKEN.decimals).toUnit().toFixed(),
        },
      ],
    }

    const signer: Signer = {
      scopes: 16,
      allowedContracts: [AtipicialXBridgeService.BRIDGE_SCRIPT_HASH, BSAtipicialConstants.GAS_TOKEN.hash],
    }

    const isNativeToken = this.#service.tokenService.predicateByHash(params.token, BSAtipicialConstants.GAS_TOKEN)

    if (!isNativeToken) {
      contractInvocation.operation = 'depositToken'
      contractInvocation.args!.unshift({ type: 'Hash160', value: params.token.hash })
      signer.allowedContracts!.push(params.token.hash)
    }

    return await invoker.invokeFunction({
      invocations: [contractInvocation],
      signers: [signer],
    })
  }

  async getNonce(params: TAtipicialXBridgeServiceGetNonceParams<TBSAtipicialName>): Promise<string> {
    let log: LogResponse | undefined
    try {
      const api = DoraBDSAtipicial.getClient()
      log = await api.log(params.transactionHash, this.#service.network.id)
    } catch (error) {
      throw new BSError('Failed to get nonce from transaction log', 'FAILED_TO_GET_NONCE', error)
    }

    if (log?.vmstate !== 'HALT') {
      throw new BSError('Transaction invalid', 'INVALID_TRANSACTION')
    }

    const isNativeToken = this.#service.tokenService.predicateByHash(params.token, BSAtipicialConstants.GAS_TOKEN)

    let nonce: string | null

    const notifications = log?.notifications as unknown as Notification[]

    if (isNativeToken) {
      const notification = notifications.find(item => item.event_name === 'NativeDeposit')
      const values = notification?.state as StateResponse
      const value = values?.value as TypedResponse[]
      nonce = value?.[0].value ?? null
    } else {
      const notification = notifications.find(item => item.event_name === 'TokenDeposit')
      const values = notification?.state as StateResponse
      const value = values?.value as TypedResponse[]
      nonce = value?.[2].value ?? null
    }

    if (!nonce) {
      throw new BSError('Nonce not found in transaction log', 'NONCE_NOT_FOUND')
    }

    return nonce
  }

  async getTransactionHashByNonce(
    params: TAtipicialXBridgeServiceGetTransactionHashByNonceParams<TBSAtipicialName>
  ): Promise<string> {
    let data: TAtipicialXBridgeServiceGetBridgeTxByNonceApiResponse | undefined
    try {
      const isNativeToken = this.#service.tokenService.predicateByHash(params.token, BSAtipicialConstants.GAS_TOKEN)

      const response = await axios.post<TAtipicialXBridgeServiceGetBridgeTxByNonceApiResponse>(
        'https://atipicialfura.ngd.network',
        {
          jsonrpc: '2.0',
          method: 'GetBridgeTxByNonce',
          params: {
            ContractHash: AtipicialXBridgeService.BRIDGE_SCRIPT_HASH,
            TokenHash: isNativeToken ? '' : BSAtipicialConstants.ATC_TOKEN.hash,
            Nonce: Number(params.nonce),
          },
          id: 1,
        }
      )
      data = response.data
    } catch (error) {
      throw new BSError('Failed to get transaction by nonce', 'FAILED_TO_GET_TRANSACTION_BY_NONCE', error)
    }

    if (!data?.result) {
      throw new BSError('Failed to get transaction by nonce', 'FAILED_TO_GET_TRANSACTION_BY_NONCE')
    }

    if (data.result.Vmstate !== 'HALT') {
      throw new BSError('Transaction invalid', 'INVALID_TRANSACTION')
    }

    if (!data.result.txid) {
      throw new BSError('Transaction ID not found in response', 'TXID_NOT_FOUND')
    }

    return data.result.txid
  }

  getTokenByMultichainId(multichainId: string): TBridgeToken<TBSAtipicialName> | undefined {
    return this.tokens.find(token => token.multichainId === multichainId)
  }

  getTransactionData(transaction: TTransactionBase): TAtipicialXBridgeTransactionData<TBSAtipicialName> | undefined {
    return transaction.data?.atipicialAtipicialxBridge ? transaction.data : undefined
  }
}
