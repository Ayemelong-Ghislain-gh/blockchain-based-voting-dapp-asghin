import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import {
  Vote,
  Clock,
  CheckCircle2,
  Calendar,
  Users,
  Trophy,
  Loader2,
  RefreshCw,
  HelpCircle,
  Wifi,
  WifiOff,
  ExternalLink,
} from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { useToast } from '@/components/Toast'
import SetupModal from '@/components/SetupModal'
import {
  loadElections,
  loadCandidates,
  getVoterChoice,
  getSignerContract,
  getTxLink,
  shortenAddress,
} from '@/lib/web3'
import type { Election, Candidate } from '@/lib/abi'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { account, signer, isCorrectNetwork, connectWallet, isConnecting, setForceSepolia, forceSepolia, voterStatus, refreshVoterStatus } =
    useWallet()
  const toast = useToast()
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [votingElection, setVotingElection] = useState<number | null>(null)
  const [candidates, setCandidates] = useState<Record<number, Candidate[]>>({})
  const [voterChoices, setVoterChoices] = useState<Record<string, number>>({})
  const [voting, setVoting] = useState(false)
  const [hasWallet, setHasWallet] = useState(false)

  useEffect(() => {
    setHasWallet(typeof window !== 'undefined' && !!window.ethereum)
  }, [])

  const fetchElections = useCallback(async () => {
    setLoading(true)
    try {
      const data = await loadElections()
      setElections(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchElections()
  }, [fetchElections])

  const openVoteModal = async (election: Election) => {
    setVotingElection(election.id)
    if (!candidates[election.id]) {
      const c = await loadCandidates(election.id)
      setCandidates((prev) => ({ ...prev, [election.id]: c }))
    }
    if (account) {
      const choice = await getVoterChoice(election.id, account)
      setVoterChoices((prev) => ({
        ...prev,
        [`${election.id}-${account}`]: choice,
      }))
    }
  }

  const castVote = async (electionId: number, candidateId: number) => {
    if (!signer) return
    if (!isCorrectNetwork) {
      toast.error('Please switch to Sepolia network first')
      return
    }
    setVoting(true)
    const loadId = toast.loading('Sending transaction…')
    try {
      const contract = getSignerContract(signer)
      const tx = await contract.castVote(electionId, candidateId)
      toast.removeToast(loadId)
      toast.info('Transaction submitted, waiting for confirmation…')
      await tx.wait()
      toast.success('Vote cast successfully!', {
        label: 'View on Etherscan',
        href: getTxLink(tx.hash),
      })
      setVotingElection(null)
      await fetchElections()
      await refreshVoterStatus()
    } catch (err: unknown) {
      toast.removeToast(loadId)
      const msg = (err as { reason?: string; message?: string }).reason ||
        (err as { message?: string }).message ||
        'Transaction failed'
      toast.error(msg.length > 100 ? msg.slice(0, 100) + '…' : msg)
    } finally {
      setVoting(false)
    }
  }

  const activeElections = elections.filter((e) => e.status === 'active')
  const upcomingElections = elections.filter((e) => e.status === 'created')
  const endedElections = elections.filter((e) => e.status === 'ended')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-6">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            Powered by Ethereum Sepolia
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Decentralized Voting
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Cast your vote securely on the blockchain. Transparent, tamper-proof,
            and verifiable by anyone.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {!account && (
              <>
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-60"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wifi className="w-4 h-4" />
                  )}
                  {isConnecting ? 'Connecting…' : 'Connect Wallet'}
                </button>
                {!hasWallet && (
                  <button
                    onClick={() => {
                      setForceSepolia(true)
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl font-medium transition-all"
                  >
                    <WifiOff className="w-4 h-4" />
                    Force Sepolia Mode
                  </button>
                )}
                <button
                  onClick={() => setShowSetup(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl font-medium transition-all"
                >
                  <HelpCircle className="w-4 h-4" />
                  Don't have a wallet? Setup guide
                </button>
              </>
            )}
            {account && !isCorrectNetwork && !forceSepolia && (
              <button
                onClick={() => setForceSepolia(true)}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-600/20 border border-yellow-500/40 text-yellow-300 rounded-xl font-medium hover:bg-yellow-500/30 transition-all"
              >
                <WifiOff className="w-4 h-4" />
                Force Sepolia Mode (Mobile Fix)
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
          {[
            {
              label: 'Active Elections',
              value: activeElections.length,
              color: 'text-emerald-400',
            },
            {
              label: 'Upcoming',
              value: upcomingElections.length,
              color: 'text-yellow-400',
            },
            {
              label: 'Completed',
              value: endedElections.length,
              color: 'text-gray-400',
            },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Elections content */}
      <div className="max-w-7xl mx-auto px-4 pb-16 space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Elections</h2>
          <button
            onClick={fetchElections}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <p className="text-gray-400">Loading elections from blockchain…</p>
          </div>
        ) : elections.length === 0 ? (
          <div className="text-center py-20">
            <Vote className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No elections found</p>
            <p className="text-gray-600 text-sm mt-1">
              Check back later or connect your wallet
            </p>
          </div>
        ) : (
          <>
            <ElectionSection
              title="Active Elections"
              icon={<Vote className="w-5 h-5 text-emerald-400" />}
              badge="active"
              elections={activeElections}
              account={account}
              voterStatus={voterStatus}
              isCorrectNetwork={isCorrectNetwork}
              onVoteClick={openVoteModal}
            />
            <ElectionSection
              title="Upcoming Elections"
              icon={<Clock className="w-5 h-5 text-yellow-400" />}
              badge="upcoming"
              elections={upcomingElections}
              account={account}
              voterStatus={voterStatus}
              isCorrectNetwork={isCorrectNetwork}
              onVoteClick={openVoteModal}
            />
            <ElectionSection
              title="Past Elections"
              icon={<CheckCircle2 className="w-5 h-5 text-gray-400" />}
              badge="ended"
              elections={endedElections}
              account={account}
              voterStatus={voterStatus}
              isCorrectNetwork={isCorrectNetwork}
              onVoteClick={openVoteModal}
            />
          </>
        )}
      </div>

      {/* About This Project Section */}
<section className="mt-20 max-w-4xl mx-auto px-4">
  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-6 md:p-8 border border-white/10">
    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
      
      {/* Profile Picture */}
      <div className="flex-shrink-0">
        <img 
          src="https://ui-avatars.com/api/?name=GHISLAIN&background=4F46E5&color=fff&size=120&rounded=true"
          alt="AYEMELONG SELOBIE GHISLAIN"
          className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-purple-500/50"
        />
        <p className="text-center text-xs text-gray-400 mt-2">Project Creator</p>
      </div>
      
      {/* About Text */}
      <div className="flex-1 text-center md:text-left">
        <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
          About This Project
        </h3>
        <p className="text-gray-300 text-sm md:text-base leading-relaxed">
          This DApp was developed as my final-year dissertation project for the <span className="text-purple-400 font-medium">HTTC Computer Science Department</span> at the <span className="text-purple-400 font-medium">University of Bamenda</span>. 
          It demonstrates a blockchain-based voting system where votes are recorded immutably on the Ethereum Sepolia testnet, ensuring transparency, security, and auditability. 
          The system uses smart contracts to enforce one-person-one-vote rules and allows voters to verify their votes on-chain.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
          <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">🔗 Blockchain Verified</span>
          <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">🛡️ Tamper-Proof</span>
          <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full">👁️ Transparent</span>
        </div>
        <p className="text-right text-xs text-gray-500 mt-4 italic">
          — AYEMELONG SELOBIE GHISLAIN
        </p>
      </div>
      
    </div>
  </div>
</section>

      {/* Vote Modal */}
      {votingElection !== null && (
        <VoteModal
          election={elections.find((e) => e.id === votingElection)!}
          candidates={candidates[votingElection] || []}
          voterChoice={
            account
              ? voterChoices[`${votingElection}-${account}`] || 0
              : 0
          }
          account={account}
          voterStatus={voterStatus}
          isCorrectNetwork={isCorrectNetwork}
          voting={voting}
          onVote={castVote}
          onClose={() => setVotingElection(null)}
        />
      )}

      {showSetup && <SetupModal onClose={() => setShowSetup(false)} />}
    </div>
  )
}

function ElectionSection({
  title,
  icon,
  badge,
  elections,
  account,
  voterStatus,
  isCorrectNetwork,
  onVoteClick,
}: {
  title: string
  icon: React.ReactNode
  badge: 'active' | 'upcoming' | 'ended'
  elections: Election[]
  account: string | null
  voterStatus: string
  isCorrectNetwork: boolean
  onVoteClick: (e: Election) => void
}) {
  if (!elections.length) return null
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-gray-500 text-sm">({elections.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {elections.map((e) => (
          <ElectionCard
            key={e.id}
            election={e}
            badge={badge}
            account={account}
            voterStatus={voterStatus}
            isCorrectNetwork={isCorrectNetwork}
            onVoteClick={onVoteClick}
          />
        ))}
      </div>
    </section>
  )
}

function ElectionCard({
  election,
  badge,
  account,
  voterStatus,
  isCorrectNetwork,
  onVoteClick,
}: {
  election: Election
  badge: 'active' | 'upcoming' | 'ended'
  account: string | null
  voterStatus: string
  isCorrectNetwork: boolean
  onVoteClick: (e: Election) => void
}) {
  const badgeStyles = {
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    upcoming: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    ended: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  const badgeLabels = {
    active: '● Active',
    upcoming: '◐ Upcoming',
    ended: '○ Ended',
  }

  const canVote =
    badge === 'active' && voterStatus === 'approved' && isCorrectNetwork

  return (
    <div className="group bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-white/20 rounded-2xl p-5 flex flex-col gap-4 transition-all">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-white font-semibold leading-tight line-clamp-2">
          {election.title}
        </h4>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[badge]}`}
        >
          {badgeLabels[badge]}
        </span>
      </div>

      <p className="text-gray-400 text-sm line-clamp-2 flex-1">
        {election.description}
      </p>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {election.startTime.toLocaleDateString()} –{' '}
            {election.endTime.toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
          <Users className="w-3.5 h-3.5" />
          <span>{election.candidateCount} candidates</span>
        </div>
        {election.resultsPublished && (
          <div className="flex items-center gap-1.5 text-amber-500 text-xs">
            <Trophy className="w-3.5 h-3.5" />
            Results published
          </div>
        )}
      </div>

      <button
        onClick={() => onVoteClick(election)}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          canVote
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20'
            : badge === 'active'
              ? 'bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10'
              : 'bg-white/5 text-gray-500 border border-white/10 cursor-default'
        }`}
      >
        {badge === 'ended' || badge === 'upcoming' ? (
          <>
            <ExternalLink className="w-4 h-4" />
            {badge === 'ended' ? 'View Results' : 'View Details'}
          </>
        ) : canVote ? (
          <>
            <Vote className="w-4 h-4" />
            Cast Vote
          </>
        ) : (
          <>
            <Vote className="w-4 h-4" />
            {!account
              ? 'Connect to Vote'
              : voterStatus === 'none'
                ? 'Register to Vote'
                : voterStatus === 'pending'
                  ? 'Approval Pending'
                  : 'View Candidates'}
          </>
        )}
      </button>
    </div>
  )
}

function VoteModal({
  election,
  candidates,
  voterChoice,
  account,
  voterStatus,
  isCorrectNetwork,
  voting,
  onVote,
  onClose,
}: {
  election: Election
  candidates: Candidate[]
  voterChoice: number
  account: string | null
  voterStatus: string
  isCorrectNetwork: boolean
  voting: boolean
  onVote: (electionId: number, candidateId: number) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const hasVoted = voterChoice > 0
  const canVote =
    voterStatus === 'approved' &&
    isCorrectNetwork &&
    election.status === 'active' &&
    !hasVoted

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">{election.title}</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {election.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white ml-4 shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Status info */}
          {hasVoted && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              You voted for:{' '}
              <strong>
                {candidates.find((c) => c.id === voterChoice)?.name ||
                  `Candidate #${voterChoice}`}
              </strong>
            </div>
          )}
          {!account && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300 text-sm">
              Connect your wallet to vote
            </div>
          )}
          {account && voterStatus === 'none' && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300 text-sm">
              You need to register and get approved to vote. Go to Voter View.
            </div>
          )}
          {account && voterStatus === 'pending' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-sm">
              Your registration is pending admin approval.
            </div>
          )}

          {/* Candidates */}
          {candidates.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading candidates…
            </div>
          ) : (
            <div className="space-y-2">
              {candidates.map((candidate) => {
                const pct = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0
                const isChosen = hasVoted && candidate.id === voterChoice
                const isSelected = selected === candidate.id

                return (
                  <button
                    key={candidate.id}
                    onClick={() => canVote && setSelected(candidate.id)}
                    disabled={!canVote}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      isChosen
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : isSelected
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    } ${!canVote ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {canVote && (
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500'
                                : 'border-gray-600'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </div>
                        )}
                        <span className="text-white font-medium text-sm">
                          {candidate.name}
                        </span>
                        {isChosen && (
                          <span className="text-xs text-emerald-400">
                            ✓ Your vote
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400 text-xs">
                        {candidate.voteCount} votes
                        {(election.resultsPublished || election.status === 'ended') &&
                          ` (${pct.toFixed(1)}%)`}
                      </span>
                    </div>
                    {candidate.description && (
                      <p className="text-gray-500 text-xs ml-6">
                        {candidate.description}
                      </p>
                    )}
                    {(election.resultsPublished || election.status === 'ended' || hasVoted) && (
                      <div className="mt-2 ml-6 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {canVote && (
            <button
              onClick={() => selected && onVote(election.id, selected)}
              disabled={!selected || voting}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {voting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Vote className="w-4 h-4" /> Confirm Vote
                </>
              )}
            </button>
          )}

          <p className="text-gray-600 text-xs text-center">
            {account ? shortenAddress(account) : 'Not connected'} •{' '}
            {election.status === 'active'
              ? `Ends ${election.endTime.toLocaleString()}`
              : `Ended ${election.endTime.toLocaleDateString()}`}
          </p>
        </div>
      </div>
    </div>
  )
}
