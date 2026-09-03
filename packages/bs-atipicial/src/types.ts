import type {
  TBSAccount,
  IBlockchainService,
  IBSWithClaim,
  IBSWithEncryption,
  IBSWithExplorer,
  IBSWithFee,
  IBSWithLedger,
  IBSWithNameService,
  IBSWithAtipicialXBridge,
  IBSWithNft,
  TBSNetworkId,
  IBSWithWalletConnect,
  IBSWithFullTransactions,
  TTransactionDefault,
  TTransferParams,
  TTransactionBase,
} from '@atipicial/blockchain-service'
import { wallet, api } from './helpers/BSAtipicialAtipicialJsSingletonHelper'
import type { AtipicialXBridgeService } from './services/atipicial-atipicialx-bridge/AtipicialXBridgeService'
import type { ClaimServiceAtipicial } from './services/claim/ClaimServiceAtipicial'
import type { VoteServiceAtipicial } from './services/vote/VoteServiceAtipicial'

export type TBSAtipicialNetworkId = TBSNetworkId<'mainnet' | 'testnet'>

export type TBSAtipicialName = 'atipicial'
export interface IBSAtipicial
  extends
    IBlockchainService<TBSAtipicialName, TBSAtipicialNetworkId>,
    IBSWithNameService,
    IBSWithClaim<TBSAtipicialName>,
    IBSWithFee<TBSAtipicialName>,
    IBSWithNft,
    IBSWithExplorer,
    IBSWithLedger<TBSAtipicialName>,
    IBSWithAtipicialXBridge<TBSAtipicialName>,
    IBSWithEncryption<TBSAtipicialName>,
    IBSWithWalletConnect<TBSAtipicialName>,
    IBSWithFullTransactions<TBSAtipicialName> {
  atipicialAtipicialXBridgeService: AtipicialXBridgeService
  claimService: ClaimServiceAtipicial
  voteService: VoteServiceAtipicial

  transfer(params: TTransferParams<TBSAtipicialName>): Promise<TTransactionDefault<TBSAtipicialName>[]>

  _generateSigningCallback(account: TBSAccount<TBSAtipicialName>): Promise<{
    atipicialJsAccount: wallet.Account
    signingCallback: api.SigningFunction
  }>
}

export type TVoteServiceCandidate = {
  position: number
  name: string
  description: string
  location: string
  email: string
  website: string
  hash: string
  pubKey: string
  votes: number
  logoUrl?: string
  type: 'consensus' | 'council'
}

export type TVoteServiceDetailsByAddressResponse = {
  candidateName?: string
  candidatePubKey?: string
  atipicialBalance: number
  address: string
}

export type TVoteServiceVoteParams = {
  account: TBSAccount<TBSAtipicialName>
  candidatePubKey: string
}

export type TDoraVoteServiceAtipicialGetVoteCIMParams = {
  address: string
  candidatePubKey: string
}

export type TDoraVoteServiceAtipicialGetCommitteeApiResponse = {
  scripthash: string
  name: string
  description: string
  location: string
  website: string
  email: string
  github: string
  telegram: string
  twitter: string
  logo: string
  votes: number
  pubkey: string
}

export type TDoraVoteServiceAtipicialGetVoteDetailsByAddressApiResponse = {
  vote: string
  candidate: string
  candidatePubkey: string
  balance: number
}

export type TVoteServiceAtipicialTransactionData = {
  isVote: true
}

export interface IVoteService {
  getCandidatesToVote(): Promise<TVoteServiceCandidate[]>
  getVoteDetailsByAddress(address: string): Promise<TVoteServiceDetailsByAddressResponse>
  vote(params: TVoteServiceVoteParams): Promise<TTransactionDefault<TBSAtipicialName>>
  calculateVoteFee(params: TVoteServiceVoteParams): Promise<string>
  getTransactionData(transaction: TTransactionBase): TVoteServiceAtipicialTransactionData | undefined
}

export type TRpcVoteServiceAtipicialGetVoteCIMParams = {
  address: string
  candidatePubKey: string
}

export type TAtipicialXBridgeServiceGetBridgeTxByNonceApiResponse = { result: { Vmstate: string; txid: string } }

export enum EAtipicialDappKitLedgerServiceAtipicialStatus {
  OK = 0x9000,
}

export enum EAtipicialDappKitLedgerServiceAtipicialCommand {
  GET_APP_NAME = 0x00,
  GET_PUBLIC_KEY = 0x04,
  SIGN = 0x02,
}

export enum EAtipicialDappKitLedgerServiceAtipicialSecondParameter {
  MORE_DATA = 0x80,
  LAST_DATA = 0x00,
}

export type TRpcBDSAtipicialNotificationState = {
  type: string
  value?: any | undefined
}

export type TRpcBDSAtipicialNotification = {
  contract: string
  eventname: string
  state: TRpcBDSAtipicialNotificationState | TRpcBDSAtipicialNotificationState[] | undefined
}

export type TWalletConnectServiceAtipicialMethod =
  | 'invokeFunction'
  | 'testInvoke'
  | 'signMessage'
  | 'verifyMessage'
  | 'getWalletInfo'
  | 'traverseIterator'
  | 'getNetworkVersion'
  | 'encrypt'
  | 'decrypt'
  | 'decryptFromArray'
  | 'calculateFee'
  | 'signTransaction'
