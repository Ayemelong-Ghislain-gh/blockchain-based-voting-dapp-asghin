import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import {
  Shield,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Play,
  Square,
  BarChart3,
  Loader2,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  Trophy,
  Calendar,
  Trash2,
} from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { useToast } from '@/components/Toast'
import {
  loadElections,
  loadCandidates,
  getPendingVotersList,
  getApprovedVotersList,
  getSignerContract,
  shortenAddress,
  getTxLink,
} from '@/lib/web3'
import type { Election, Candidate } from '@/lib/abi'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminPage() {
  const { account, signer, isAdmin, isCorrectNetwork } = useWallet()

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-gray-400 text-sm">
            Connect your admin wallet to access this dashboard.
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            This dashboard is restricted to the contract admin.
          </p>
          <Link
            to="/"
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AdminDashboard
      signer={signer}
      isCorrectNetwork={isCorrectNetwork}
    />
  )
}

function AdminDashboard({
  signer,
  isCorrectNetwork,
}: {
  signer: import('ethers').JsonRpcSigner | null
  isCorrectNetwork: boolean
}) {
  const toast = useToast()
  const [elections, setElections] = useState<Election[]>([])
  const [pendingVoters, setPendingVoters] = useState<string[]>([])
  const [approvedVoters, setApprovedVoters] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<
    'elections' | 'voters' | 'create' | 'candidates'
  >('elections')

  const refresh = useCallback(async () => {
    setLoading(true)
    const [e, p, a] = await Promise.all([
      loadElections(),
      getPendingVotersList(),
      getApprovedVotersList(),
    ])
    setElections(e)
    setPendingVoters(p)
    setApprovedVoters(a)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const txAction = async (
    action: () => Promise<{ hash: string; wait: () => Promise<unknown> }>,
    successMsg: string,
  ) => {
    if (!isCorrectNetwork) {
      toast.error('Please switch to Sepolia network first')
      return false
    }
    const loadId = toast.loading('Sending transaction…')
    try {
      const tx = await action()
      toast.removeToast(loadId)
      toast.info('Transaction submitted…')
      await tx.wait()
      toast.success(successMsg, {
        label: 'View on Etherscan',
        href: getTxLink(tx.hash),
      })
      await refresh()
      return true
    } catch (err: unknown) {
      toast.removeToast(loadId)
      const msg =
        (err as { reason?: string }).reason ||
        (err as { message?: string }).message ||
        'Transaction failed'
      toast.error(msg.length > 100 ? msg.slice(0, 100) + '…' : msg)
      return false
    }
  }

  const approveVoter = (addr: string) =>
    txAction(async () => {
      const c = getSignerContract(signer!)
      return c.approveVoter(addr)
    }, `Voter ${shortenAddress(addr)} approved`)

  const rejectVoter = (addr: string) =>
    txAction(async () => {
      const c = getSignerContract(signer!)
      return c.rejectVoter(addr)
    }, `Voter ${shortenAddress(addr)} rejected`)

  const startElection = (id: number) =>
    txAction(async () => {
      const c = getSignerContract(signer!)
      return c.startElection(id)
    }, 'Election started')

  const endElection = (id: number) =>
    txAction(async () => {
      const c = getSignerContract(signer!)
      return c.endElection(id)
    }, 'Election ended')

  const publishResults = (id: number) =>
    txAction(async () => {
      const c = getSignerContract(signer!)
      return c.publishResults(id)
    }, 'Results published')

  const tabs = [
    {
      id: 'elections' as const,
      label: 'Elections',
      count: elections.length,
    },
    {
      id: 'voters' as const,
      label: 'Voters',
      count: pendingVoters.length,
      badge: pendingVoters.length > 0,
    },
    { id: 'create' as const, label: 'Create Election' },
    { id: 'candidates' as const, label: 'Add Candidates' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <p className="text-gray-400 text-sm">
              Manage elections, candidates, and voter approvals
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Elections',
              value: elections.length,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10 border-blue-500/20',
            },
            {
              label: 'Active',
              value: elections.filter((e) => e.status === 'active').length,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10 border-emerald-500/20',
            },
            {
              label: 'Pending Voters',
              value: pendingVoters.length,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10 border-amber-500/20',
            },
            {
              label: 'Approved Voters',
              value: approvedVoters.length,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10 border-purple-500/20',
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`border rounded-xl p-4 ${s.bg}`}
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeSection === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    tab.badge
                      ? 'bg-amber-500 text-white'
                      : 'bg-white/20 text-gray-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Section content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : (
          <>
            {activeSection === 'elections' && (
              <ElectionsSection
                elections={elections}
                onStart={startElection}
                onEnd={endElection}
                onPublish={publishResults}
              />
            )}
            {activeSection === 'voters' && (
              <VotersSection
                pending={pendingVoters}
                approved={approvedVoters}
                onApprove={approveVoter}
                onReject={rejectVoter}
              />
            )}
            {activeSection === 'create' && (
              <CreateElectionForm signer={signer} onCreated={refresh} />
            )}
            {activeSection === 'candidates' && (
              <AddCandidatesForm
                elections={elections}
                signer={signer}
                onAdded={refresh}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ElectionsSection({
  elections,
  onStart,
  onEnd,
  onPublish,
}: {
  elections: Election[]
  onStart: (id: number) => void
  onEnd: (id: number) => void
  onPublish: (id: number) => void
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [candidateMap, setCandidateMap] = useState<Record<number, Candidate[]>>(
    {},
  )

  const toggleExpand = async (election: Election) => {
    if (expandedId === election.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(election.id)
    if (!candidateMap[election.id]) {
      const c = await loadCandidates(election.id)
      setCandidateMap((prev) => ({ ...prev, [election.id]: c }))
    }
  }

  if (!elections.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p>No elections yet. Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {elections.map((e) => {
        const isExpanded = expandedId === e.id
        const candidates = candidateMap[e.id] || []
        const totalVotes = candidates.reduce((s, c) => s + c.voteCount, 0)

        return (
          <div
            key={e.id}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-semibold">{e.title}</h3>
                  <ElectionStatusBadge status={e.status} />
                  {e.resultsPublished && (
                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs rounded-full">
                      Results Published
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-1 line-clamp-1">
                  {e.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {e.startTime.toLocaleDateString()} –{' '}
                    {e.endTime.toLocaleDateString()}
                  </span>
                  <span>{e.candidateCount} candidates</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {e.status === 'created' && (
                  <button
                    onClick={() => onStart(e.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" /> Start
                  </button>
                )}
                {e.status === 'active' && (
                  <button
                    onClick={() => onEnd(e.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" /> End
                  </button>
                )}
                {e.status === 'ended' && !e.resultsPublished && (
                  <button
                    onClick={() => onPublish(e.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5" /> Publish
                  </button>
                )}
                <button
                  onClick={() => toggleExpand(e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  {isExpanded ? 'Hide' : 'Candidates'}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-white/10 p-4 bg-white/[0.02]">
                {candidates.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-2">
                    Loading candidates…
                  </p>
                ) : (
                  <div className="space-y-2">
                    {candidates.map((c) => {
                      const pct =
                        totalVotes > 0
                          ? (c.voteCount / totalVotes) * 100
                          : 0
                      return (
                        <div key={c.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white font-medium">
                              {c.name}
                            </span>
                            <span className="text-gray-400">
                              {c.voteCount} votes ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    <p className="text-gray-500 text-xs pt-1">
                      Total votes: {totalVotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function VotersSection({
  pending,
  approved,
  onApprove,
  onReject,
}: {
  pending: string[]
  approved: string[]
  onApprove: (addr: string) => void
  onReject: (addr: string) => void
}) {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  const handleAction = async (
    addr: string,
    action: (a: string) => void,
  ) => {
    setLoadingMap((prev) => ({ ...prev, [addr]: true }))
    await action(addr)
    setLoadingMap((prev) => ({ ...prev, [addr]: false }))
  }

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" />
          Pending Approval
          {pending.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-medium">
              {pending.length}
            </span>
          )}
        </h3>
        {pending.length === 0 ? (
          <div className="text-center py-8 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">
            No pending registrations
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((addr) => (
              <div
                key={addr}
                className="flex items-center justify-between gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl"
              >
                <div>
                  <p className="text-white font-mono text-sm">{addr}</p>
                  <p className="text-gray-500 text-xs">
                    {shortenAddress(addr)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(addr, onApprove)}
                    disabled={loadingMap[addr]}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                  >
                    {loadingMap[addr] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(addr, onReject)}
                    disabled={loadingMap[addr]}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-400" />
          Approved Voters
          <span className="text-gray-500 font-normal text-base">
            ({approved.length})
          </span>
        </h3>
        {approved.length === 0 ? (
          <div className="text-center py-8 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm">
            No approved voters yet
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {approved.map((addr) => (
              <div
                key={addr}
                className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-white font-mono text-xs truncate">{addr}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CreateElectionForm({
  signer,
  onCreated,
}: {
  signer: import('ethers').JsonRpcSigner | null
  onCreated: () => void
}) {
  const toast = useToast()
  const { isCorrectNetwork } = useWallet()
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signer) return
    if (!isCorrectNetwork) {
      toast.error('Please switch to Sepolia network first')
      return
    }
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error('Please fill in all required fields')
      return
    }

    const startTimestamp = Math.floor(
      new Date(`${form.startDate}T${form.startTime}`).getTime() / 1000,
    )
    const endTimestamp = Math.floor(
      new Date(`${form.endDate}T${form.endTime}`).getTime() / 1000,
    )

    if (endTimestamp <= startTimestamp) {
      toast.error('End time must be after start time')
      return
    }

    setSubmitting(true)
    const loadId = toast.loading('Creating election…')
    try {
      const contract = getSignerContract(signer)
      const tx = await contract.createElection(
        form.title,
        form.description,
        startTimestamp,
        endTimestamp,
      )
      toast.removeToast(loadId)
      toast.info('Transaction submitted…')
      await tx.wait()
      toast.success('Election created!', {
        label: 'View on Etherscan',
        href: getTxLink(tx.hash),
      })
      setForm({
        title: '',
        description: '',
        startDate: '',
        startTime: '09:00',
        endDate: '',
        endTime: '18:00',
      })
      onCreated()
    } catch (err: unknown) {
      toast.removeToast(loadId)
      const msg =
        (err as { reason?: string }).reason ||
        (err as { message?: string }).message ||
        'Transaction failed'
      toast.error(msg.length > 100 ? msg.slice(0, 100) + '…' : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-purple-400" />
        Create New Election
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Election Title *">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Student Council President 2026"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </FormField>
        <FormField label="Description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of the election…"
            rows={3}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Start Date *">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </FormField>
          <FormField label="Start Time">
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </FormField>
          <FormField label="End Date *">
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </FormField>
          <FormField label="End Time">
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </FormField>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {submitting ? 'Creating…' : 'Create Election'}
        </button>
      </form>
    </div>
  )
}

function AddCandidatesForm({
  elections,
  signer,
  onAdded,
}: {
  elections: Election[]
  signer: import('ethers').JsonRpcSigner | null
  onAdded: () => void
}) {
  const toast = useToast()
  const { isCorrectNetwork } = useWallet()
  const [selectedElection, setSelectedElection] = useState<number | ''>('')
  const [candidates, setCandidates] = useState([{ name: '', description: '' }])
  const [submitting, setSubmitting] = useState(false)

  const addRow = () =>
    setCandidates([...candidates, { name: '', description: '' }])
  const removeRow = (i: number) =>
    setCandidates(candidates.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signer || !selectedElection) return
    if (!isCorrectNetwork) {
      toast.error('Please switch to Sepolia network first')
      return
    }
    const valid = candidates.filter((c) => c.name.trim())
    if (!valid.length) {
      toast.error('Add at least one candidate')
      return
    }
    setSubmitting(true)
    const loadId = toast.loading(`Adding ${valid.length} candidate(s)…`)
    try {
      const contract = getSignerContract(signer)
      for (const c of valid) {
        const tx = await contract.addCandidate(
          selectedElection,
          c.name,
          c.description,
        )
        await tx.wait()
      }
      toast.removeToast(loadId)
      toast.success(`${valid.length} candidate(s) added!`)
      setCandidates([{ name: '', description: '' }])
      onAdded()
    } catch (err: unknown) {
      toast.removeToast(loadId)
      const msg =
        (err as { reason?: string }).reason ||
        (err as { message?: string }).message ||
        'Transaction failed'
      toast.error(msg.length > 100 ? msg.slice(0, 100) + '…' : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-purple-400" />
        Add Candidates
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Select Election *">
          <select
            value={selectedElection}
            onChange={(e) =>
              setSelectedElection(
                e.target.value === '' ? '' : Number(e.target.value),
              )
            }
            className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            required
          >
            <option value="" className="bg-gray-900">
              Choose an election…
            </option>
            {elections.map((e) => (
              <option key={e.id} value={e.id} className="bg-gray-900">
                #{e.id} — {e.title}
              </option>
            ))}
          </select>
        </FormField>

        <div className="space-y-3">
          <label className="text-gray-400 text-sm font-medium">
            Candidates
          </label>
          {candidates.map((c, i) => (
            <div
              key={i}
              className="flex gap-2 p-3 bg-white/5 border border-white/10 rounded-xl"
            >
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => {
                    const updated = [...candidates]
                    updated[i] = { ...updated[i], name: e.target.value }
                    setCandidates(updated)
                  }}
                  placeholder={`Candidate ${i + 1} name *`}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  required
                />
                <input
                  type="text"
                  value={c.description}
                  onChange={(e) => {
                    const updated = [...candidates]
                    updated[i] = { ...updated[i], description: e.target.value }
                    setCandidates(updated)
                  }}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                />
              </div>
              {candidates.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="self-start p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Another Candidate
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedElection}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {submitting ? 'Adding…' : 'Add Candidates'}
        </button>
      </form>
    </div>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-gray-400 text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

function ElectionStatusBadge({ status }: { status: string }) {
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
