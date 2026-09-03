import { TokenService } from '@atipicial/blockchain-service'
import type { TBSAtipicialName, TBSAtipicialNetworkId } from '../../types'

export class TokenServiceAtipicial extends TokenService<TBSAtipicialName, TBSAtipicialNetworkId> {
  normalizeHash(hash: string): string {
    const fixed = hash.startsWith('0x') ? hash : `0x${hash}`
    return fixed.toLowerCase()
  }
}
