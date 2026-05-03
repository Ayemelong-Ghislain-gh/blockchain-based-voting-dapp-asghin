import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers'
import {
  ABI,
  CONTRACT_ADDRESS,
  SEPOLIA_CHAIN_ID,
  type Election,
  type Candidate,
  parseElectionStatus,
} from './abi'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, listener: (...args: unknown[]) => void) => void
      removeListener: (
        event: string,
        listener: (...args: unknown[]) => void,
      ) => void
      isMetaMask?: boolean
      chainId?: string
    }
  }
}

export function getProvider(): BrowserProvider | null {
  if (typeof window === 'undefined' || !window.ethereum) return null
  return new BrowserProvider(window.ethereum)
}

export function getReadOnlyContract() {
  const provider = getProvider()
  if (!provider) return null
  return new Contract(CONTRACT_ADDRESS, ABI, provider)
}

export function getSignerContract(signer: JsonRpcSigner) {
  return new Contract(CONTRACT_ADDRESS, ABI, signer)
}

export async function requestAccounts(): Promise<string[]> {
  if (!window.ethereum) throw new Error('No wallet detected')
  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[]
  return accounts
}

export async function getCurrentChainId(): Promise<number> {
  if (!window.ethereum) return 0
  const chainId = (await window.ethereum.request({
    method: 'eth_chainId',
  })) as string
  return parseInt(chainId, 16)
}

export async function switchToSepolia(): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet detected')
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
    })
  } catch (err: unknown) {
    // If chain not added, add it
    if ((err as { code: number }).code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ],
      })
    } else {
      throw err
    }
  }
}

export async function loadElections(): Promise<Election[]> {
  const contract = getReadOnlyContract()
  if (!contract) return []
  try {
    const count = await contract.electionCount()
    const total = Number(count)
    if (total === 0) return []
    const results: Election[] = []
    for (let i = 1; i <= total; i++) {
      try {
        const e = await contract.getElection(i)
        results.push({
          id: Number(e[0]),
          title: e[1],
          description: e[2],
          startTime: new Date(Number(e[3]) * 1000),
          endTime: new Date(Number(e[4]) * 1000),
          status: parseElectionStatus(Number(e[5])),
          resultsPublished: e[6],
          candidateCount: Number(e[7]),
        })
      } catch {
        // Skip elections that fail to load
      }
    }
    return results
  } catch {
    return []
  }
}

export async function loadCandidates(electionId: number): Promise<Candidate[]> {
  const contract = getReadOnlyContract()
  if (!contract) return []
  try {
    const candidates = await contract.getAllCandidates(electionId)
    return candidates.map(
      (c: [bigint, string, string, bigint], i: number) => ({
        id: Number(c[0]) || i + 1,
        name: c[1],
        description: c[2],
        voteCount: Number(c[3]),
      }),
    )
  } catch {
    return []
  }
}

export async function checkVoterStatus(
  address: string,
): Promise<'approved' | 'pending' | 'none'> {
  const contract = getReadOnlyContract()
  if (!contract) return 'none'
  try {
    const approved = await contract.isVoterApproved(address)
    if (approved) return 'approved'
    // Try pendingVoters mapping
    try {
      const pending = await contract.pendingVoters(address)
      if (pending) return 'pending'
    } catch {
      // Function may not exist
    }
    return 'none'
  } catch {
    return 'none'
  }
}

export async function getVoterChoice(
  electionId: number,
  address: string,
): Promise<number> {
  const contract = getReadOnlyContract()
  if (!contract) return 0
  try {
    const choice = await contract.getVoterChoice(electionId, address)
    return Number(choice)
  } catch {
    return 0
  }
}

export async function getPendingVotersList(): Promise<string[]> {
  const contract = getReadOnlyContract()
  if (!contract) return []
  try {
    const voters = await contract.getPendingVoters()
    return voters as string[]
  } catch {
    // Fall back to event scanning
    try {
      const provider = getProvider()
      if (!provider) return []
      const c = new Contract(CONTRACT_ADDRESS, ABI, provider)
      const filter = c.filters.VoterRegistered()
      const events = await c.queryFilter(filter, -10000)
      return events.map((e) => (e as unknown as { args: [string] }).args[0])
    } catch {
      return []
    }
  }
}

export async function getApprovedVotersList(): Promise<string[]> {
  const contract = getReadOnlyContract()
  if (!contract) return []
  try {
    const voters = await contract.getApprovedVoters()
    return voters as string[]
  } catch {
    // Fall back to event scanning
    try {
      const provider = getProvider()
      if (!provider) return []
      const c = new Contract(CONTRACT_ADDRESS, ABI, provider)
      const filter = c.filters.VoterApproved()
      const events = await c.queryFilter(filter, -10000)
      return events.map((e) => (e as unknown as { args: [string] }).args[0])
    } catch {
      return []
    }
  }
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function getTxLink(hash: string): string {
  return `https://sepolia.etherscan.io/tx/${hash}`
}
