# AGENTS.md

Project documentation for AI agents working on this codebase.

## Project Overview

BlockVote is a decentralized voting DApp built with TanStack Start, deployed on Netlify. It interacts with a pre-deployed Solidity smart contract on the Ethereum Sepolia testnet. Users connect MetaMask wallets to register as voters, and the admin approves registrations and manages elections.

**Smart Contract:** `0x4C462Ebd0238964D26cd0CF1591956956BE78486` (Sepolia)  
**Admin wallet:** `0x8EBE60c6DD3FAE22e23AEE36333D202874AFc412` (hardcoded in contract)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Blockchain | ethers.js v6, Ethereum Sepolia |
| Language | TypeScript 5.7 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
src/
├── lib/
│   ├── abi.ts         # Contract address, ABI, TypeScript types (Election, Candidate)
│   └── web3.ts        # Web3 helpers: loadElections, loadCandidates, connect wallet, etc.
├── contexts/
│   └── WalletContext.tsx  # React context for wallet state (account, signer, voterStatus)
├── components/
│   ├── Header.tsx     # Sticky nav: logo, route links, wallet button, network badge
│   ├── Toast.tsx      # Toast notification system (ToastProvider + useToast hook)
│   └── SetupModal.tsx # Tutorial modal with setup steps and demo wallet keys
└── routes/
    ├── __root.tsx     # Root layout: wraps all pages in WalletProvider + ToastProvider
    ├── index.tsx      # Home page: elections grouped by status, vote modal
    ├── admin.tsx      # Admin dashboard: create election, add candidates, voter approval
    └── voter.tsx      # Voter registration page and election listing
```

## Key Architecture Decisions

### Contract ABI
The ABI in `src/lib/abi.ts` is human-readable format (ethers v6 style). Since the exact deployed ABI was not available at build time, the ABI is constructed from the function signatures in the requirements. If the contract returns different data shapes, update the ABI in `src/lib/abi.ts` and the parsing logic in `src/lib/web3.ts`.

### Voter Status Detection
1. `isVoterApproved(address)` — primary approved check
2. `pendingVoters(address)` — fallback public mapping for pending status
The pending check may not work if the contract doesn't expose this mapping as public.

### Election IDs
Elections are indexed from 1 to `electionCount()`. The `loadElections()` function iterates `1..count` and skips any that throw errors.

### Force Sepolia Mode
MetaMask mobile sometimes reports incorrect chainId. A `forceSepolia` flag in `localStorage` bypasses all network checks. The `WalletContext` reads this flag on mount.

## Coding Conventions

- **TypeScript strict mode** — all types explicit, no `any`
- **Tailwind CSS 4** — utility classes only
- **ethers.js v6** — `BrowserProvider` replaces v5's `Web3Provider`; BigInt from contract → `Number()`
- **Error handling** — all contract calls wrapped in try/catch; errors via `useToast().error()`
- **React hooks** — `useCallback` for effect dependencies

## File-Based Routing (TanStack Router)

Routes are defined by files in `src/routes/`:
- `__root.tsx` - Root layout wrapping all pages
- `index.tsx` - Route for `/`
- `admin.tsx` - Route for `/admin`
- `voter.tsx` - Route for `/voter`

## Development Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
```

## Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_CONTRACT_ADDRESS` | `0x4C462...` | Contract address (set in netlify.toml) |
