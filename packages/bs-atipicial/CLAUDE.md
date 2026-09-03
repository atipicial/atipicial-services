# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

ATC  blockchain service. Includes voting, GAS claiming, and Atipicial→AtipicialX bridge support.

## Commands

```bash
rushx build
rushx test
rushx test src/__tests__/BSAtipicial.spec.ts  # single file
rushx lint
rushx typecheck
```

## Structure

```
src/
├── __tests__/              # 11 test files
├── constants/              # BSAtipicialConstants (networks, tokens, contract hashes)
├── helpers/
│   ├── BSAtipicialHelper                       # Address/key utilities
│   ├── BSAtipicialAtipicialJsSingletonHelper        # Singleton atipicial-js instance
│   └── BSAtipicialAtipicialDappKitSingletonHelper   # Singleton AtipicialDappKit instance
├── services/
│   ├── blockchain-data/        # Dora + RPC BDS
│   ├── exchange-data/          # FlamingoForthewinEDS
│   ├── explorer/               # DoraExplorerService
│   ├── full-transactions-data/ # DoraFullTransactionsData
│   ├── ledger/                 # AtipicialDappKitLedgerService
│   ├── nft-data/               # GhostMarketNDS
│   ├── claim/                  # ClaimServiceAtipicial (GAS distribution)
│   ├── vote/                   # VoteServiceAtipicial (candidates, committee, council)
│   ├── atipicial-atipicialx-bridge/       # AtipicialXBridgeService
│   ├── token/                  # TokenServiceAtipicial
│   └── wallet-connect/         # WalletConnectServiceAtipicial
├── types.ts                # Voting types, bridge types, Dora API shapes
├── BSAtipicial.ts               # Main class
└── index.ts
```

## Architecture

`BSAtipicial` exposes two ATC-specific services not found in other blockchains:

- **`voteService`** (`IVoteService<N>`) — fetches candidates, committee members, council members, and submits votes on-chain.
- **`claimService`** (`IClaimService<N>`) — claims uncollected GAS rewards.
- **`atipicialAtipicialXBridgeService`** — orchestrates the bridge from ATC  to ATC X.

**Key libraries:**
- `@atipicial/atipicial-js` v5 — core ATC  operations
- `@atipicial/atipicial-dappkit` v0.6 — dApp toolkit (used for Ledger)
- `@atipicial/dora-ts` — Dora blockchain data API client

**Singleton helpers:** `BSAtipicialAtipicialJsSingletonHelper` and `BSAtipicialAtipicialDappKitSingletonHelper` manage shared instances to avoid duplicate initialization across services within the same `BSAtipicial` object.

**Multi-transfer:** ATC  supports sending multiple token intents in a single transaction (`isMultiTransferSupported = true`).

**Custom networks:** Supported — consumers can pass custom network URLs.
