import type { TBSNetwork } from '@atipicial/blockchain-service'
import { BSAtipicialConstants } from '../constants/BSAtipicialConstants'
import type { TBSAtipicialNetworkId } from '../types'

export class BSAtipicialHelper {
  static getTokens(network: TBSNetwork<TBSAtipicialNetworkId>) {
    const extraTokens = BSAtipicialConstants.EXTRA_TOKENS_BY_NETWORK_ID[network.id] ?? []
    return [...extraTokens, ...BSAtipicialConstants.NATIVE_ASSETS]
  }

  static getNdmemeToken(network: TBSNetwork<TBSAtipicialNetworkId>) {
    if (network.type !== 'mainnet') {
      return { ...BSAtipicialConstants.NDMEME_TOKEN, hash: '-' }
    }

    return BSAtipicialConstants.NDMEME_TOKEN
  }
}
