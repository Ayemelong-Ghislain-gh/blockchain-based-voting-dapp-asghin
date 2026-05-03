import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import {
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Wallet,
  Vote,
  HelpCircle,
} from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { useToast } from '@/components/Toast'
import SetupModal from '@/components/SetupModal'
import { getSignerContract, loadElections, getTxLink } from '@/lib/web3'
import type { Election } from '@/lib/abi'

export const Route = createFileRoute('/voter')({
  component: VoterPage,
})

function VoterPage() {
  const {
    account,
    signer,
    voterStatus,
    isCorrectNetwork,
    isConnecting,
    connectWallet,
    refreshVoterStatus,
  } = useWallet()
  const toast = useToast()
  const [registering, setRegistering] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [elections, setElections] = useState<Election[]>([])
  const [loadingElections, setLoadingElections] = useState(false)

  const fetchElections = useCallback(async () => {
    setLoadingElections(true)
    const data = await loadElections()
    setElections(data)
    setLoadingElections(false)
  }, [])

  useEffect(() => {
    fetchElections()
  }, [fetchElections])

  const registerVoter = async () => {
    if (!signer) return
    if (!isCorrectNetwork) {
      toast.error('Please switch to Sepolia network first')
      return
    }
    setRegistering(true)
    const loadId = toast.loading('Submitting registration…')
    try {
      const contract = getSignerContract(signer)
      const tx = await contract.registerVoter()
      toast.removeToast(loadId)
      toast.info('Transaction submitted…')
      await tx.wait()
      toast.success('Registration submitted!', {
        label: 'View on Etherscan',
        href: getTxLink(tx.hash),
      })
      await refreshVoterStatus()
    } catch (err: unknown) {
      toast.removeToast(loadId)
      const msg =
        (err as { reason?: string }).reason ||
        (err as { message?: string }).message ||
        'Transaction failed'
      toast.error(msg.length > 100 ? msg.slice(0, 100) + '…' : msg)
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Voter View</h1>
          <p className="text-gray-400">
            Register to vote and track your participation in elections.
          </p>
        </div>

        {/* Wallet Connection */}
        {!account ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-4">
            <Wallet className="w-12 h-12 text-purple-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">
              Connect Your Wallet
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Connect your MetaMask wallet to register as a voter and participate in elections.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all disabled:opacity-60"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                {isConnecting ? 'Connecting…' : 'Connect Wallet'}
              </button>
              <button
                onClick={() => setShowSetup(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl font-medium transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                Setup Guide
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Registration Status */}
            <VoterStatusCard
              status={voterStatus}
              address={account}
              isCorrectNetwork={isCorrectNetwork}
              registering={registering}
              onRegister={registerVoter}
              onRefresh={refreshVoterStatus}
            />

            {/* Elections the voter can see */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Available Elections
              </h2>
              {loadingElections ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
              ) : elections.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No elections found
                </div>
              ) : (
                <div className="space-y-3">
                  {elections.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-xl"
                    >
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {e.title}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {e.startTime.toLocaleDateString()} –{' '}
                          {e.endTime.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={e.status} />
                        <Link
                          to="/"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Vote className="w-3.5 h-3.5" />
                          {e.status === 'active' ? 'Vote' : 'View'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showSetup && <SetupModal onClose={() => setShowSetup(false)} />}
    </div>
  )
}

function VoterStatusCard({
  status,
  address,
  isCorrectNetwork,
  registering,
  onRegister,
  onRefresh,
}: {
  status: string
  address: string
  isCorrectNetwork: boolean
  registering: boolean
  onRegister: () => void
  onRefresh: () => void
}) {
  const config = {
    none: {
      icon: <XCircle className="w-8 h-8 text-red-400" />,
      title: 'Not Registered',
      desc: 'You have not registered to vote yet.',
      color: 'border-red-500/20 bg-red-500/5',
    },
    pending: {
      icon: <Clock className="w-8 h-8 text-yellow-400" />,
      title: 'Registration Pending',
      desc: 'Your registration is awaiting admin approval.',
      color: 'border-yellow-500/20 bg-yellow-500/5',
    },
    approved: {
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
      title: 'Approved Voter',
      desc: 'You are approved and can vote in active elections.',
      color: 'border-emerald-500/20 bg-emerald-500/5',
    },
  }

  const c = config[status as keyof typeof config] || config.none

  return (
    <div
      className={`border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${c.color}`}
    >
      {c.icon}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-lg">{c.title}</h3>
        </div>
        <p className="text-gray-400 text-sm mt-0.5">{c.desc}</p>
        <p className="text-gray-600 text-xs font-mono mt-1">
          {address}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onRefresh}
          className="px-3 py-2 text-gray-400 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-colors"
        >
          Refresh
        </button>
        {status === 'none' && (
          <button
            onClick={onRegister}
            disabled={registering || !isCorrectNetwork}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-60"
          >
            {registering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            {registering ? 'Registering…' : 'Register to Vote'}
          </button>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    created: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    ended: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  const labels: Record<string, string> = {
    active: 'Active',
    created: 'Upcoming',
    ended: 'Ended',
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.created}`}
    >
      {labels[status] || status}
    </span>
  )
}
