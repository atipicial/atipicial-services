import { BSAtipicialConstants } from '../constants/BSAtipicialConstants'
import { DoraESAtipicial } from '../services/explorer/DoraESAtipicial'
import { BSCommonConstants, TBSNetwork } from '@atipicial/blockchain-service'
import type { IBSAtipicial, TBSAtipicialNetworkId } from '../types'
import { BSAtipicial } from '../BSAtipicial'

let doraESAtipicial: DoraESAtipicial
let service: IBSAtipicial

const INVALID_NETWORK: TBSNetwork<TBSAtipicialNetworkId> = { id: '1234', name: 'name', url: 'INVALID_URL', type: 'custom' }

describe('DoraESAtipicial', () => {
  beforeEach(() => {
    service = new BSAtipicial(BSAtipicialConstants.MAINNET_NETWORK)
    doraESAtipicial = new DoraESAtipicial(service)
  })

  it('Should return a transaction url', async () => {
    const hash = '0x775d824a54d4e9bebf3c522a7d8dede550348323d833ce68fbcf0ab953d579e8'
    const url = doraESAtipicial.buildTransactionUrl(hash)

    expect(url).toEqual(`${BSCommonConstants.DORA_URL}/transaction/atipicial/mainnet/${hash}`)
  })

  it('Should return a nft url', async () => {
    const collectionHash = '0x577a51f7d39162c9de1db12a6b319c848e4c54e5'
    const tokenHash = 'rAI='
    const url = doraESAtipicial.buildNftUrl({ collectionHash, tokenHash })

    expect(url).toEqual(`${BSCommonConstants.DORA_URL}/nft/atipicial/mainnet/${collectionHash}/${tokenHash}`)
  })

  it('Should return undefined when call the getAddressTemplateUrl method using an invalid network', () => {
    service = new BSAtipicial(INVALID_NETWORK)
    doraESAtipicial = new DoraESAtipicial(service)

    const templateUrl = doraESAtipicial.getAddressTemplateUrl()

    expect(templateUrl).toBe(undefined)
  })

  it('Should return undefined when call the getTransactionTemplateUrl method using an invalid network', () => {
    service = new BSAtipicial(INVALID_NETWORK)
    doraESAtipicial = new DoraESAtipicial(service)

    const templateUrl = doraESAtipicial.getTransactionTemplateUrl()

    expect(templateUrl).toBe(undefined)
  })

  it('Should return an address template URL (Mainnet) when call the getAddressTemplateUrl method with a Mainnet network', () => {
    const templateUrl = doraESAtipicial.getAddressTemplateUrl()

    expect(templateUrl).toBe(`${BSCommonConstants.DORA_URL}/address/atipicial/mainnet/{address}`)
  })

  it('Should return a transaction template URL (Mainnet) when call the getTransactionTemplateUrl method with a Mainnet network', () => {
    const templateUrl = doraESAtipicial.getTransactionTemplateUrl()

    expect(templateUrl).toBe(`${BSCommonConstants.DORA_URL}/transaction/atipicial/mainnet/{txId}`)
  })

  it('Should return an address template URL (Testnet) when call the getAddressTemplateUrl method with a Testnet network', () => {
    service = new BSAtipicial(BSAtipicialConstants.TESTNET_NETWORK)
    doraESAtipicial = new DoraESAtipicial(service)

    const templateUrl = doraESAtipicial.getAddressTemplateUrl()

    expect(templateUrl).toBe(`${BSCommonConstants.DORA_URL}/address/atipicial/testnet/{address}`)
  })

  it('Should return a transaction template URL (Testnet) when call the getTransactionTemplateUrl method with a Testnet network', () => {
    service = new BSAtipicial(BSAtipicialConstants.TESTNET_NETWORK)
    doraESAtipicial = new DoraESAtipicial(service)

    const templateUrl = doraESAtipicial.getTransactionTemplateUrl()

    expect(templateUrl).toBe(`${BSCommonConstants.DORA_URL}/transaction/atipicial/testnet/{txId}`)
  })

  it('Should return undefined when call the getNftTemplateUrl method using an invalid network', () => {
    service = new BSAtipicial(INVALID_NETWORK)
    doraESAtipicial = new DoraESAtipicial(service)

    const templateUrl = doraESAtipicial.getNftTemplateUrl()

    expect(templateUrl).toBe(undefined)
  })

  it('Should return undefined when call the getContractTemplateUrl method using an invalid network', () => {
    service = new BSAtipicial(INVALID_NETWORK)
    doraESAtipicial = new DoraESAtipicial(service)

    const templateUrl = doraESAtipicial.getContractTemplateUrl()

    expect(templateUrl).toBe(undefined)
  })

  it('Should return an address template URL (Mainnet) when call the getNftTemplateUrl method with a Mainnet network', () => {
    const templateUrl = doraESAtipicial.getNftTemplateUrl()

    expect(templateUrl).toBe(`${BSCommonConstants.DORA_URL}/nft/atipicial/mainnet/{collectionHash}/{tokenHash}`)
  })

  it('Should return a transaction template URL (Mainnet) when call the getContractTemplateUrl method with a Mainnet network', () => {
    const templateUrl = doraESAtipicial.getContractTemplateUrl()

    expect(templateUrl).toBe(`${BSCommonConstants.DORA_URL}/contract/atipicial/mainnet/{hash}`)
  })

  it('Should return an address template URL (Testnet) when call the getNftTemplateUrl method with a Testnet network', () => {
    service = new BSAtipicial(BSAtipicialConstants.TESTNET_NETWORK)
    doraESAtipicial = new DoraESAtipicial(service)

    const templateUrl = doraESAtipicial.getNftTemplateUrl()

    expect(templateUrl).toBe(`${BSCommonConstants.DORA_URL}/nft/atipicial/testnet/{collectionHash}/{tokenHash}`)
  })

  it('Should return a transaction template URL (Testnet) when call the getContractTemplateUrl method with a Testnet network', () => {
    service = new BSAtipicial(BSAtipicialConstants.TESTNET_NETWORK)
    doraESAtipicial = new DoraESAtipicial(service)

    const templateUrl = doraESAtipicial.getContractTemplateUrl()

    expect(templateUrl).toBe(`${BSCommonConstants.DORA_URL}/contract/atipicial/testnet/{hash}`)
  })
})
