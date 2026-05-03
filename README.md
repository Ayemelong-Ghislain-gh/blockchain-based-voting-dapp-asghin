# BlockVote — Decentralized Voting DApp

A production-ready blockchain voting application where admins create elections, approve voters, and participants cast votes on the Ethereum Sepolia testnet. All votes are permanently recorded on-chain and verifiable by anyone.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (SSR-capable React framework) |
| Routing | TanStack Router v1 (file-based) |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Blockchain | Ethereum Sepolia testnet via ethers.js v6 |
| Wallet | MetaMask (EIP-1193 browser extension) |
| Deployment | Netlify |
| Language | TypeScript 5.7 (strict mode) |

## Contract Details

- **Address:** `0x4C462Ebd0238964D26cd0CF1591956956BE78486`
- **Network:** Sepolia Testnet (Chain ID: 11155111)
- **Admin Wallet:** `0x8EBE60c6DD3FAE22e23AEE36333D202874AFc412`
- **Explorer:** [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x4C462Ebd0238964D26cd0CF1591956956BE78486)

## Features

### For Voters
- Browse all elections (no wallet required)
- Register with MetaMask wallet
- Track registration status (Not registered → Pending → Approved)
- Cast votes in active elections
- View results with percentage bars

### For Admins
- Create elections with title, description, and date range
- Add candidates to elections
- Approve or reject voter registrations
- Start / End elections
- Publish final results
- Real-time vote tallies

### Mobile Support
- "Force Sepolia Mode" bypasses unreliable mobile network detection
- Works inside MetaMask's in-app browser

## Running Locally

```bash
# Install dependencies
npm install

# Start development server (runs on port 3000, proxied via Netlify CLI on 8888)
npm run dev

# Production build
npm run build
```

Requires MetaMask browser extension and Sepolia test ETH. Get free test ETH from:
- [Alchemy Faucet](https://sepoliafaucet.com)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)

## Demo Wallets

Five pre-funded, pre-approved demo wallets are available in the Setup Guide modal (accessible from the home page). Import any private key into MetaMask to vote immediately. Each wallet can vote only once per election.
