import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { JsonRpcSigner } from 'ethers'
import { BrowserProvider } from 'ethers'
import {
  ADMIN_ADDRESS,
  SEPOLIA_CHAIN_ID,
} from '@/lib/abi'
import {
  requestAccounts,
  getCurrentChainId,
  checkVoterStatus,
} from '@/lib/web3'

type VoterStatus = 'approved' | 'pending' | 'none'

interface WalletState {
  account: string | null
  signer: JsonRpcSigner | null
  chainId: number | null
  isAdmin: boolean
  voterStatus: VoterStatus
  isConnecting: boolean
  forceSepolia: boolean
  isCorrectNetwork: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchNetwork: () => Promise<void>
  setForceSepolia: (v: boolean) => void
  refreshVoterStatus: () => Promise<void>
}

const WalletContext = createContext<WalletState | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [voterStatus, setVoterStatus] = useState<VoterStatus>('none')
  const [isConnecting, setIsConnecting] = useState(false)
  const [forceSepolia, setForceSepoliaState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('forceSepolia') === 'true'
    }
    return false
  })

  const isAdmin = account?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
  const isCorrectNetwork =
    forceSepolia || chainId === SEPOLIA_CHAIN_ID

  const setForceSepolia = useCallback((v: boolean) => {
    setForceSepoliaState(v)
    if (typeof window !== 'undefined') {
      if (v) {
        localStorage.setItem('forceSepolia', 'true')
      } else {
        localStorage.removeItem('forceSepolia')
      }
    }
  }, [])

  const refreshVoterStatus = useCallback(async () => {
    if (!account) {
      setVoterStatus('none')
      return
    }
    const status = await checkVoterStatus(account)
    setVoterStatus(status)
  }, [account])

  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('No wallet detected. Please install MetaMask.')
      return
    }
    setIsConnecting(true)
    try {
      const accounts = await requestAccounts()
      if (!accounts.length) return
      const addr = accounts[0]
      setAccount(addr)

      const provider = new BrowserProvider(window.ethereum)
      const s = await provider.getSigner()
      setSigner(s)

      const cid = await getCurrentChainId()
      setChainId(cid)

      const status = await checkVoterStatus(addr)
      setVoterStatus(status)
    } catch (err) {
      console.error('Connect wallet error:', err)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setSigner(null)
    setChainId(null)
    setVoterStatus('none')
  }, [])

  const switchNetwork = useCallback(async () => {
    const { switchToSepolia } = await import('@/lib/web3')
    await switchToSepolia()
  }, [])

  // Listen for account/chain changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return

    const handleAccountsChanged = async (accounts: unknown) => {
      const accs = accounts as string[]
      if (!accs.length) {
        disconnectWallet()
        return
      }
      const addr = accs[0]
      setAccount(addr)
      const provider = new BrowserProvider(window.ethereum!)
      const s = await provider.getSigner()
      setSigner(s)
      const status = await checkVoterStatus(addr)
      setVoterStatus(status)
    }

    const handleChainChanged = (chainIdHex: unknown) => {
      setChainId(parseInt(chainIdHex as string, 16))
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    // Auto-connect if previously connected
    ;(async () => {
      try {
        const provider = new BrowserProvider(window.ethereum!)
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          const addr = accounts[0].address
          setAccount(addr)
          const s = await provider.getSigner()
          setSigner(s)
          const cid = await getCurrentChainId()
          setChainId(cid)
          const status = await checkVoterStatus(addr)
          setVoterStatus(status)
        }
      } catch {
        // Not connected
      }
    })()

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum?.removeListener('chainChanged', handleChainChanged)
    }
  }, [disconnectWallet])

  return (
    <WalletContext.Provider
      value={{
        account,
        signer,
        chainId,
        isAdmin,
        voterStatus,
        isConnecting,
        forceSepolia,
        isCorrectNetwork,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        setForceSepolia,
        refreshVoterStatus,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be inside WalletProvider')
  return ctx
}
