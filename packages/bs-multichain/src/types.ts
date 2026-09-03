import type { IBSAtipicial } from '@atipicial/bs-atipicial'
import type { IBSAtipicialLegacy } from '@atipicial/bs-atipicial-legacy'
import type { IBSEthereum } from '@atipicial/bs-ethereum'
import type { IBSAtipicialX } from '@atipicial/bs-atipicialx'
import type { IBSSolana } from '@atipicial/bs-solana'
import type { IBSStellar } from '@atipicial/bs-stellar'
import type { IBSBitcoin } from '@atipicial/bs-bitcoin'

export type TBSService =
  | IBSAtipicial
  | IBSAtipicialLegacy
  | IBSEthereum<'ethereum'>
  | IBSEthereum<'polygon'>
  | IBSEthereum<'base'>
  | IBSEthereum<'arbitrum'>
  | IBSAtipicialX
  | IBSSolana
  | IBSStellar
  | IBSBitcoin

export type TBSServiceByName<S extends Array<TBSService>> = {
  [K in S[number]['name']]: Extract<S[number], { name: K }>
}

export type TBSServiceName = TBSService['name']
