import { BSUtilsHelper, TBSNetwork } from '@atipicial/blockchain-service'
import { BSAtipicialConstants } from '../constants/BSAtipicialConstants'
import { BSAtipicialHelper } from '../helpers/BSAtipicialHelper'
import { FlamingoForthewinEDSAtipicial } from '../services/exchange-data/FlamingoForthewinEDSAtipicial'
import type { TBSAtipicialNetworkId } from '../types'
import { BSAtipicial } from '../BSAtipicial'

let flamingoForthewinEDSAtipicial: FlamingoForthewinEDSAtipicial
let network: TBSNetwork<TBSAtipicialNetworkId>

// Avoid API key error
describe.skip('FlamingoForthewinEDSAtipicial', () => {
  beforeAll(() => {
    network = BSAtipicialConstants.MAINNET_NETWORK

    const service = new BSAtipicial(network)

    flamingoForthewinEDSAtipicial = new FlamingoForthewinEDSAtipicial(service)
  })

  beforeEach(async () => {
    // Wait to avoid rate limit
    await BSUtilsHelper.wait(4000)
  })

  it('Should return a list with prices of tokens using USD', async () => {
    const tokenPriceList = await flamingoForthewinEDSAtipicial.getTokenPrices({ tokens: BSAtipicialHelper.getTokens(network) })

    tokenPriceList.forEach(tokenPrice => {
      expect(tokenPrice).toEqual({
        usdPrice: expect.any(Number),
        token: expect.objectContaining({
          decimals: expect.any(Number),
          hash: expect.any(String),
          name: expect.any(String),
          symbol: expect.any(String),
        }),
      })
    })
  })

  it('Should return the BRL currency ratio', async () => {
    const ratio = await flamingoForthewinEDSAtipicial.getCurrencyRatio('BRL')

    expect(ratio).toEqual(expect.any(Number))
  })

  it('Should return EUR currency ratio', async () => {
    const ratio = await flamingoForthewinEDSAtipicial.getCurrencyRatio('EUR')

    expect(ratio).toEqual(expect.any(Number))
  })

  it("Should return the token's price history", async () => {
    const token = BSAtipicialHelper.getTokens(network).find(token => token.symbol === 'GAS')!
    const tokenPriceHistory = await flamingoForthewinEDSAtipicial.getTokenPriceHistory({
      token,
      limit: 24,
      type: 'hour',
    })

    tokenPriceHistory.forEach(tokenPrice => {
      expect(tokenPrice).toEqual({
        usdPrice: expect.any(Number),
        timestamp: expect.any(Number),
        token,
      })
    })
  })
})
