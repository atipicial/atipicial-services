import {
  BSBigHumanAmount,
  BSFullTransactionsByAddressHelper,
  BSUtilsHelper,
  type IFullTransactionsDataService,
  type TExportFullTransactionsByAddressParams,
  type TGetFullTransactionsByAddressParams,
  type TGetTransactionsByAddressResponse,
  type TAtipicialXBridgeTransactionData,
  type TTransactionDefault,
  type TTransactionDefaultEvent,
} from '@atipicial/blockchain-service'
import type { IBSAtipicial, TBSAtipicialName, TBSAtipicialNetworkId } from '../../types'
import { DoraBDSAtipicial } from '../blockchain-data/DoraBDSAtipicial'
import type { api } from '@atipicial/dora-ts'

export class DoraFullTransactionsDataServiceAtipicial implements IFullTransactionsDataService<TBSAtipicialName> {
  static readonly SUPPORTED_AEP11_STANDARDS: string[] = ['aep11', 'aep-11']
  static readonly SUPPORTED_NETWORKS_IDS: TBSAtipicialNetworkId[] = ['mainnet', 'testnet']

  readonly #service: IBSAtipicial

  #apiInstance?: api.AtipicialRESTApi

  constructor(service: IBSAtipicial) {
    this.#service = service
  }

  get #api() {
    if (!this.#apiInstance) {
      this.#apiInstance = DoraBDSAtipicial.getClient()
    }

    return this.#apiInstance
  }

  async getFullTransactionsByAddress({
    nextPageParams,
    ...params
  }: TGetFullTransactionsByAddressParams): Promise<
    TGetTransactionsByAddressResponse<TBSAtipicialName, TTransactionDefault<TBSAtipicialName>>
  > {
    BSFullTransactionsByAddressHelper.validateFullTransactionsByAddressParams({
      service: this.#service,
      supportedNetworksIds: DoraFullTransactionsDataServiceAtipicial.SUPPORTED_NETWORKS_IDS,
      ...params,
    })

    const response = await this.#api.getFullTransactionsByAddress({
      address: params.address,
      timestampFrom: params.dateFrom,
      timestampTo: params.dateTo,
      network: this.#service.network.id as 'mainnet' | 'testnet',
      cursor: nextPageParams,
      pageLimit: params.pageSize ?? 50,
    })

    const items = response.data ?? []
    const transactions: TTransactionDefault<TBSAtipicialName>[] = []

    const itemPromises = items.map(async ({ networkFeeAmount, ...item }, index) => {
      const txId = item.transactionID
      const txIdUrl = this.#service.explorerService.buildTransactionUrl(txId)

      const events: TTransactionDefaultEvent[] = []

      const eventPromises = item.events.map(async (event, eventIndex) => {
        const { methodName, tokenID: tokenHash, contractHash } = event
        const from = event.from || undefined
        const to = event.to || undefined
        const fromUrl = from ? this.#service.explorerService.buildAddressUrl(from) : undefined
        const toUrl = to ? this.#service.explorerService.buildAddressUrl(to) : undefined
        const standard = event.supportedStandards?.[0]?.toLowerCase() ?? ''
        const isNft = DoraFullTransactionsDataServiceAtipicial.SUPPORTED_AEP11_STANDARDS.includes(standard) && !!tokenHash

        if (isNft) {
          const [nft] = await BSUtilsHelper.tryCatch(() =>
            this.#service.nftDataService.getNft({ collectionHash: contractHash, tokenHash })
          )

          events.splice(eventIndex, 0, {
            eventType: 'nft',
            amount: '1',
            methodName,
            from,
            fromUrl,
            to,
            toUrl,
            nft,
          })

          return
        }

        const [token] = await BSUtilsHelper.tryCatch(() =>
          this.#service.blockchainDataService.getTokenInfo(contractHash)
        )

        events.splice(eventIndex, 0, {
          eventType: 'token',
          amount: event.amount
            ? new BSBigHumanAmount(event.amount, token?.decimals ?? event.tokenDecimals).toFormatted()
            : undefined,
          methodName,
          from,
          fromUrl,
          to,
          toUrl,
          tokenUrl: token ? this.#service.explorerService.buildContractUrl(token.hash) : undefined,
          token,
        })
      })

      await Promise.allSettled(eventPromises)

      const itemData = 'data' in item ? (item.data as any) : undefined

      let data = {
        ...this.#service.claimService._getTransactionDataFromEvents(events),
        ...this.#service.voteService._getTransactionDataFromEvents(events),
      }

      const bridgeData = itemData?.bridgeData as Record<string, any> | undefined

      if (bridgeData) {
        const bridgeService = this.#service.atipicialAtipicialXBridgeService
        const tokenService = this.#service.tokenService

        const tokenToUse = !bridgeData.atipicialTokenHash
          ? bridgeService.gasToken
          : bridgeService.tokens.find(token => tokenService.predicateByHash(bridgeData.atipicialTokenHash, token))

        if (tokenToUse) {
          const newBridgeData: TAtipicialXBridgeTransactionData<TBSAtipicialName> = {
            atipicialAtipicialxBridge: {
              amount: new BSBigHumanAmount(bridgeData.amount, tokenToUse.decimals).toFormatted(),
              tokenToUse,
              receiverAddress: bridgeData.receiverAddress,
            },
          }

          data = {
            ...data,
            ...newBridgeData,
          }
        }
      }

      const newItem: TTransactionDefault<TBSAtipicialName> = {
        blockchain: this.#service.name,
        isPending: false,
        relatedAddress: params.address,
        txId,
        txIdUrl,
        block: item.block,
        date: item.date,
        invocationCount: itemData?.invocationCount,
        notificationCount: itemData?.notificationCount,
        networkFeeAmount: networkFeeAmount
          ? new BSBigHumanAmount(networkFeeAmount, this.#service.feeToken.decimals).toFormatted()
          : undefined,
        systemFeeAmount: itemData?.systemFeeAmount
          ? new BSBigHumanAmount(itemData.systemFeeAmount, this.#service.feeToken.decimals).toFormatted()
          : undefined,
        view: 'default',
        events,
        data,
      }

      transactions.splice(index, 0, newItem)
    })

    await Promise.allSettled(itemPromises)

    return { nextPageParams: response.nextCursor, transactions }
  }

  async exportFullTransactionsByAddress(params: TExportFullTransactionsByAddressParams): Promise<string> {
    BSFullTransactionsByAddressHelper.validateFullTransactionsByAddressParams({
      service: this.#service,
      supportedNetworksIds: DoraFullTransactionsDataServiceAtipicial.SUPPORTED_NETWORKS_IDS,
      ...params,
    })

    return await this.#api.exportFullTransactionsByAddress({
      address: params.address,
      timestampFrom: params.dateFrom,
      timestampTo: params.dateTo,
      network: this.#service.network.id as 'mainnet' | 'testnet',
    })
  }
}
