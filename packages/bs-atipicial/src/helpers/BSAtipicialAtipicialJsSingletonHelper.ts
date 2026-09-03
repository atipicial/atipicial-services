import type * as AtipicialJs from '@atipicial/atipicial-js'

export class BSAtipicialAtipicialJsSingletonHelper {
  static #instance: typeof AtipicialJs

  static getInstance() {
    if (!BSAtipicialAtipicialJsSingletonHelper.#instance) {
      BSAtipicialAtipicialJsSingletonHelper.#instance = require('@atipicial/atipicial-js')
    }

    return BSAtipicialAtipicialJsSingletonHelper.#instance
  }
}

export type { api } from '@atipicial/atipicial-js'
export type * from '@atipicial/atipicial-core'
