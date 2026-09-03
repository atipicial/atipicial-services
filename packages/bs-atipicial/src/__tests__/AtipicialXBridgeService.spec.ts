import { BSBigHumanAmount, BSError, type TBSAccount } from '@atipicial/blockchain-service'

import { BSAtipicial } from '../BSAtipicial'
import { BSAtipicialConstants } from '../constants/BSAtipicialConstants'
import { AtipicialXBridgeService } from '../services/atipicial-atipicialx-bridge/AtipicialXBridgeService'
import { AtipicialInvoker } from '@atipicial/atipicial-dappkit'
import axios from 'axios'
import { api } from '@atipicial/dora-ts'
import type { TBSAtipicialName } from '../types'

let atipicialAtipicialXBridgeService: AtipicialXBridgeService
let bsAtipicialService: BSAtipicial
let account: TBSAccount<TBSAtipicialName>
let receiverAddress: string

const network = BSAtipicialConstants.MAINNET_NETWORK

describe('AtipicialXBridgeService', () => {
  beforeAll(async () => {
    receiverAddress = process.env.TEST_BRIDGE_ATCX_ADDRESS
    bsAtipicialService = new BSAtipicial(network)
    atipicialAtipicialXBridgeService = new AtipicialXBridgeService(bsAtipicialService)

    account = await bsAtipicialService.generateAccountFromKey(process.env.TEST_BRIDGE_PRIVATE_KEY)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should not be able to get bridge constants for a invalid `testInvoke` response', async () => {
    const invalidResponse = {
      stack: [
        { type: 'ByteArray', value: 'invalid' },
        { type: 'ByteArray', value: 'invalid' },
        { type: 'ByteArray', value: 'invalid' },
      ],
    }

    vi.spyOn(AtipicialInvoker.prototype, 'testInvoke').mockResolvedValue(invalidResponse as any)

    await expect(atipicialAtipicialXBridgeService.getBridgeConstants(atipicialAtipicialXBridgeService.gasToken)).rejects.toThrow(BSError)
  })

  it('Should be able to get the ATC bridge constants', async () => {
    const constants = await atipicialAtipicialXBridgeService.getBridgeConstants(atipicialAtipicialXBridgeService.atipicialToken)

    expect(constants).toEqual({
      bridgeFee: expect.any(String),
      bridgeMinAmount: expect.any(String),
      bridgeMaxAmount: expect.any(String),
    })

    expect(Number(constants.bridgeFee)).toBeGreaterThan(0)
    expect(Number(constants.bridgeMinAmount)).toBeGreaterThan(0)
    expect(Number(constants.bridgeMaxAmount)).toBeGreaterThan(0)
  })

  it('Should be able to get the GAS bridge constants', async () => {
    const constants = await atipicialAtipicialXBridgeService.getBridgeConstants(atipicialAtipicialXBridgeService.gasToken)

    expect(constants).toEqual({
      bridgeFee: expect.any(String),
      bridgeMinAmount: expect.any(String),
      bridgeMaxAmount: expect.any(String),
    })

    expect(Number(constants.bridgeFee)).toBeGreaterThan(0)
    expect(Number(constants.bridgeMinAmount)).toBeGreaterThan(0)
    expect(Number(constants.bridgeMaxAmount)).toBeGreaterThan(0)
  })

  it('Should be able to get the NDMEME bridge constants', async () => {
    const constants = await atipicialAtipicialXBridgeService.getBridgeConstants(atipicialAtipicialXBridgeService.ndmemeToken)

    expect(constants).toEqual({
      bridgeFee: expect.any(String),
      bridgeMinAmount: expect.any(String),
      bridgeMaxAmount: expect.any(String),
    })

    expect(Number(constants.bridgeFee)).toBeGreaterThan(0)
    expect(Number(constants.bridgeMinAmount)).toBeGreaterThan(0)
    expect(Number(constants.bridgeMaxAmount)).toBeGreaterThan(0)
  })

  it('Should not be able to get the approval fee', async () => {
    await expect(atipicialAtipicialXBridgeService.getApprovalFee()).rejects.toThrow(BSError)
  })

  it('Should be able to get the nonce of a non-existent transaction', async () => {
    await expect(
      atipicialAtipicialXBridgeService.getNonce({
        token: atipicialAtipicialXBridgeService.gasToken,
        transactionHash: 'invalid-transaction-hash',
      })
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(BSError)
      expect((error as BSError).code).toBe('FAILED_TO_GET_NONCE')
      return true
    })
  })

  it('Should be able to get the nonce of a invalid transaction vmState', async () => {
    vi.spyOn(api.AtipicialRESTApi.prototype, 'log').mockResolvedValue({ vmstate: 'FAULT' } as any)

    await expect(
      atipicialAtipicialXBridgeService.getNonce({
        token: atipicialAtipicialXBridgeService.gasToken,
        transactionHash: 'invalid-transaction-hash',
      })
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(BSError)
      expect((error as BSError).code).toBe('INVALID_TRANSACTION')
      return true
    })
  })

  it('Should not be able to get the nonce of a non-bridge transaction', async () => {
    await expect(
      atipicialAtipicialXBridgeService.getNonce({
        token: atipicialAtipicialXBridgeService.gasToken,
        transactionHash: '0x0d4daca576d1c8b17d2ed3fc2e33e8bf560af0798c0b46b6b20eab456e36d005',
      })
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(BSError)
      expect((error as BSError).code).toBe('NONCE_NOT_FOUND')
      return true
    })
  })

  it('Should be able to get the nonce of a GAS bridge', async () => {
    const nonce = await atipicialAtipicialXBridgeService.getNonce({
      token: atipicialAtipicialXBridgeService.gasToken,
      transactionHash: '0xed5bd564f2ea38888aaec988bec6893e1b72811579864b0a3bc6ec02619e23dc',
    })

    expect(nonce).toBe('1421')
  })

  it('Should be able to get the nonce of a ATC bridge', async () => {
    const nonce = await atipicialAtipicialXBridgeService.getNonce({
      token: atipicialAtipicialXBridgeService.atipicialToken,
      transactionHash: '0x89512343681ca92fe4965d1fc6f71a2586a74c6d4592357f5fd5f540c0891b66',
    })

    expect(nonce).toBe('35')
  })

  it('Should be able to get the nonce of a NDMEME bridge', async () => {
    const nonce = await atipicialAtipicialXBridgeService.getNonce({
      token: atipicialAtipicialXBridgeService.ndmemeToken,
      transactionHash: '0x38ca6d89992b50f3d8c014aecaf926e0e62e85fb1a88fff90918adf98f13093f',
    })

    expect(nonce).toBe('10')
  })

  it('Should not be able to get the transaction hash by nonce', async () => {
    await expect(
      atipicialAtipicialXBridgeService.getTransactionHashByNonce({
        token: atipicialAtipicialXBridgeService.gasToken,
        nonce: 'non-existing-nonce',
      })
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(BSError)
      expect((error as BSError).code).toBe('FAILED_TO_GET_TRANSACTION_BY_NONCE')
      return true
    })
  })

  it('Should be able to get the transaction hash by nonce for a invalid transaction vmState', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { result: { Vmstate: 'FAULT' } } } as any)

    await expect(
      atipicialAtipicialXBridgeService.getTransactionHashByNonce({
        token: atipicialAtipicialXBridgeService.gasToken,
        nonce: '761',
      })
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(BSError)
      expect((error as BSError).code).toBe('INVALID_TRANSACTION')
      return true
    })
  })

  it('Should be able to get the transaction hash by nonce', async () => {
    const transactionHash = await atipicialAtipicialXBridgeService.getTransactionHashByNonce({
      token: atipicialAtipicialXBridgeService.gasToken,
      nonce: '761',
    })

    expect(transactionHash).toBe('0x17ac3ee5939791ec82ae8bab8f5722ecb66edb250db72417fb3f2e57c1b239d9')
  })

  it.skip('Should be able to bridge GAS', async () => {
    const { bridgeFee, bridgeMinAmount } = await atipicialAtipicialXBridgeService.getBridgeConstants(
      atipicialAtipicialXBridgeService.gasToken
    )

    const balances = await bsAtipicialService.blockchainDataService.getBalance(account.address)

    const gasBalance = balances.find(balance =>
      bsAtipicialService.tokenService.predicateByHash(atipicialAtipicialXBridgeService.gasToken, balance.token)
    )
    if (!gasBalance) {
      throw new Error('It seems you do not have GAS balance to bridge')
    }

    expect(new BSBigHumanAmount(gasBalance.amount).isGreaterThanOrEqualTo(bridgeMinAmount)).toBe(true)

    const transactionHash = await atipicialAtipicialXBridgeService.bridge({
      account,
      receiverAddress,
      amount: bridgeMinAmount,
      token: atipicialAtipicialXBridgeService.gasToken,
      bridgeFee,
    })

    expect(transactionHash).toBeDefined()
  })

  it.skip('Should be able to bridge ATC', async () => {
    const { bridgeFee, bridgeMinAmount } = await atipicialAtipicialXBridgeService.getBridgeConstants(
      atipicialAtipicialXBridgeService.atipicialToken
    )

    const balances = await bsAtipicialService.blockchainDataService.getBalance(account.address)

    const atipicialBalance = balances.find(balance =>
      bsAtipicialService.tokenService.predicateByHash(atipicialAtipicialXBridgeService.atipicialToken, balance.token)
    )
    if (!atipicialBalance) {
      throw new Error('It seems you do not have GAS balance to bridge')
    }

    expect(new BSBigHumanAmount(atipicialBalance.amount).isGreaterThanOrEqualTo(bridgeMinAmount)).toBe(true)

    const transactionHash = await atipicialAtipicialXBridgeService.bridge({
      account,
      receiverAddress,
      amount: bridgeMinAmount,
      token: atipicialAtipicialXBridgeService.atipicialToken,
      bridgeFee,
    })

    expect(transactionHash).toBeDefined()
  })

  it.skip('Should be able to bridge NDMEME', async () => {
    const { bridgeFee, bridgeMinAmount } = await atipicialAtipicialXBridgeService.getBridgeConstants(
      atipicialAtipicialXBridgeService.ndmemeToken
    )

    const balances = await bsAtipicialService.blockchainDataService.getBalance(account.address)

    const ndmemeBalance = balances.find(balance =>
      bsAtipicialService.tokenService.predicateByHash(atipicialAtipicialXBridgeService.ndmemeToken, balance.token)
    )
    if (!ndmemeBalance) {
      throw new Error('It seems you do not have NDMEME balance to bridge')
    }

    expect(new BSBigHumanAmount(ndmemeBalance.amount).isGreaterThanOrEqualTo(bridgeMinAmount)).toBe(true)

    const transactionHash = await atipicialAtipicialXBridgeService.bridge({
      account,
      receiverAddress,
      amount: bridgeMinAmount,
      token: atipicialAtipicialXBridgeService.ndmemeToken,
      bridgeFee,
    })

    expect(transactionHash).toBeDefined()
  })
})
