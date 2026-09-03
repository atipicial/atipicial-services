import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { BSAtipicial } from '../BSAtipicial'
import { BSAtipicialConstants } from '../constants/BSAtipicialConstants'
import { BSKeychainHelper, isClaimable, type TBSNetwork } from '@atipicial/blockchain-service'
import type { TBSAtipicialNetworkId } from '../types'

let bsAtipicial: BSAtipicial
let network: TBSNetwork<TBSAtipicialNetworkId>

describe('BSAtipicial', () => {
  beforeAll(() => {
    network = BSAtipicialConstants.TESTNET_NETWORK
    bsAtipicial = new BSAtipicial(network)
  })

  it('Should be able to claim', () => {
    expect(isClaimable(bsAtipicial)).toBeTruthy()
  })

  it('Should be able to validate an address', () => {
    const validAddress = 'NPRMF5bmYuW23DeDJqsDJenhXkAPSJyuYe'
    const invalidAddress = 'invalid address'

    expect(bsAtipicial.validateAddress(validAddress)).toBeTruthy()
    expect(bsAtipicial.validateAddress(invalidAddress)).toBeFalsy()
  })

  it('Should be able to validate an encrypted key', () => {
    const validEncryptedKey = '6PYVPVe1fQznphjbUxXP9KZJqPMVnVwCx5s5pr5axRJ8uHkMtZg97eT5kL'
    const invalidEncryptedKey = 'invalid encrypted key'

    expect(bsAtipicial.validateEncrypted(validEncryptedKey)).toBeTruthy()
    expect(bsAtipicial.validateEncrypted(invalidEncryptedKey)).toBeFalsy()
  })

  it('Should be able to validate a wif', () => {
    const validWif = 'L44B5gGEpqEDRS9vVPz7QT35jcBG2r3CZwSwQ4fCewXAhAhqGVpP'
    const invalidWif = 'invalid wif'

    expect(bsAtipicial.validateKey(validWif)).toBeTruthy()
    expect(bsAtipicial.validateKey(invalidWif)).toBeFalsy()
  })

  it('Should be able to validate an domain', () => {
    const validDomain = 'test.atipicial'
    const invalidDomain = 'invalid domain'

    expect(bsAtipicial.validateNameServiceDomainFormat(validDomain)).toBeTruthy()
    expect(bsAtipicial.validateNameServiceDomainFormat(invalidDomain)).toBeFalsy()
  })

  it('Should be able to generate an account from mnemonic', async () => {
    const mnemonic = BSKeychainHelper.generateMnemonic()
    const account = await bsAtipicial.generateAccountFromMnemonic(mnemonic, 0)

    expect(bsAtipicial.validateAddress(account.address)).toBeTruthy()
    expect(bsAtipicial.validateKey(account.key)).toBeTruthy()
  })

  it('Should be able to generate an account from wif', async () => {
    const mnemonic = BSKeychainHelper.generateMnemonic()
    const account = await bsAtipicial.generateAccountFromMnemonic(mnemonic, 0)

    const accountFromWif = await bsAtipicial.generateAccountFromKey(account.key)
    expect(account).toEqual(expect.objectContaining(accountFromWif))
  })

  it('Should be able to decrypt a encrypted key', async () => {
    const mnemonic = BSKeychainHelper.generateMnemonic()
    const account = await bsAtipicial.generateAccountFromMnemonic(mnemonic, 0)
    const password = 'TestPassword'
    const encryptedKey = await bsAtipicial.encrypt(account.key, password)
    const decryptedAccount = await bsAtipicial.decrypt(encryptedKey, password)
    expect(account).toEqual(expect.objectContaining(decryptedAccount))
  })

  it('Should be able to encrypt a key', async () => {
    const mnemonic = BSKeychainHelper.generateMnemonic()
    const account = await bsAtipicial.generateAccountFromMnemonic(mnemonic, 0)
    const password = 'TestPassword'
    const encryptedKey = await bsAtipicial.encrypt(account.key, password)
    expect(encryptedKey).toEqual(expect.any(String))
  })

  it('Should be able to ping network', async () => {
    const response = await bsAtipicial.pingNetwork(BSAtipicialConstants.MAINNET_NETWORK.url)

    expect(response).toEqual({
      latency: expect.any(Number),
      url: BSAtipicialConstants.MAINNET_NETWORK.url,
      height: expect.any(Number),
    })
  })

  it('Should be able to resolve a name service domain', async () => {
    const owner = await bsAtipicial.resolveNameServiceDomain('atipicial.atipicial')
    expect(owner).toEqual('Nj39M97Rk2e23JiULBBMQmvpcnKaRHqxFf')
  })

  it('Should be able to calculate transfer fee', async () => {
    const account = await bsAtipicial.generateAccountFromKey(process.env.TEST_PRIVATE_KEY)

    const fee = await bsAtipicial.calculateTransferFee({
      senderAccount: account,
      intents: [
        {
          amount: '0.00000001',
          receiverAddress: 'NPRMF5bmYuW23DeDJqsDJenhXkAPSJyuYe',
          token: BSAtipicialConstants.GAS_TOKEN,
        },
      ],
    })

    expect(fee).toMatch(/^0\.0\d*[1-9]$/)
  })

  it('Should be able to calculate transfer fee more than one intent', async () => {
    const account = await bsAtipicial.generateAccountFromKey(process.env.TEST_PRIVATE_KEY)

    const fee = await bsAtipicial.calculateTransferFee({
      senderAccount: account,
      intents: [
        {
          amount: '0.00000001',
          receiverAddress: 'NPRMF5bmYuW23DeDJqsDJenhXkAPSJyuYe',
          token: BSAtipicialConstants.GAS_TOKEN,
        },
        {
          amount: '1',
          receiverAddress: 'NPRMF5bmYuW23DeDJqsDJenhXkAPSJyuYe',
          token: BSAtipicialConstants.ATC_TOKEN,
        },
      ],
    })

    expect(fee).toMatch(/^0\.0\d*[1-9]$/)
  })

  it.skip('Should be able to transfer', async () => {
    const senderAccount = await bsAtipicial.generateAccountFromKey(process.env.TEST_PRIVATE_KEY)
    const { address } = senderAccount
    const token = BSAtipicialConstants.GAS_TOKEN
    const amount = '0.00000001'

    const transactions = await bsAtipicial.transfer({
      senderAccount,
      intents: [{ amount, receiverAddress: address, token }],
    })

    expect(transactions).toEqual([
      {
        txId: expect.any(String),
        txIdUrl: expect.any(String),
        date: expect.any(String),
        invocationCount: expect.any(Number),
        blockchain: 'atipicial',
        isPending: true,
        relatedAddress: address,
        networkFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
        systemFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
        view: 'default',
        events: [
          {
            eventType: 'token',
            amount,
            methodName: 'transfer',
            from: address,
            fromUrl: expect.any(String),
            to: address,
            toUrl: expect.any(String),
            tokenUrl: expect.any(String),
            token,
          },
        ],
      },
    ])
  })

  it.skip('Should be able to transfer more than one intent', async () => {
    const senderAccount = await bsAtipicial.generateAccountFromKey(process.env.TEST_PRIVATE_KEY)
    const { address } = senderAccount
    const gasToken = BSAtipicialConstants.GAS_TOKEN
    const gasAmount = '0.00000001'
    const atipicialToken = BSAtipicialConstants.ATC_TOKEN
    const atipicialAmount = '1'

    const claimEvent = await bsAtipicial.claimService._buildTransactionEvent(address)

    const transactions = await bsAtipicial.transfer({
      senderAccount,
      intents: [
        {
          amount: gasAmount,
          receiverAddress: address,
          token: gasToken,
        },
        {
          amount: atipicialAmount,
          receiverAddress: address,
          token: atipicialToken,
        },
      ],
    })

    expect(transactions).toEqual([
      {
        txId: expect.any(String),
        txIdUrl: expect.any(String),
        date: expect.any(String),
        invocationCount: expect.any(Number),
        blockchain: 'atipicial',
        isPending: true,
        relatedAddress: address,
        networkFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
        systemFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
        view: 'default',
        data: { isClaim: true },
        events: [
          claimEvent,
          {
            eventType: 'token',
            amount: gasAmount,
            methodName: 'transfer',
            from: address,
            fromUrl: expect.any(String),
            to: address,
            toUrl: expect.any(String),
            tokenUrl: expect.any(String),
            token: gasToken,
          },
          {
            eventType: 'token',
            amount: atipicialAmount,
            methodName: 'transfer',
            from: address,
            fromUrl: expect.any(String),
            to: address,
            toUrl: expect.any(String),
            tokenUrl: expect.any(String),
            token: atipicialToken,
          },
        ],
      },
    ])
  })

  it.skip('Should be able to transfer with Ledger', async () => {
    const transport = await TransportNodeHid.create()
    const service = new BSAtipicial(network, async () => transport)
    const senderAccount = await service.ledgerService.getAccount(transport, 0)
    const { address } = senderAccount
    const amount = '0.00000001'
    const token = BSAtipicialConstants.GAS_TOKEN

    const transactions = await service.transfer({
      senderAccount,
      intents: [{ amount, receiverAddress: address, token }],
    })

    await transport.close()

    expect(transactions).toEqual([
      {
        txId: expect.any(String),
        txIdUrl: expect.any(String),
        date: expect.any(String),
        invocationCount: expect.any(Number),
        blockchain: 'atipicial',
        isPending: true,
        relatedAddress: address,
        networkFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
        systemFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
        view: 'default',
        events: [
          {
            eventType: 'token',
            amount,
            methodName: 'transfer',
            from: address,
            fromUrl: expect.any(String),
            to: address,
            toUrl: expect.any(String),
            tokenUrl: expect.any(String),
            token,
          },
        ],
      },
    ])
  })

  it.skip('Should be able to transfer more than one intent with Ledger', async () => {
    const transport = await TransportNodeHid.create()
    const service = new BSAtipicial(network, async () => transport)
    const senderAccount = await service.ledgerService.getAccount(transport, 0)
    const { address } = senderAccount
    const gasToken = BSAtipicialConstants.GAS_TOKEN
    const gasAmount = '0.00000001'
    const atipicialToken = BSAtipicialConstants.ATC_TOKEN
    const atipicialAmount = '1'

    const claimEvent = await bsAtipicial.claimService._buildTransactionEvent(address)

    const transactions = await service.transfer({
      senderAccount,
      intents: [
        {
          amount: gasAmount,
          receiverAddress: address,
          token: gasToken,
        },
        {
          amount: atipicialAmount,
          receiverAddress: address,
          token: atipicialToken,
        },
      ],
    })

    await transport.close()

    expect(transactions).toEqual([
      {
        txId: expect.any(String),
        txIdUrl: expect.any(String),
        date: expect.any(String),
        invocationCount: expect.any(Number),
        blockchain: 'atipicial',
        isPending: true,
        relatedAddress: address,
        networkFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
        systemFeeAmount: expect.stringMatching(/^\d+(\.\d+)?$/),
        view: 'default',
        data: { isClaim: true },
        events: [
          claimEvent,
          {
            eventType: 'token',
            amount: gasAmount,
            methodName: 'transfer',
            from: address,
            fromUrl: expect.any(String),
            to: address,
            toUrl: expect.any(String),
            tokenUrl: expect.any(String),
            token: gasToken,
          },
          {
            eventType: 'token',
            amount: atipicialAmount,
            methodName: 'transfer',
            from: address,
            fromUrl: expect.any(String),
            to: address,
            toUrl: expect.any(String),
            tokenUrl: expect.any(String),
            token: atipicialToken,
          },
        ],
      },
    ])
  })
})
