import { BSAtipicialConstants } from '../constants/BSAtipicialConstants'
import { BSAtipicial } from '../BSAtipicial'
import { VoteServiceAtipicial } from '../services/vote/VoteServiceAtipicial'
import type { TBSAccount } from '@atipicial/blockchain-service'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import type { TBSAtipicialName } from '../types'

let voteServiceAtipicial: VoteServiceAtipicial
let account: TBSAccount<TBSAtipicialName>

const cozCandidatePubKey = '02946248f71bdf14933e6735da9867e81cc9eea0b5895329aa7f71e7745cf40659'
const testnetNetwork = BSAtipicialConstants.TESTNET_NETWORK
const address = 'Nbgjdh2MmB9oWUY7Botk6Yy58eCzuPrQFW'

describe('VoteServiceAtipicial', () => {
  beforeEach(async () => {
    const bsAtipicial = new BSAtipicial()

    voteServiceAtipicial = new VoteServiceAtipicial(bsAtipicial)

    account = await bsAtipicial.generateAccountFromKey(process.env.TEST_PRIVATE_KEY)
  })

  it("Shouldn't be able to get candidates to vote when is using a Testnet network", async () => {
    voteServiceAtipicial = new VoteServiceAtipicial(new BSAtipicial(testnetNetwork))

    await expect(voteServiceAtipicial.getCandidatesToVote()).rejects.toThrow('Only Mainnet is supported')
  })

  it('Should be able to get candidates to vote when is using a Mainnet network', async () => {
    const response = await voteServiceAtipicial.getCandidatesToVote()

    expect(response).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          position: expect.any(Number),
          name: expect.any(String),
          description: expect.any(String),
          location: expect.any(String),
          email: expect.any(String),
          website: expect.any(String),
          hash: expect.any(String),
          pubKey: expect.any(String),
          votes: expect.any(Number),
          logoUrl: expect.anything(),
          type: expect.stringMatching(/^(consensus|council)$/),
        }),
      ])
    )
  })

  it("Shouldn't be able to get vote details by address when is using a Testnet network", async () => {
    voteServiceAtipicial = new VoteServiceAtipicial(new BSAtipicial(testnetNetwork))

    await expect(voteServiceAtipicial.getVoteDetailsByAddress(address)).rejects.toThrow('Only Mainnet is supported')
  })

  it("Shouldn't be able to get vote details by address when there isn't address", async () => {
    await expect(voteServiceAtipicial.getVoteDetailsByAddress('')).rejects.toThrow('Missing address')
  })

  it("Shouldn't be able to get vote details by address when address is invalid", async () => {
    await expect(voteServiceAtipicial.getVoteDetailsByAddress('invalidAddress')).rejects.toThrow('Invalid address')
  })

  it('Should be able to get vote details by address when address is valid', async () => {
    const response = await voteServiceAtipicial.getVoteDetailsByAddress(address)

    expect(response).toEqual(
      expect.objectContaining({
        candidateName: expect.any(String),
        candidatePubKey: expect.any(String),
        atipicialBalance: expect.any(Number),
      })
    )
  })

  it("Shouldn't be able to calculate vote fee when is using a Testnet network", async () => {
    voteServiceAtipicial = new VoteServiceAtipicial(new BSAtipicial(testnetNetwork))

    await expect(voteServiceAtipicial.calculateVoteFee({ account, candidatePubKey: cozCandidatePubKey })).rejects.toThrow(
      'Only Mainnet is supported'
    )
  })

  it("Shouldn't be able to calculate vote fee when there isn't candidatePubKey", async () => {
    await expect(voteServiceAtipicial.calculateVoteFee({ account, candidatePubKey: '' })).rejects.toThrow(
      'Missing candidatePubKey param'
    )
  })

  it('Should be able to calculate vote fee', async () => {
    const fee = await voteServiceAtipicial.calculateVoteFee({ account, candidatePubKey: cozCandidatePubKey })

    expect(fee).toEqual(expect.any(String))
  })

  it("Shouldn't be able to vote when is using a Testnet network", async () => {
    voteServiceAtipicial = new VoteServiceAtipicial(new BSAtipicial(testnetNetwork))

    await expect(voteServiceAtipicial.vote({ account, candidatePubKey: cozCandidatePubKey })).rejects.toThrow(
      'Only Mainnet is supported'
    )
  })

  it("Shouldn't be able to vote when there isn't candidatePubKey", async () => {
    await expect(voteServiceAtipicial.vote({ account, candidatePubKey: '' })).rejects.toThrow(
      'Missing candidatePubKey param'
    )
  })

  it.skip('Should be able to vote with success', async () => {
    const transaction = await voteServiceAtipicial.vote({ account, candidatePubKey: cozCandidatePubKey })

    expect(transaction).toEqual({
      txId: expect.any(String),
      txIdUrl: expect.any(String),
      date: expect.any(String),
      invocationCount: expect.any(Number),
      networkFeeAmount: expect.any(String),
      systemFeeAmount: expect.any(String),
      blockchain: 'atipicial',
      isPending: true,
      relatedAddress: account.address,
      view: 'default',
      data: {
        isVote: true,
      },
      events: [
        {
          eventType: 'token',
          amount: expect.stringMatching(/^\d+(\.\d+)?$/),
          methodName: 'transfer',
          to: expect.any(String),
          toUrl: expect.any(String),
          tokenUrl: expect.any(String),
          token: BSAtipicialConstants.GAS_TOKEN,
        },
        {
          eventType: 'generic',
          amount: expect.stringMatching(/^\d+(\.\d+)?$/),
          methodName: 'vote',
          from: expect.any(String),
          fromUrl: expect.any(String),
          data: {
            candidate: cozCandidatePubKey,
            token: BSAtipicialConstants.ATC_TOKEN.symbol,
          },
        },
      ],
    })
  })

  it.skip('Should be able to vote using Ledger with success', async () => {
    const transport = await TransportNodeHid.create()
    const bsAtipicial = new BSAtipicial(undefined, async () => transport)

    voteServiceAtipicial = new VoteServiceAtipicial(bsAtipicial)
    account = await bsAtipicial.ledgerService.getAccount(transport, 0)

    const transaction = await voteServiceAtipicial.vote({ account, candidatePubKey: cozCandidatePubKey })

    await transport.close()

    expect(transaction).toEqual({
      txId: expect.any(String),
      txIdUrl: expect.any(String),
      date: expect.any(String),
      invocationCount: expect.any(Number),
      networkFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
      systemFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
      blockchain: 'atipicial',
      isPending: true,
      relatedAddress: account.address,
      view: 'default',
      data: {
        isVote: true,
      },
      events: [
        {
          eventType: 'token',
          amount: expect.stringMatching(/^\d+(\.\d+)?$/),
          methodName: 'transfer',
          to: expect.any(String),
          toUrl: expect.any(String),
          tokenUrl: expect.any(String),
          token: BSAtipicialConstants.GAS_TOKEN,
        },
        {
          eventType: 'generic',
          amount: expect.stringMatching(/^\d+(\.\d+)?$/),
          methodName: 'vote',
          from: expect.any(String),
          fromUrl: expect.any(String),
          data: {
            candidate: cozCandidatePubKey,
            token: BSAtipicialConstants.ATC_TOKEN.symbol,
          },
        },
      ],
    })
  })
})
