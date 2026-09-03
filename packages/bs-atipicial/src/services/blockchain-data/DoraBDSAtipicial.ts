import {
  BSBigHumanAmount,
  BSBigUnitAmount,
  BSCommonConstants,
  type TBalanceResponse,
  type TBSToken,
  type TContractResponse,
  type TGetTransactionsByAddressParams,
  type TGetTransactionsByAddressResponse,
  type TTransactionDefault,
} from '@atipicial/blockchain-service'
import { api } from '@atipicial/dora-ts'
import { RpcBDSAtipicial } from './RpcBDSAtipicial'
import type { IBSAtipicial, TBSAtipicialName, TRpcBDSAtipicialNotification } from '../../types'
import { Notification } from '@atipicial/dora-ts/dist/interfaces/api/atipicial'

export class DoraBDSAtipicial extends RpcBDSAtipicial {
  static getClient() {
    return new api.AtipicialRESTApi({ url: BSCommonConstants.COZ_API_URL, endpoint: '/api/v2/atipicial' })
  }

  #apiInstance?: api.AtipicialRESTApi

  constructor(service: IBSAtipicial) {
    super(service)
  }

  get #api() {
    if (!this.#apiInstance) {
      this.#apiInstance = DoraBDSAtipicial.getClient()
    }

    return this.#apiInstance
  }

  async getTransaction(hash: string): Promise<TTransactionDefault<TBSAtipicialName>> {
    if (this._service.network.type === 'custom') {
      return await super.getTransaction(hash)
    }

    const response = await this.#api.transaction(hash, this._service.network.id)

    const applicationLog = await this.#api.log(hash, this._service.network.id)
    const notifications = (applicationLog.notifications as unknown as Notification[])?.map(
      ({ contract, state, event_name }) => ({
        contract,
        state,
        eventname: event_name,
      })
    )

    const txId = response.hash
    const txIdUrl = this._service.explorerService.buildTransactionUrl(txId)

    const events = await this._extractEventsFromNotifications(notifications)

    const data = {
      ...this._service.claimService._getTransactionDataFromEvents(events),
      ...this._service.voteService._getTransactionDataFromEvents(events),
    }

    return {
      blockchain: this._service.name,
      isPending: false,
      txId,
      txIdUrl,
      block: response.block,
      date: new Date(Number(response.time) * 1000).toJSON(),
      systemFeeAmount: new BSBigUnitAmount(response.sysfee, this._service.feeToken.decimals).toHuman().toFormatted(),
      networkFeeAmount: new BSBigUnitAmount(response.netfee, this._service.feeToken.decimals).toHuman().toFormatted(),
      invocationCount: 0,
      notificationCount: notifications.length,
      view: 'default',
      events,
      data,
    }
  }

  async getTransactionsByAddress({
    address,
    nextPageParams = 1,
  }: TGetTransactionsByAddressParams): Promise<
    TGetTransactionsByAddressResponse<TBSAtipicialName, TTransactionDefault<TBSAtipicialName>>
  > {
    if (this._service.network.type === 'custom') {
      return await super.getTransactionsByAddress({ address, nextPageParams })
    }

    const data = await this.#api.addressTXFull(address, nextPageParams, this._service.network.id)

    const transactions: TTransactionDefault<TBSAtipicialName>[] = []

    const promises = data.items.map(async (item, index) => {
      const notifications = item.notifications?.map<TRpcBDSAtipicialNotification>(({ contract, state, event_name }) => ({
        contract,
        state,
        eventname: event_name,
      }))

      const events = await this._extractEventsFromNotifications(notifications)

      const txId = item.hash
      const txIdUrl = this._service.explorerService.buildTransactionUrl(txId)

      const data = {
        ...this._service.claimService._getTransactionDataFromEvents(events),
        ...this._service.voteService._getTransactionDataFromEvents(events),
      }

      const transaction: TTransactionDefault<TBSAtipicialName> = {
        blockchain: this._service.name,
        isPending: false,
        relatedAddress: address,
        txId,
        txIdUrl,
        block: item.block,
        date: new Date(Number(item.time) * 1000).toJSON(),
        systemFeeAmount: new BSBigUnitAmount(item.sysfee, this._service.feeToken.decimals).toHuman().toFormatted(),
        networkFeeAmount: new BSBigUnitAmount(item.netfee, this._service.feeToken.decimals).toHuman().toFormatted(),
        invocationCount: 0,
        notificationCount: notifications.length,
        view: 'default',
        events,
        data,
      }

      transactions.splice(index, 0, transaction)
    })

    await Promise.allSettled(promises)

    const limit = 15
    const totalPages = Math.ceil(data.totalCount / limit)

    return {
      nextPageParams: nextPageParams < totalPages ? nextPageParams + 1 : undefined,
      transactions,
    }
  }

  async getContract(contractHash: string): Promise<TContractResponse> {
    if (this._service.network.type === 'custom') {
      return await super.getContract(contractHash)
    }

    try {
      const data = await this.#api.contract(contractHash, this._service.network.id)
      return {
        hash: data.hash,
        methods: data.manifest.abi?.methods ?? [],
        name: data.manifest.name,
      }
    } catch {
      throw new Error(`Contract not found: ${contractHash}`)
    }
  }

  async getTokenInfo(tokenHash: string): Promise<TBSToken> {
    if (this._service.network.type === 'custom') {
      return await super.getTokenInfo(tokenHash)
    }

    try {
      const cachedToken = this._tokenCache.get(tokenHash)
      if (cachedToken) {
        return cachedToken
      }

      let token = this._service.tokens.find(token => this._service.tokenService.predicateByHash(tokenHash, token))

      if (!token) {
        const { decimals, symbol, name, scripthash } = await this.#api.asset(tokenHash, this._service.network.id)
        token = this._service.tokenService.normalizeToken({
          decimals: Number(decimals),
          symbol,
          name,
          hash: scripthash,
        })
      }

      this._tokenCache.set(tokenHash, token)

      return token
    } catch {
      throw new Error(`TBSToken not found: ${tokenHash}`)
    }
  }

  async getBalance(address: string): Promise<TBalanceResponse[]> {
    if (this._service.network.type === 'custom') {
      return await super.getBalance(address)
    }

    const response = await this.#api.balance(address, this._service.network.id)

    const promises = response.map<Promise<TBalanceResponse | undefined>>(async balance => {
      try {
        const token = await this.getTokenInfo(balance.asset)
        return {
          amount: new BSBigHumanAmount(balance.balance, token.decimals).toFormatted(),
          token,
        }
      } catch {
        // Empty block
      }
    })
    const balances = await Promise.all(promises)

    return balances.filter(balance => balance !== undefined) as TBalanceResponse[]
  }
}
