'use client'

import { ReactNode } from 'react'
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { Web3Modal } from '@web3modal/react'
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GameStateProvider } from '@/contexts/GameStateContext'
import { AIProvider } from '@/contexts/AIContext'

// Define Irys chain configuration
const irysTestnet = {
  id: 1338,
  name: 'Irys Testnet',
  network: 'irys-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'IRYS',
    symbol: 'IRYS',
  },
  rpcUrls: {
    public: { http: ['https://testnet-rpc.irys.xyz'] },
    default: { http: ['https://testnet-rpc.irys.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Irys Explorer', url: 'https://testnet-explorer.irys.xyz' },
  },
}

const irysMainnet = {
  id: 1339,
  name: 'Irys',
  network: 'irys',
  nativeCurrency: {
    decimals: 18,
    name: 'IRYS',
    symbol: 'IRYS',
  },
  rpcUrls: {
    public: { http: ['https://rpc.irys.xyz'] },
    default: { http: ['https://rpc.irys.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Irys Explorer', url: 'https://explorer.irys.xyz' },
  },
}

const chains = [irysTestnet, irysMainnet]
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo'

const { publicClient } = configureChains(chains, [
  w3mProvider({ projectId }),
  publicProvider()
])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
})

const ethereumClient = new EthereumClient(wagmiConfig, chains)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <GameStateProvider>
          <AIProvider>
            {children}
            <Web3Modal 
              projectId={projectId} 
              ethereumClient={ethereumClient}
              themeMode="dark"
              themeVariables={{
                '--w3m-font-family': 'JetBrains Mono, monospace',
                '--w3m-accent-color': '#00ffff',
                '--w3m-accent-fill-color': '#000000',
                '--w3m-background-color': '#0a0a0a',
                '--w3m-background-border-radius': '0px',
                '--w3m-container-border-radius': '0px',
                '--w3m-wallet-icon-border-radius': '0px',
                '--w3m-button-border-radius': '0px',
                '--w3m-secondary-button-border-radius': '0px',
                '--w3m-icon-button-border-radius': '0px',
                '--w3m-button-hover-highlight-border-radius': '0px',
                '--w3m-text-big-bold-size': '14px',
                '--w3m-text-medium-regular-size': '12px',
                '--w3m-text-small-regular-size': '10px',
                '--w3m-text-xsmall-bold-size': '9px',
                '--w3m-text-xsmall-regular-size': '8px'
              }}
            />
          </AIProvider>
        </GameStateProvider>
      </WagmiConfig>
    </QueryClientProvider>
  )
}