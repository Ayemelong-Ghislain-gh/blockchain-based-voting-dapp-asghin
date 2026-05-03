export const CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string) ||
  '0x4C462Ebd0238964D26cd0CF1591956956BE78486'

export const ADMIN_ADDRESS = '0x8EBE60c6DD3FAE22e23AEE36333D202874AFc412'
export const SEPOLIA_CHAIN_ID = 11155111

export const DEMO_WALLETS = [
  {
    name: 'Demo Voter 1',
    key: '0x83ff3d3886cd82c6ddec53b3b63ccf2c4f6cbc7755be4ea2417a1f614700de5f',
  },
  {
    name: 'Demo Voter 2',
    key: '0xab0053429156b8010acd01b8840d6e9339f9d3bca5f9167234511f0448ac03d4',
  },
  {
    name: 'Demo Voter 3',
    key: '0x14cad05bcc9b869a184b9d43e4b49530cd5df60c1bafdea121a9df4152fa02c6',
  },
  {
    name: 'Demo Voter 4',
    key: '0xec9743f2a27d371635ddc950205713a46fac3b600b48ce6ee94356d6a438278c',
  },
  {
    name: 'Demo Voter 5',
    key: '0xaa8b9f085fb0b2bc41896009b41ca8ba2dc150f9b03aecd17b162de1e61d7386',
  },
]

// Human-readable ABI for ethers v6
export const ABI = [
  // Public state variables
  'function admin() view returns (address)',
  'function electionCount() view returns (uint256)',

  // Admin functions
  'function createElection(string title, string description, uint256 startTime, uint256 endTime)',
  'function addCandidate(uint256 electionId, string name, string description)',
  'function approveVoter(address voterAddress)',
  'function rejectVoter(address voterAddress)',
  'function startElection(uint256 electionId)',
  'function endElection(uint256 electionId)',
  'function publishResults(uint256 electionId)',

  // Public functions
  'function registerVoter()',
  'function castVote(uint256 electionId, uint256 candidateId)',

  // View functions
  'function getElection(uint256 electionId) view returns (uint256 id, string title, string description, uint256 startTime, uint256 endTime, uint8 status, bool resultsPublished, uint256 candidateCount)',
  'function getAllCandidates(uint256 electionId) view returns ((uint256 id, string name, string description, uint256 voteCount)[])',
  'function isVoterApproved(address voter) view returns (bool)',
  'function getVoterChoice(uint256 electionId, address voter) view returns (uint256)',

  // Optional helpers (may or may not exist on contract)
  'function pendingVoters(address) view returns (bool)',
  'function approvedVoters(address) view returns (bool)',
  'function getPendingVoters() view returns (address[])',
  'function getApprovedVoters() view returns (address[])',

  // Events
  'event VoterApproved(address indexed voter)',
  'event VoterRejected(address indexed voter)',
  'event VoteCasted(address indexed voter, uint256 indexed electionId, uint256 indexed candidateId)',
  'event ElectionCreated(uint256 indexed electionId, string title)',
  'event ElectionEnded(uint256 indexed electionId)',
  'event ResultsPublished(uint256 indexed electionId)',
  'event VoterRegistered(address indexed voter)',
]

export type ElectionStatus = 'created' | 'active' | 'ended'

export interface Election {
  id: number
  title: string
  description: string
  startTime: Date
  endTime: Date
  status: ElectionStatus
  resultsPublished: boolean
  candidateCount: number
}

export interface Candidate {
  id: number
  name: string
  description: string
  voteCount: number
}

export function parseElectionStatus(status: number): ElectionStatus {
  switch (status) {
    case 1:
      return 'active'
    case 2:
      return 'ended'
    default:
      return 'created'
  }
}
