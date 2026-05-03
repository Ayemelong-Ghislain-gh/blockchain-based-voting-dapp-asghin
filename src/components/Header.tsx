import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Wallet,
  Menu,
  X,
  Vote,
  LayoutDashboard,
  LogOut,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { shortenAddress } from '@/lib/web3'
import { SEPOLIA_CHAIN_ID } from '@/lib/abi'

export default function Header() {
  const {
    account,
    chainId,
    isAdmin,
    isConnecting,
    isCorrectNetwork,
    forceSepolia,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    setForceSepolia,
  } = useWallet()
  const [menuOpen, setMenuOpen] = useState(false)
  const [walletMenuOpen, setWalletMenuOpen] = useState(false)

  const networkName =
    chainId === SEPOLIA_CHAIN_ID
      ? 'Sepolia'
      : chainId
        ? `Chain ${chainId}`
        : 'Unknown'

  return (
    <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">
              BlockVote
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
              activeProps={{ className: 'bg-white/10 text-white' }}
            >
              Elections
            </Link>
            <Link
              to="/voter"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
              activeProps={{ className: 'bg-white/10 text-white' }}
            >
              <Vote className="w-4 h-4" /> Voter View
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
                activeProps={{ className: 'bg-white/10 text-white' }}
              >
                <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Network warning */}
            {account && !isCorrectNetwork && (
              <button
                onClick={switchNetwork}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-500/30 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Switch to Sepolia
              </button>
            )}

            {/* Network badge */}
            {account && isCorrectNetwork && (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                {forceSepolia ? 'Sepolia*' : networkName}
              </span>
            )}

            {/* Wallet button */}
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-60"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? 'Connecting…' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl text-sm font-medium transition-all"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full" />
                  <span className="hidden sm:block">
                    {shortenAddress(account)}
                  </span>
                  {isAdmin && (
                    <span className="hidden sm:block text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {walletMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="text-gray-400 text-xs">Connected as</p>
                      <p className="text-white text-sm font-mono">
                        {shortenAddress(account)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        disconnectWallet()
                        setWalletMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-white/5 text-sm transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 py-3 space-y-1">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
            >
              Elections
            </Link>
            <Link
              to="/voter"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
            >
              <Vote className="w-4 h-4" /> Voter View
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
              </Link>
            )}
            {account && !isCorrectNetwork && (
              <button
                onClick={() => {
                  switchNetwork()
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors text-sm"
              >
                <AlertTriangle className="w-4 h-4" /> Switch to Sepolia
              </button>
            )}
          </div>
        )}
      </div>

      {/* Force Sepolia Reset Banner */}
      {forceSepolia && (
        <div className="bg-purple-900/50 border-t border-purple-500/20 px-4 py-1.5 flex items-center justify-between text-xs">
          <span className="text-purple-300">
            Force Sepolia Mode is active — network checks bypassed
          </span>
          <button
            onClick={() => setForceSepolia(false)}
            className="text-purple-400 hover:text-white underline ml-2"
          >
            Reset
          </button>
        </div>
      )}
    </header>
  )
}
