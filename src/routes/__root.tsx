import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { WalletProvider } from '@/contexts/WalletContext'
import { ToastProvider } from '@/components/Toast'
import Header from '@/components/Header'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'BlockVote — Decentralized Voting DApp' },
      { name: 'description', content: 'A blockchain-powered voting application on Ethereum Sepolia testnet' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-gray-950 text-white min-h-screen">
        <WalletProvider>
          <ToastProvider>
            <Header />
            <main>{children}</main>
            <footer className="border-t border-white/10 mt-16 py-8 text-center text-gray-500 text-sm">
              <p>
                © 2026{' '}
                <span className="text-gray-400">AYEMELONG SELOBIE GHISLAIN</span> — HTTC, Department
                of Computer Science, University of Bamenda.
              </p>
              <p className="mt-1">
                Contract:{' '}
                <a
                  href="https://sepolia.etherscan.io/address/0x4C462Ebd0238964D26cd0CF1591956956BE78486"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 font-mono text-xs"
                >
                  0x4C462Ebd0238964D26cd0CF1591956956BE78486
                </a>{' '}
                on Sepolia
              </p>
            </footer>
          </ToastProvider>
        </WalletProvider>
        <Scripts />
      </body>
    </html>
  )
}
