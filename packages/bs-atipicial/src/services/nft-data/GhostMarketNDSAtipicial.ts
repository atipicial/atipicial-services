import { BSError, GhostMarketNDS, type THasTokenParams } from '@atipicial/blockchain-service'

import type { IBSAtipicial, TBSAtipicialName, TBSAtipicialNetworkId } from '../../types'
import { BSAtipicialAtipicialDappKitSingletonHelper } from '../../helpers/BSAtipicialAtipicialDappKitSingletonHelper'

export class GhostMarketNDSAtipicial extends GhostMarketNDS<TBSAtipicialName, TBSAtipicialNetworkId, IBSAtipicial> {
  static readonly CHAIN_BY_NETWORK_ID: Record<TBSAtipicialNetworkId, string> = {
    mainnet: 'n3',
    testnet: 'n3t',
  }

  constructor(service: IBSAtipicial) {
    super(service)
  }

  async hasToken({ address, collectionHash }: THasTokenParams): Promise<boolean> {
    if (!collectionHash) {
      throw new BSError('collectionHash is required to get NFT from GhostMarketNDSAtipicial', 'REQUIRED_PARAMETER_MISSING')
    }

    const { AtipicialParser, AtipicialInvoker } = BSAtipicialAtipicialDappKitSingletonHelper.getInstance()

    const invoker = await AtipicialInvoker.init({ rpcAddress: this._service.network.url })
    try {
      const result = await invoker.testInvoke({
        invocations: [
          {
            scriptHash: collectionHash,
            operation: 'balanceOf',
            args: [
              {
                type: 'Hash160',
                value: address,
              },
            ],
          },
        ],
      })

      return AtipicialParser.parseRpcResponse(result.stack[0], { type: 'Integer' }) > 0
    } catch {
      throw new Error(`Token not found: ${collectionHash}`)
    }
  }

  getChain(): string {
    const chain = GhostMarketNDSAtipicial.CHAIN_BY_NETWORK_ID[this._service.network.id]
    if (!chain) throw new Error('Network not supported')

    return chain
  }
}
