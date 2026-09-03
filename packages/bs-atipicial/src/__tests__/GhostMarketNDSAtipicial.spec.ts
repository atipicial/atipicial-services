import { BSAtipicial } from '../BSAtipicial'
import { BSAtipicialConstants } from '../constants/BSAtipicialConstants'
import { GhostMarketNDSAtipicial } from '../services/nft-data/GhostMarketNDSAtipicial'
import { INftDataService } from '@atipicial/blockchain-service'
import { IBSAtipicial } from '../types'

let service: IBSAtipicial
let ghostMarketNDSAtipicial: INftDataService

describe('GhostMarketNDSAtipicial', () => {
  beforeAll(() => {
    service = new BSAtipicial(BSAtipicialConstants.MAINNET_NETWORK)
    ghostMarketNDSAtipicial = new GhostMarketNDSAtipicial(service)
  })

  it('Should get TTM NFT by contract hash and token id', async () => {
    const nft = await ghostMarketNDSAtipicial.getNft({
      collectionHash: '0xaa4fb927b3fe004e689a278d188689c9f050a8b2',
      tokenHash: 'SVBLTUYxMTY1',
    })

    expect(nft).toEqual(
      expect.objectContaining({
        hash: 'SVBLTUYxMTY1',
        symbol: 'TTM',
        collection: {
          hash: '0xaa4fb927b3fe004e689a278d188689c9f050a8b2',
          name: 'TOTHEMOON',
          image: expect.any(String),
          url: expect.any(String),
        },
        image: expect.any(String),
        isSVG: expect.any(Boolean),
        name: 'Pink Moon Fish',
        creator: {
          address: 'NQJpnvRaLvPqu8Mm5Bx3d1uJEttwJBN2p9',
          name: undefined,
        },
      })
    )
  })

  it('Should get GHOST NFT by contract hash and token id', async () => {
    const collectionHash = '0x577a51f7d39162c9de1db12a6b319c848e4c54e5'
    const tokenHash = '7wA='
    const nft = await ghostMarketNDSAtipicial.getNft({ collectionHash, tokenHash })

    expect(nft).toEqual({
      hash: tokenHash,
      explorerUri: service.explorerService.buildNftUrl({ tokenHash, collectionHash }),
      collection: {
        hash: collectionHash,
        name: 'GHOST',
        image: expect.any(String),
        url: expect.any(String),
      },
      symbol: 'GHOST',
      image: expect.any(String),
      isSVG: expect.any(Boolean),
      name: 'GAS Icon',
      creator: {
        address: expect.any(String),
        name: expect.any(String),
      },
    })
  })

  it.skip('Should get NFTS by address', async () => {
    const nfts = await ghostMarketNDSAtipicial.getNftsByAddress({
      address: 'NNmTVFrSPhe7zjgN6iq9cLgXJwLZziUKV6',
    })
    expect(nfts.items.length).toBeGreaterThan(0)
    nfts.items.forEach(nft => {
      expect(nft).toEqual(
        expect.objectContaining({
          symbol: expect.any(String),
          hash: expect.any(String),
          collection: {
            hash: expect.any(String),
            name: expect.any(String),
            image: expect.anything(),
            url: expect.any(String),
          },
        })
      )
    })
  })

  it.skip('Should check if address has specific Token', async () => {
    const address: string = 'NNmTVFrSPhe7zjgN6iq9cLgXJwLZziUKV6'

    const nfts = await ghostMarketNDSAtipicial.getNftsByAddress({
      address: address,
    })

    const hasToken: boolean = await ghostMarketNDSAtipicial.hasToken({
      address,
      collectionHash: nfts.items[0].collection!.hash,
    })

    expect(hasToken).toBeTruthy()
  })
})
