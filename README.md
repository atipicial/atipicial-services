<div align="center">

# 🧰 ATIPICIAL SERVICES

### The blockchain-service toolkit behind every Atipicial wallet

**Typed chain services, account management, transaction building, balance & history APIs**

</div>

<p align="center">
  <img alt="Founder" src="https://img.shields.io/badge/%F0%9F%91%91_Founder-xmoohad-ff006e?style=for-the-badge">
  <img alt="Chain" src="https://img.shields.io/badge/Chain-Atipicial_L1-9d4edd?style=for-the-badge">
  <img alt="ATC" src="https://img.shields.io/badge/%F0%9F%AA%99_ATC-Atipicial_Coin-ffd60a?style=for-the-badge">
  <img alt="ATD" src="https://img.shields.io/badge/%F0%9F%92%B5_ATD-AtipicialDollar-06d6a0?style=for-the-badge">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-3a86ff?style=for-the-badge">
</p>

---

## 📦 Packages

| Package | Purpose |
|---|---|
| **`@atipicial/blockchain-service`** | Core abstractions: accounts, keys, transactions, common types |
| **`@atipicial/bs-atipicial`** | The Atipicial Chain service — RPC, balances, transfers, AEP-17/11 |
| **`@atipicial/bs-multichain`** | Aggregator wiring services together (Atipicial-first) |
| **`@atipicial/bs-electron`** | Electron bridge for desktop wallets |

## ✨ What It Does

- **Account generation & derivation** from mnemonics and private keys
- **Transaction construction** — transfers, contract invocations, claims
- **Balance & history APIs** — AEP-17 tokens, AEP-11 NFTs, ATC/ATD
- **Hardware wallet transports** — Ledger integration hooks
- **Price & market data** feeds for portfolio displays

## 🚀 Getting Started

```bash
pnpm install
pnpm build

import { BSAtipicial } from '@atipicial/bs-atipicial'

const service = new BSAtipicial()
const balance = await service.getBalance('AaZz…YourAtipicialAddress')
```
## ⛓️ Built for the Atipicial Chain

| | |
|---|---|
| **ATC** | Atipicial Coin — governance & staking · 1,000,000,000 total |
| **ATD** | AtipicialDollar — settlement & fees · 500,000,000 genesis |
| **Addresses** | Begin with capital **`A`** (version byte `0x09`) |
| **Standards** | AEP-17 (fungible) · AEP-11 (NFT) · AEP-6 (wallets) · AEP-2 (keys) |
| **Genesis** | 2026-07-20 00:00:00 UTC |
| **Mainnet RPC** | `https://seed1.atipicial.com:10332` |
| **Consensus** | dBFT 2.0 — single-block finality |

Legacy network packages (Neo Legacy, Neo X, Ethereum, Solana, Stellar, Bitcoin)
have been **removed** — this toolkit is pure Atipicial.

---

<div align="center">

## 👑 FOUNDER

### **xmoohad**

**Founder · Architect · Blockchain Scientist · Computer Programmer**

*Atipicial Chain is a sovereign Layer-1 blockchain for smart contracts,
digital assets, and decentralized applications.*

</div>

---

*© Atipicial Chain · Founded by xmoohad · MIT License*
