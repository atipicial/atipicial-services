import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { BSAtipicial } from '../BSAtipicial'
import { BSAtipicialConstants } from '../constants/BSAtipicialConstants'
import { ClaimServiceAtipicial } from '../services/claim/ClaimServiceAtipicial'
import type { TBSAtipicialNetworkId } from '../types'
import type { TBSNetwork } from '@atipicial/blockchain-service'

let claimService: ClaimServiceAtipicial
let bsAtipicial: BSAtipicial
let network: TBSNetwork<TBSAtipicialNetworkId>

describe('ClaimServiceAtipicial', () => {
  beforeEach(() => {
    network = BSAtipicialConstants.TESTNET_NETWORK
    bsAtipicial = new BSAtipicial(network)
    claimService = new ClaimServiceAtipicial(bsAtipicial)
  })

  it('Should be able to get unclaimed', async () => {
    const account = await bsAtipicial.generateAccountFromKey(process.env.TEST_PRIVATE_KEY)
    const unclaimed = await claimService.getUnclaimed(account.address)

    expect(unclaimed).toMatch(/^0\.0\d*[1-9]$/)
  })

  it.skip('Should be able to calculate the claim fee', async () => {
    const account = await bsAtipicial.generateAccountFromKey(process.env.TEST_PRIVATE_KEY)
    const fee = await claimService.calculateFee(account)

    expect(fee).toEqual(expect.stringMatching(/^0\.0\d*[1-9]$/))
  })

  it.skip('Should be able to claim', async () => {
    const account = await bsAtipicial.generateAccountFromKey(process.env.TEST_PRIVATE_KEY)
    const unclaimed = await claimService.getUnclaimed(account.address)

    expect(Number(unclaimed)).toBeGreaterThan(0)

    const transaction = await claimService.claim(account)
    const claimEvent = await claimService._buildTransactionEvent(account.address)

    expect(transaction).toEqual({
      txId: expect.any(String),
      txIdUrl: expect.any(String),
      date: expect.any(String),
      invocationCount: expect.any(Number),
      blockchain: 'atipicial',
      isPending: true,
      relatedAddress: account.address,
      networkFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
      systemFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
      view: 'default',
      data: { isClaim: true },
      events: [
        claimEvent,
        {
          eventType: 'token',
          amount: '0',
          methodName: 'transfer',
          from: account.address,
          fromUrl: expect.any(String),
          to: account.address,
          toUrl: expect.any(String),
          tokenUrl: expect.any(String),
          token: claimService.burnToken,
        },
      ],
    })
  })

  it.skip('Should be able to calculate the claim fee with Ledger', async () => {
    const transport = await TransportNodeHid.create()

    bsAtipicial = new BSAtipicial(network, async () => transport)
    claimService = new ClaimServiceAtipicial(bsAtipicial)

    const account = await bsAtipicial.ledgerService.getAccount(transport, 0)
    const fee = await claimService.calculateFee(account)

    expect(fee).toEqual(expect.stringMatching(/^0\.0\d*[1-9]$/))
  })

  it.skip('Should be able to claim with Ledger', async () => {
    const transport = await TransportNodeHid.create()

    bsAtipicial = new BSAtipicial(network, async () => transport)
    claimService = new ClaimServiceAtipicial(bsAtipicial)

    const account = await bsAtipicial.ledgerService.getAccount(transport, 0)
    const unclaimed = await claimService.getUnclaimed(account.address)

    expect(Number(unclaimed)).toBeGreaterThan(0)

    const transaction = await claimService.claim(account)
    const claimEvent = await claimService._buildTransactionEvent(account.address)

    expect(transaction).toEqual({
      txId: expect.any(String),
      txIdUrl: expect.any(String),
      date: expect.any(String),
      invocationCount: expect.any(Number),
      blockchain: 'atipicial',
      isPending: true,
      relatedAddress: account.address,
      networkFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
      systemFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
      view: 'default',
      data: { isClaim: true },
      events: [
        claimEvent,
        {
          eventType: 'token',
          amount: '0',
          methodName: 'transfer',
          from: account.address,
          fromUrl: expect.any(String),
          to: account.address,
          toUrl: expect.any(String),
          tokenUrl: expect.any(String),
          token: claimService.burnToken,
        },
      ],
    })
  })
})
