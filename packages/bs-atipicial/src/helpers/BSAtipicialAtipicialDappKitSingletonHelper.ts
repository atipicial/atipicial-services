import type * as AtipicialDappKit from '@atipicial/atipicial-dappkit'

export class BSAtipicialAtipicialDappKitSingletonHelper {
  static #instance: typeof AtipicialDappKit

  static getInstance() {
    if (!BSAtipicialAtipicialDappKitSingletonHelper.#instance) {
      BSAtipicialAtipicialDappKitSingletonHelper.#instance = require('@atipicial/atipicial-dappkit')
    }

    return BSAtipicialAtipicialDappKitSingletonHelper.#instance
  }
}

export type * from '@atipicial/atipicial-dappkit-types'
