import { useState } from 'react'
import { X, Copy, Check, Monitor, Smartphone, ExternalLink } from 'lucide-react'
import { DEMO_WALLETS } from '@/lib/abi'

interface SetupModalProps {
  onClose: () => void
}

export default function SetupModal({ onClose }: SetupModalProps) {
  const [tab, setTab] = useState<'pc' | 'mobile'>('pc')
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            Wallet Setup Guide
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tab selector */}
          <div className="flex gap-2 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setTab('pc')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'pc' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Monitor className="w-4 h-4" /> PC / Laptop
            </button>
            <button
              onClick={() => setTab('mobile')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'mobile' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Smartphone className="w-4 h-4" /> Mobile
            </button>
          </div>

          {/* PC Instructions */}
          {tab === 'pc' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: 'Install MetaMask',
                    desc: 'Download the MetaMask browser extension from metamask.io and create a new wallet.',
                    link: 'https://metamask.io/download/',
                  },
                  {
                    step: '2',
                    title: 'Add Sepolia Testnet',
                    desc: 'Open MetaMask → Settings → Networks → Add Network → Add Sepolia testnet (or use Chainlist.org).',
                    link: 'https://chainlist.org/?search=sepolia&testnets=true',
                  },
                  {
                    step: '3',
                    title: 'Get Test ETH',
                    desc: 'Visit a Sepolia faucet to get free test ETH for transactions.',
                    link: 'https://sepoliafaucet.com',
                  },
                  {
                    step: '4',
                    title: 'Connect & Vote',
                    desc: 'Click "Connect Wallet" on this site, register as a voter, and wait for admin approval.',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex gap-4 p-4 bg-white/5 rounded-xl"
                  >
                    <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <p className="text-white font-medium">{item.title}</p>
                      <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-1"
                        >
                          Visit site <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Instructions */}
          {tab === 'mobile' && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-300 text-sm">
                  <strong>Tip:</strong> On mobile, use the built-in browser inside the MetaMask app, not your phone's default browser.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: 'Download MetaMask App',
                    desc: 'Install the MetaMask mobile app from the App Store or Google Play.',
                    link: 'https://metamask.io/download/',
                  },
                  {
                    step: '2',
                    title: 'Create / Import Wallet',
                    desc: 'Create a new wallet or import one using a seed phrase or private key.',
                  },
                  {
                    step: '3',
                    title: 'Switch to Sepolia',
                    desc: 'Tap the network selector at the top → Enable test networks → Select Sepolia.',
                  },
                  {
                    step: '4',
                    title: 'Use the Explore Tab',
                    desc: 'In MetaMask app, tap the Explore (globe) icon at the bottom and navigate to this site URL.',
                  },
                  {
                    step: '5',
                    title: 'Use Force Sepolia Mode',
                    desc: 'If the network isn\'t detected correctly, tap "Force Sepolia Mode" on the wallet connect screen.',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex gap-4 p-4 bg-white/5 rounded-xl"
                  >
                    <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <p className="text-white font-medium">{item.title}</p>
                      <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-1"
                        >
                          Visit site <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demo Wallets */}
          <div>
            <h3 className="text-white font-semibold mb-1">
              Demo Wallets (Pre-funded & Approved)
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Import any of these private keys into MetaMask to vote immediately. Each can vote only once.
            </p>
            <div className="space-y-2">
              {DEMO_WALLETS.map((wallet, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-sm font-medium">
                      {wallet.name}
                    </p>
                    <p className="text-gray-500 text-xs font-mono truncate">
                      {wallet.key}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(wallet.key, `key-${i}`)}
                    className="shrink-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-gray-300 hover:text-white"
                    title="Copy private key"
                  >
                    {copied === `key-${i}` ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-red-400 text-xs mt-2">
              ⚠ These keys are for demo purposes only. Never use for real funds.
            </p>
          </div>

          {/* Faucets */}
          <div>
            <h3 className="text-white font-semibold mb-2">Sepolia Faucets</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Alchemy Faucet', url: 'https://sepoliafaucet.com' },
                { name: 'Infura Faucet', url: 'https://www.infura.io/faucet/sepolia' },
                { name: 'Chainlink Faucet', url: 'https://faucets.chain.link/sepolia' },
              ].map((f) => (
                <a
                  key={f.name}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:text-blue-200 rounded-lg text-sm transition-colors"
                >
                  {f.name} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
