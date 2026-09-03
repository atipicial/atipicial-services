import {
  FlamingoForthewinEDS,
  type TGetTokenPriceHistoryParams,
  type TGetTokenPricesParams,
  type TTokenPricesHistoryResponse,
  type TTokenPricesResponse,
} from '@atipicial/blockchain-service'
import type { IBSAtipicial, TBSAtipicialName, TBSAtipicialNetworkId } from '../../types'

export class FlamingoForthewinEDSAtipicial extends FlamingoForthewinEDS<TBSAtipicialName, TBSAtipicialNetworkId> {
  constructor(service: IBSAtipicial) {
    super(service)
  }

  async getTokenPrices(params: TGetTokenPricesParams): Promise<TTokenPricesResponse[]> {
    if (this._service.network.type !== 'mainnet') throw new Error('Exchange is only available on Mainnet')

    return await super.getTokenPrices(params)
  }

  async getTokenPriceHistory(params: TGetTokenPriceHistoryParams): Promise<TTokenPricesHistoryResponse[]> {
    if (this._service.network.type !== 'mainnet') throw new Error('Exchange is only available on Mainnet')

    return await super.getTokenPriceHistory(params)
  }
}
