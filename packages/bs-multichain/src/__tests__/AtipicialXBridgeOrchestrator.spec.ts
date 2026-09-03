import {
  BSBigHumanAmount,
  BSError,
  BSUtilsHelper,
  type TBridgeTokenMultichainId,
  type TBSAccount,
  type TBSBridgeName,
  type TBalanceResponse,
  type TBridgeToken,
  type TBridgeValidateValue,
  type TBridgeValue,
} from '@atipicial/blockchain-service'
import { AtipicialXBridgeOrchestrator } from '../features/bridge'
import { BSAtipicial } from '@atipicial/bs-atipicial'
import { BSAtipicialX, BSAtipicialXConstants } from '@atipicial/bs-atipicialx'

const defaultNetwork = {
  ...BSAtipicialXConstants.MAINNET_NETWORK,
  url: BSAtipicialXConstants.RPC_LIST_BY_NETWORK_ID[BSAtipicialXConstants.MAINNET_NETWORK.id].find(
    url => !BSAtipicialXConstants.ANTI_MEV_RPC_LIST_BY_NETWORK_ID[BSAtipicialXConstants.MAINNET_NETWORK.id].includes(url)
  )!,
}

let atipicialService: BSAtipicial
let atipicialXService: BSAtipicialX
let atipicialAtipicialXBridgeOrchestrator: AtipicialXBridgeOrchestrator
let tokenToUse: TBridgeValue<TBridgeToken<TBSBridgeName>>
let accountToUse: TBridgeValue<TBSAccount<TBSBridgeName>>
let amountToUse: TBridgeValidateValue<string>
let amountToUseMin: TBridgeValue<string>
let amountToUseMax: TBridgeValue<string>
let tokenToReceive: TBridgeValue<TBridgeToken<TBSBridgeName>>
let addressToReceive: TBridgeValidateValue<string>
let amountToReceive: TBridgeValue<string>
let tokenToUseBalance: TBridgeValue<TBalanceResponse | undefined>
let bridgeFee: TBridgeValue<string>

describe('AtipicialXBridgeOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    tokenToUse = { value: null, loading: false, error: null }
    accountToUse = { value: null, loading: false, error: null }
    amountToUse = { value: null, valid: null, loading: false, error: null }
    amountToUseMin = { value: null, loading: false, error: null }
    amountToUseMax = { value: null, loading: false, error: null }
    tokenToReceive = { value: null, loading: false, error: null }
    addressToReceive = { value: null, valid: null, loading: false, error: null }
    amountToReceive = { value: null, loading: false, error: null }
    tokenToUseBalance = { value: null, loading: false, error: null }
    bridgeFee = { value: null, loading: false, error: null }

    atipicialService = new BSAtipicial()
    atipicialXService = new BSAtipicialX(defaultNetwork)

    atipicialAtipicialXBridgeOrchestrator = new AtipicialXBridgeOrchestrator({
      atipicialService,
      atipicialXService,
    })

    atipicialAtipicialXBridgeOrchestrator.eventEmitter.on('tokenToUse', value => {
      tokenToUse = value
    })

    atipicialAtipicialXBridgeOrchestrator.eventEmitter.on('accountToUse', value => {
      accountToUse = value
    })

    atipicialAtipicialXBridgeOrchestrator.eventEmitter.on('amountToUse', value => {
      amountToUse = value
    })

    atipicialAtipicialXBridgeOrchestrator.eventEmitter.on('amountToUseMin', value => {
      amountToUseMin = value
    })

    atipicialAtipicialXBridgeOrchestrator.eventEmitter.on('amountToUseMax', value => {
      amountToUseMax = value
    })

    atipicialAtipicialXBridgeOrchestrator.eventEmitter.on('tokenToReceive', value => {
      tokenToReceive = value
    })

    atipicialAtipicialXBridgeOrchestrator.eventEmitter.on('addressToReceive', value => {
      addressToReceive = value
    })

    atipicialAtipicialXBridgeOrchestrator.eventEmitter.on('amountToReceive', value => {
      amountToReceive = value
    })

    atipicialAtipicialXBridgeOrchestrator.eventEmitter.on('tokenToUseBalance', value => {
      tokenToUseBalance = value
    })

    atipicialAtipicialXBridgeOrchestrator.eventEmitter.on('bridgeFee', value => {
      bridgeFee = value
    })
  })

  it('Should not be able to set token to use if available tokens are not set', async () => {
    await expect(atipicialAtipicialXBridgeOrchestrator.setTokenToUse(null)).rejects.toThrow(
      new BSError('No available tokens to use', 'NO_AVAILABLE_TOKENS')
    )
  })

  it('Should not be able to set token to use if token is not in the available tokens', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    await expect(
      atipicialAtipicialXBridgeOrchestrator.setTokenToUse({
        symbol: 'INVALID',
        name: 'INVALID',
        hash: 'INVALID',
        decimals: 0,
        multichainId: 'INVALID' as TBridgeTokenMultichainId,
        blockchain: 'atipicial',
      })
    ).rejects.toThrow(new BSError('You are trying to use a token that is not available', 'TOKEN_NOT_AVAILABLE'))
  })

  it('Should be able to set token to use', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const setBalanceSpy = vi.spyOn(atipicialAtipicialXBridgeOrchestrator, 'setBalances')
    const setAmountToUseSpy = vi.spyOn(atipicialAtipicialXBridgeOrchestrator, 'setAmountToUse')

    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.gasToken
    const pairToken = atipicialAtipicialXBridgeOrchestrator.toService.atipicialAtipicialXBridgeService.gasToken
    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    expect(tokenToUse.value).toEqual(token)
    expect(tokenToReceive.value).toEqual(pairToken)
    expect(amountToUse.value).toEqual(null)
    expect(setBalanceSpy).toHaveBeenCalledTimes(1)
    expect(setAmountToUseSpy).toHaveBeenCalledTimes(1)
    expect(setAmountToUseSpy).toHaveBeenCalledWith(null)
    expect(setAmountToUseSpy).toHaveBeenCalledWith(null)
  })

  it('Should be able to set token to use to null', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.gasToken
    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    expect(tokenToUse.value).toEqual(token)

    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(null)

    expect(tokenToUse.value).toEqual(null)
    expect(tokenToReceive.value).toEqual(null)
  })

  it('Should not be able to set account to use if account and service is from different blockchains', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const account = await atipicialAtipicialXBridgeOrchestrator.fromService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY
    )
    account.blockchain = 'atipicialx'

    await expect(atipicialAtipicialXBridgeOrchestrator.setAccountToUse(account)).rejects.toThrow(
      new BSError(
        'You are trying to use an account that is not compatible with the selected token',
        'ACCOUNT_NOT_COMPATIBLE_WITH_TOKEN'
      )
    )
  })

  it('Should be able to set account to use', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const setBalanceSpy = vi.spyOn(atipicialAtipicialXBridgeOrchestrator, 'setBalances')
    const setAmountToUseSpy = vi.spyOn(atipicialAtipicialXBridgeOrchestrator, 'setAmountToUse')

    const account = await atipicialAtipicialXBridgeOrchestrator.fromService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY
    )

    await atipicialAtipicialXBridgeOrchestrator.setAccountToUse(account)

    expect(accountToUse.value).toEqual(account)
    expect(amountToUse.value).toEqual(null)
    expect(amountToReceive.value).toEqual(null)
    expect(tokenToUseBalance.value).toEqual(null)
    expect(bridgeFee.value).toEqual(null)
    expect(amountToUseMin.value).toEqual(null)
    expect(amountToUseMax.value).toEqual(null)
    expect(setBalanceSpy).toHaveBeenCalledTimes(1)
    expect(setAmountToUseSpy).toHaveBeenCalledTimes(1)
    expect(setAmountToUseSpy).toHaveBeenCalledWith(null)
    expect(setAmountToUseSpy).toHaveBeenCalledWith(null)
  })

  it('Should be able to set account to use to null', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const account = await atipicialAtipicialXBridgeOrchestrator.fromService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY
    )

    await atipicialAtipicialXBridgeOrchestrator.setAccountToUse(account)

    expect(accountToUse.value).toEqual(account)

    await atipicialAtipicialXBridgeOrchestrator.setAccountToUse(null)

    expect(accountToUse.value).toEqual(null)
  })

  it('Should be able to set address to receive to a invalid address', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const validateAddressSpy = vi.spyOn(atipicialAtipicialXBridgeOrchestrator.toService, 'validateAddress')

    const receiverAddress = 'INVALID_ADDRESS'
    await atipicialAtipicialXBridgeOrchestrator.setAddressToReceive(receiverAddress)

    expect(addressToReceive.value).toEqual(receiverAddress)
    expect(addressToReceive.valid).toEqual(null)

    await BSUtilsHelper.wait(1500)

    expect(addressToReceive.valid).toEqual(false)
    expect(validateAddressSpy).toHaveBeenCalledTimes(1)
    expect(validateAddressSpy).toHaveBeenCalledWith(receiverAddress)
  })

  it('Should be able to set address to receive to a valid address', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const validateAddressSpy = vi.spyOn(atipicialAtipicialXBridgeOrchestrator.toService, 'validateAddress')

    const toAccount = await atipicialAtipicialXBridgeOrchestrator.toService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATCX_PRIVATE_KEY
    )

    await atipicialAtipicialXBridgeOrchestrator.setAddressToReceive(toAccount.address)

    expect(addressToReceive.value).toEqual(toAccount.address)
    expect(addressToReceive.valid).toEqual(null)

    await BSUtilsHelper.wait(1500)

    expect(addressToReceive.valid).toEqual(true)
    expect(validateAddressSpy).toHaveBeenCalledTimes(1)
    expect(validateAddressSpy).toHaveBeenCalledWith(toAccount.address)
  })

  it('Should be able to set address to receive to null', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const validateAddressSpy = vi.spyOn(atipicialAtipicialXBridgeOrchestrator.toService, 'validateAddress')

    const toAccount = await atipicialAtipicialXBridgeOrchestrator.toService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATCX_PRIVATE_KEY
    )
    await atipicialAtipicialXBridgeOrchestrator.setAddressToReceive(toAccount.address)

    await BSUtilsHelper.wait(1500)

    expect(addressToReceive.value).toEqual(toAccount.address)
    expect(addressToReceive.valid).toEqual(true)
    expect(validateAddressSpy).toHaveBeenCalledTimes(1)

    await atipicialAtipicialXBridgeOrchestrator.setAddressToReceive(null)

    expect(addressToReceive.value).toEqual(null)
    expect(addressToReceive.valid).toEqual(null)

    await BSUtilsHelper.wait(1500)

    expect(addressToReceive.valid).toEqual(null)
    expect(validateAddressSpy).toHaveBeenCalledTimes(1)
  })

  it('Should be able to set balances if balance does not exist', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.gasToken
    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    const balances: TBalanceResponse[] = []

    await atipicialAtipicialXBridgeOrchestrator.setBalances(balances)

    expect(tokenToUseBalance.value).toEqual(undefined)
    expect(amountToUseMax.value).toEqual('0')
    expect(amountToUseMin.value).toEqual(expect.any(String))
    expect(bridgeFee.value).toEqual(expect.any(String))
  })

  it('Should be able to set balances', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.gasToken
    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    const balances: TBalanceResponse[] = [{ amount: '5', token }]

    await atipicialAtipicialXBridgeOrchestrator.setBalances(balances)

    const balance = balances[0]

    const newAmount = new BSBigHumanAmount(balance.amount, token.decimals).minus(bridgeFee.value!).toString()
    expect(tokenToUseBalance.value).toEqual(balance)
    expect(amountToUseMax.value).toEqual(newAmount)
    expect(amountToUseMin.value).toEqual(expect.any(String))
    expect(bridgeFee.value).toEqual(expect.any(String))
  })

  it('Should be able to set amount to use if required fields are not set', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const amount = '1'

    await atipicialAtipicialXBridgeOrchestrator.setAmountToUse(amount)

    await BSUtilsHelper.wait(3000)

    expect(amountToUse.value).toEqual(amount)
    expect(amountToUse.valid).toEqual(null)
    expect(amountToUse.error).toEqual(null)
    expect(amountToReceive.value).toEqual(null)
  })

  it('Should not be able to set amount to use if amount is less than min', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.gasToken
    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    const account = await atipicialAtipicialXBridgeOrchestrator.fromService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY
    )
    await atipicialAtipicialXBridgeOrchestrator.setAccountToUse(account)

    const balances: TBalanceResponse[] = [{ amount: '5', token }]
    await atipicialAtipicialXBridgeOrchestrator.setBalances(balances)

    const amount = '0'

    await atipicialAtipicialXBridgeOrchestrator.setAmountToUse(amount)

    await BSUtilsHelper.wait(3000)

    expect(amountToUse.value).toEqual(amount)
    expect(amountToUse.valid).toEqual(false)
    expect(amountToUse.error).toEqual(new BSError('Amount is below the minimum', 'AMOUNT_BELOW_MINIMUM'))
    expect(amountToReceive.value).toEqual(amount)
  })

  it('Should not be able to set amount to use if amount is greater than max', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.gasToken
    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    const account = await atipicialAtipicialXBridgeOrchestrator.fromService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY
    )
    await atipicialAtipicialXBridgeOrchestrator.setAccountToUse(account)

    const balances: TBalanceResponse[] = [{ amount: '5', token }]
    await atipicialAtipicialXBridgeOrchestrator.setBalances(balances)

    const amount = '10'

    await atipicialAtipicialXBridgeOrchestrator.setAmountToUse(amount)

    await BSUtilsHelper.wait(3000)

    expect(amountToUse.value).toEqual(amount)
    expect(amountToUse.valid).toEqual(false)
    expect(amountToUse.error).toEqual(new BSError('Amount is above the maximum', 'AMOUNT_ABOVE_MAXIMUM'))
    expect(amountToReceive.value).toEqual(amount)
  })

  it('Should not be able to set amount to use if balance is not sufficient to pay fee', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.atipicialToken

    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    const account = await atipicialAtipicialXBridgeOrchestrator.fromService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY
    )
    await atipicialAtipicialXBridgeOrchestrator.setAccountToUse(account)

    const balances: TBalanceResponse[] = [{ amount: '5', token }]
    await atipicialAtipicialXBridgeOrchestrator.setBalances(balances)

    const amount = amountToUseMax.value!

    vi.spyOn(atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService, 'getApprovalFee').mockResolvedValue('1')

    await atipicialAtipicialXBridgeOrchestrator.setAmountToUse(amount)

    await BSUtilsHelper.wait(3000)

    expect(amountToUse.value).toEqual(amount)
    expect(amountToUse.valid).toEqual(false)
    expect(amountToUse.error).toEqual(
      new BSError('You do not have enough fee token balance to cover the bridge fee', 'INSUFFICIENT_FEE_TOKEN_BALANCE')
    )
    expect(amountToReceive.value).toEqual(amount)
  })

  it('Should be able to set amount to use', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.gasToken

    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    const account = await atipicialAtipicialXBridgeOrchestrator.fromService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY
    )
    await atipicialAtipicialXBridgeOrchestrator.setAccountToUse(account)

    const balances: TBalanceResponse[] = [{ amount: '5', token }]
    await atipicialAtipicialXBridgeOrchestrator.setBalances(balances)

    const amount = amountToUseMax.value!
    await atipicialAtipicialXBridgeOrchestrator.setAmountToUse(amount)

    await BSUtilsHelper.wait(3000)

    expect(amountToUse.value).toEqual(amount)
    expect(amountToUse.valid).toEqual(true)
    expect(amountToReceive.value).toEqual(amount)
  })

  it('Should be able to set amount to use to null', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.gasToken

    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    const account = await atipicialAtipicialXBridgeOrchestrator.fromService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY
    )
    await atipicialAtipicialXBridgeOrchestrator.setAccountToUse(account)

    const balances: TBalanceResponse[] = [{ amount: '5', token }]
    await atipicialAtipicialXBridgeOrchestrator.setBalances(balances)

    const amount = amountToUseMax.value!
    await atipicialAtipicialXBridgeOrchestrator.setAmountToUse(amount)

    await BSUtilsHelper.wait(3000)

    expect(amountToUse.value).toEqual(amount)

    await atipicialAtipicialXBridgeOrchestrator.setAmountToUse(null)

    await BSUtilsHelper.wait(3000)

    expect(amountToUse.value).toEqual(null)
    expect(amountToUse.valid).toEqual(null)
    expect(amountToReceive.value).toEqual(null)
  })

  it('Should be able to switch tokens', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.gasToken

    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    const account = await atipicialAtipicialXBridgeOrchestrator.fromService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY
    )
    await atipicialAtipicialXBridgeOrchestrator.setAccountToUse(account)

    const balances: TBalanceResponse[] = [{ amount: '5', token }]
    await atipicialAtipicialXBridgeOrchestrator.setBalances(balances)

    const amount = amountToUseMax.value!
    await atipicialAtipicialXBridgeOrchestrator.setAmountToUse(amount)

    await BSUtilsHelper.wait(3000)

    expect(amountToUse.value).toEqual(amount)

    const newTokenToUse = atipicialAtipicialXBridgeOrchestrator.toService.atipicialAtipicialXBridgeService.gasToken

    await atipicialAtipicialXBridgeOrchestrator.switchTokens()

    expect(tokenToUse.value).toEqual(newTokenToUse)
    expect(tokenToReceive.value).toEqual(token)
    expect(amountToUse.value).toEqual(null)
    expect(amountToReceive.value).toEqual(null)
    expect(tokenToUseBalance.value).toEqual(null)
    expect(bridgeFee.value).toEqual(null)
    expect(amountToUseMin.value).toEqual(null)
    expect(amountToUseMax.value).toEqual(null)
    expect(accountToUse.value).toEqual(null)
    expect(addressToReceive.value).toEqual(null)
  })

  it('Should not be able to bridge if required fields are not set', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    await expect(atipicialAtipicialXBridgeOrchestrator.bridge()).rejects.toThrow(
      new BSError('Required parameters are not set for bridging', 'BRIDGE_NOT_READY')
    )
  })

  it.skip('Should be able to bridge', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()
    await atipicialAtipicialXBridgeOrchestrator.switchTokens()

    const account = await atipicialAtipicialXBridgeOrchestrator.fromService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATCX_PRIVATE_KEY
    )
    await atipicialAtipicialXBridgeOrchestrator.setAccountToUse(account)

    const balances = await atipicialAtipicialXBridgeOrchestrator.fromService.blockchainDataService.getBalance(account.address)
    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.gasToken

    await atipicialAtipicialXBridgeOrchestrator.setBalances(balances)
    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    const receiverAccount = await atipicialAtipicialXBridgeOrchestrator.toService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY
    )
    await atipicialAtipicialXBridgeOrchestrator.setAddressToReceive(receiverAccount.address)

    const amount = amountToUseMin.value!

    await atipicialAtipicialXBridgeOrchestrator.setAmountToUse(amount)

    await BSUtilsHelper.wait(3000)

    const transactionHash = await atipicialAtipicialXBridgeOrchestrator.bridge()

    expect(transactionHash).toEqual(expect.any(String))
  })

  it.skip('Should be able to wait', async () => {
    await atipicialAtipicialXBridgeOrchestrator.init()

    const token = atipicialAtipicialXBridgeOrchestrator.fromService.atipicialAtipicialXBridgeService.gasToken

    await atipicialAtipicialXBridgeOrchestrator.setTokenToUse(token)

    const account = await atipicialAtipicialXBridgeOrchestrator.fromService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATIPICIAL_PRIVATE_KEY
    )
    await atipicialAtipicialXBridgeOrchestrator.setAccountToUse(account)

    const receiverAccount = await atipicialAtipicialXBridgeOrchestrator.toService.generateAccountFromKey(
      process.env.TEST_BRIDGE_ATCX_PRIVATE_KEY
    )
    await atipicialAtipicialXBridgeOrchestrator.setAddressToReceive(receiverAccount.address)

    const balances = await atipicialAtipicialXBridgeOrchestrator.fromService.blockchainDataService.getBalance(account.address)

    await atipicialAtipicialXBridgeOrchestrator.setBalances(balances)
    await atipicialAtipicialXBridgeOrchestrator.setAmountToUse(amountToUseMin.value!)

    await BSUtilsHelper.wait(3000)

    const transactionHash = await atipicialAtipicialXBridgeOrchestrator.bridge()

    expect(transactionHash).toEqual(expect.any(String))

    await expect(
      AtipicialXBridgeOrchestrator.wait({
        atipicialService,
        atipicialXService,
        tokenToUse: tokenToUse.value!,
        tokenToReceive: tokenToReceive.value!,
        transactionHash,
      })
    ).resolves.not.toThrow()
  }, 120_000)
})
