import {
  BSBigHumanAmount,
  BSCommonConstants,
  TTransactionDefault,
  type TTransactionBase,
  type TTransactionDefaultEvent,
  type TTransactionDefaultGenericEvent,
} from '@atipicial/blockchain-service'
import axios, { AxiosInstance } from 'axios'
import type {
  IBSAtipicial,
  IVoteService,
  TBSAtipicialName,
  TDoraVoteServiceAtipicialGetCommitteeApiResponse,
  TDoraVoteServiceAtipicialGetVoteCIMParams,
  TDoraVoteServiceAtipicialGetVoteDetailsByAddressApiResponse,
  TVoteServiceCandidate,
  TVoteServiceDetailsByAddressResponse,
  TVoteServiceAtipicialTransactionData,
  TVoteServiceVoteParams,
} from '../../types'
import { BSAtipicialAtipicialJsSingletonHelper } from '../../helpers/BSAtipicialAtipicialJsSingletonHelper'
import {
  BSAtipicialAtipicialDappKitSingletonHelper,
  ContractInvocationMulti,
} from '../../helpers/BSAtipicialAtipicialDappKitSingletonHelper'
import { BSAtipicialConstants } from '../../constants/BSAtipicialConstants'

export class VoteServiceAtipicial implements IVoteService {
  readonly _service: IBSAtipicial

  #apiInstance?: AxiosInstance

  constructor(service: IBSAtipicial) {
    this._service = service
  }

  get #api() {
    if (!this.#apiInstance) {
      this.#apiInstance = axios.create({ baseURL: `${BSCommonConstants.COZ_API_URL}/api/v2/atipicial` })
    }
    return this.#apiInstance
  }

  #buildVoteInvocation({ address, candidatePubKey }: TDoraVoteServiceAtipicialGetVoteCIMParams): ContractInvocationMulti {
    const { tx } = BSAtipicialAtipicialJsSingletonHelper.getInstance()

    return {
      invocations: [
        {
          scriptHash: BSAtipicialConstants.ATC_TOKEN.hash,
          operation: 'vote',
          args: [
            { type: 'Hash160', value: address },
            { type: 'PublicKey', value: candidatePubKey },
          ],
        },
      ],
      signers: [{ scopes: tx.WitnessScope.CalledByEntry }],
    }
  }

  _buildTransactionEvent(address: string, candidate: string): TTransactionDefaultGenericEvent {
    return {
      eventType: 'generic',
      methodName: 'vote',
      from: address,
      fromUrl: this._service.explorerService.buildAddressUrl(address),
      amount: '1',
      data: { candidate, token: BSAtipicialConstants.ATC_TOKEN.symbol },
    }
  }

  _getTransactionDataFromEvents(events: TTransactionDefaultEvent[]): TVoteServiceAtipicialTransactionData | undefined {
    if (!events?.length) return

    const hasVoteEvent = events.some(
      event =>
        event.eventType === 'generic' &&
        event.methodName === 'vote' &&
        event.data?.token === BSAtipicialConstants.ATC_TOKEN.symbol
    )

    if (!hasVoteEvent) return

    return { isVote: true }
  }

  getTransactionData(transaction: TTransactionBase): TVoteServiceAtipicialTransactionData | undefined {
    return transaction.data?.isVote === true ? transaction.data : undefined
  }

  async getCandidatesToVote(): Promise<TVoteServiceCandidate[]> {
    if (this._service.network.type !== 'mainnet') throw new Error('Only Mainnet is supported')

    const { data } = await this.#api.get<TDoraVoteServiceAtipicialGetCommitteeApiResponse[]>('/mainnet/committee')

    return data.map(({ logo, ...candidate }, index) => {
      const position = index + 1

      return {
        position,
        name: candidate.name,
        description: candidate.description,
        location: candidate.location,
        email: candidate.email,
        website: candidate.website,
        hash: candidate.scripthash,
        pubKey: candidate.pubkey,
        votes: candidate.votes,
        logoUrl: /^https?:\/\//.test(logo) ? logo : undefined,
        type: position <= 7 ? 'consensus' : 'council',
      }
    })
  }

  async getVoteDetailsByAddress(address: string): Promise<TVoteServiceDetailsByAddressResponse> {
    if (this._service.network.type !== 'mainnet') throw new Error('Only Mainnet is supported')
    if (!address) throw new Error('Missing address')
    if (!this._service.validateAddress(address)) throw new Error('Invalid address')

    const { data } = await this.#api.get<TDoraVoteServiceAtipicialGetVoteDetailsByAddressApiResponse>(
      `/mainnet/voter/${address}`
    )

    return {
      candidateName: data.candidate ?? undefined,
      candidatePubKey: data.candidatePubkey ?? undefined,
      atipicialBalance: data.balance,
      address,
    }
  }

  async vote({ account, candidatePubKey }: TVoteServiceVoteParams): Promise<TTransactionDefault<TBSAtipicialName>> {
    if (this._service.network.type !== 'mainnet') throw new Error('Only Mainnet is supported')
    if (!candidatePubKey) throw new Error('Missing candidatePubKey param')

    const { atipicialJsAccount, signingCallback } = await this._service._generateSigningCallback(account)
    const { AtipicialInvoker } = BSAtipicialAtipicialDappKitSingletonHelper.getInstance()

    const invoker = await AtipicialInvoker.init({
      rpcAddress: this._service.network.url,
      account: atipicialJsAccount,
      signingCallback,
    })

    // Since we are interacting with Atipicial, the chain will automatically claim GAS for the user
    const claimEvent = await this._service.claimService._buildTransactionEvent(account.address)

    const voteEvent = this._buildTransactionEvent(account.address, candidatePubKey)

    const invocationMulti = this.#buildVoteInvocation({ address: account.address, candidatePubKey })
    const fees = await invoker.calculateFee(invocationMulti)
    const txId = await invoker.invokeFunction(invocationMulti)

    const feeDecimals = this._service.feeToken.decimals
    const invocationCount = invocationMulti.invocations.length
    const data = { isVote: true } as TVoteServiceAtipicialTransactionData

    return {
      isPending: true,
      relatedAddress: account.address,
      blockchain: this._service.name,
      txId,
      txIdUrl: this._service.explorerService.buildTransactionUrl(txId),
      date: new Date().toJSON(),
      invocationCount,
      networkFeeAmount: new BSBigHumanAmount(fees.networkFee, feeDecimals).toFormatted(),
      systemFeeAmount: new BSBigHumanAmount(fees.systemFee, feeDecimals).toFormatted(),
      view: 'default',
      events: [claimEvent, voteEvent],
      data,
    }
  }

  async calculateVoteFee({ account, candidatePubKey }: TVoteServiceVoteParams): Promise<string> {
    if (this._service.network.type !== 'mainnet') throw new Error('Only Mainnet is supported')
    if (!candidatePubKey) throw new Error('Missing candidatePubKey param')

    const { atipicialJsAccount } = await this._service._generateSigningCallback(account)
    const { AtipicialInvoker } = BSAtipicialAtipicialDappKitSingletonHelper.getInstance()

    const invoker = await AtipicialInvoker.init({
      rpcAddress: this._service.network.url,
      account: atipicialJsAccount,
    })

    const cim = this.#buildVoteInvocation({ address: account.address, candidatePubKey })

    const { total } = await invoker.calculateFee(cim)

    return new BSBigHumanAmount(total, this._service.feeToken.decimals).toFormatted()
  }
}
