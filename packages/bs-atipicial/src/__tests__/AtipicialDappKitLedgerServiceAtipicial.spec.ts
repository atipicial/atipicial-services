import Transport from '@ledgerhq/hw-transport'
import { AtipicialDappKitLedgerServiceAtipicial } from '../services/ledger/AtipicialDappKitLedgerServiceAtipicial'
import { BSAtipicial } from '../BSAtipicial'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { BSAtipicialConstants } from '../constants/BSAtipicialConstants'
import { BSKeychainHelper } from '@atipicial/blockchain-service'

let ledgerService: AtipicialDappKitLedgerServiceAtipicial
let transport: Transport
let bsAtipicial: BSAtipicial

describe.skip('AtipicialDappKitLedgerServiceAtipicial', () => {
  beforeAll(async () => {
    const network = BSAtipicialConstants.TESTNET_NETWORK
    bsAtipicial = new BSAtipicial(network)

    transport = await TransportNodeHid.create()
    ledgerService = new AtipicialDappKitLedgerServiceAtipicial(bsAtipicial, async () => transport)
  })

  it('Should be able to get all accounts automatically', async () => {
    const accounts = await ledgerService.getAccounts(transport)
    expect(accounts.length).toBeGreaterThan(1)

    accounts.forEach((account, index) => {
      expect(account).toEqual(
        expect.objectContaining({
          address: expect.any(String),
          key: expect.any(String),
          type: 'publicKey',
          bipPath: BSKeychainHelper.getBipPath(bsAtipicial.bipDerivationPath, index),
        })
      )
    })
  })

  it('Should be able to get all accounts until index', async () => {
    const firstAccount = await ledgerService.getAccount(transport, 0)
    const accounts = await ledgerService.getAccounts(transport, {
      atipicial: {
        [firstAccount.address]: 6,
      },
    })

    expect(accounts.length).toBe(7)
    accounts.forEach((account, index) => {
      expect(account).toEqual(
        expect.objectContaining({
          address: expect.any(String),
          key: expect.any(String),
          type: 'publicKey',
          bipPath: BSKeychainHelper.getBipPath(bsAtipicial.bipDerivationPath, index),
        })
      )
    })
  })

  it('Should be able to get account', async () => {
    const account = await ledgerService.getAccount(transport, 0)
    expect(account).toEqual(
      expect.objectContaining({
        address: expect.any(String),
        key: expect.any(String),
        type: 'publicKey',
        bipPath: BSKeychainHelper.getBipPath(bsAtipicial.bipDerivationPath, 0),
      })
    )
  })
})
