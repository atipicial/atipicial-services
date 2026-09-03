import { BSAtipicial } from '../BSAtipicial'
import { BSAtipicialConstants } from '../constants/BSAtipicialConstants'
import { RpcBDSAtipicial } from '../services/blockchain-data/RpcBDSAtipicial'

const network = BSAtipicialConstants.TESTNET_NETWORK

let rpcBDSAtipicial: RpcBDSAtipicial

describe('RpcBDSAtipicial', () => {
  beforeEach(() => {
    const service = new BSAtipicial(network)
    rpcBDSAtipicial = new RpcBDSAtipicial(service)
  })

  it('Should be able to get transaction', async () => {
    const hash = '0x70e7381c5dee6e81becd02844e4e0199f6b3df834213bc89418dc4da32cf3f21'
    const transaction = await rpcBDSAtipicial.getTransaction(hash)

    expect(transaction).toEqual(
      expect.objectContaining({
        txId: expect.any(String),
        txIdUrl: expect.any(String),
        block: expect.any(Number),
        date: expect.any(String),
        invocationCount: expect.any(Number),
        notificationCount: expect.any(Number),
        blockchain: 'atipicial',
        isPending: false,
        networkFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
        systemFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
        view: 'default',
        events: expect.arrayContaining([
          expect.toBeOneOf([
            expect.objectContaining({
              eventType: expect.any(String),
              amount: expect.stringMatching(/^\d+(\.\d+)?$/),
              methodName: 'transfer',
              from: expect.anything(),
              fromUrl: expect.anything(),
              to: expect.anything(),
              toUrl: expect.anything(),
              tokenUrl: expect.any(String),
              token: expect.objectContaining({
                decimals: expect.any(Number),
                symbol: expect.any(String),
                name: expect.any(String),
                hash: expect.any(String),
              }),
            }),
            expect.objectContaining({
              amount: expect.stringMatching(/^\d+(\.\d+)?$/),
              data: { candidate: expect.any(String), token: BSAtipicialConstants.ATC_TOKEN.symbol },
              eventType: 'generic',
              from: expect.any(String),
              fromUrl: expect.any(String),
              methodName: 'vote',
            }),
          ]),
        ]),
      })
    )
  })

  it('Should be able to get contract', async () => {
    const hash = '0xd2a4cff31913016155e38e474a2c06d08be276cf'
    const contract = await rpcBDSAtipicial.getContract(hash)

    expect(contract).toEqual({
      hash: hash,
      name: 'AtipicialDollar',
      methods: expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
          parameters: expect.arrayContaining([
            expect.objectContaining({ name: expect.any(String), type: expect.any(String) }),
          ]),
        }),
      ]),
    })
  })

  it('Should be able to get token info', async () => {
    const hash = '0xd2a4cff31913016155e38e474a2c06d08be276cf'
    const token = await rpcBDSAtipicial.getTokenInfo(hash)

    expect(token).toEqual({
      decimals: 8,
      hash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
      name: 'GAS',
      symbol: 'GAS',
    })
  })

  it('Should be able to get balance', async () => {
    const address = 'NNmTVFrSPhe7zjgN6iq9cLgXJwLZziUKV6'
    const balance = await rpcBDSAtipicial.getBalance(address)

    balance.forEach(balance => {
      expect(balance).toEqual({
        amount: expect.stringMatching(/^\d+(\.\d+)?$/),
        token: {
          hash: expect.any(String),
          name: expect.any(String),
          symbol: expect.any(String),
          decimals: expect.any(Number),
        },
      })
    })
  })
})
