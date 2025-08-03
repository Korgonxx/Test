'use client'

import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { Web3Button } from '@web3modal/react'
import { Settings, User, LogOut, Zap } from 'lucide-react'

export function Header() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <header className="bg-cyber-dark/90 backdrop-blur-md border-b border-neon-blue/20 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyber-dark" />
              </div>
              <h1 className="text-xl font-cyber font-bold neon-text">
                IRYS GAMING
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#game" className="text-neon-blue/70 hover:text-neon-blue transition-colors text-sm font-mono uppercase tracking-wider">
              Game
            </a>
            <a href="#npcs" className="text-neon-blue/70 hover:text-neon-blue transition-colors text-sm font-mono uppercase tracking-wider">
              NPCs
            </a>
            <a href="#leaderboard" className="text-neon-blue/70 hover:text-neon-blue transition-colors text-sm font-mono uppercase tracking-wider">
              Leaderboard
            </a>
            <a href="#docs" className="text-neon-blue/70 hover:text-neon-blue transition-colors text-sm font-mono uppercase tracking-wider">
              Docs
            </a>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 bg-cyber-dark border border-neon-blue/30 hover:border-neon-blue transition-all duration-300"
                >
                  <User className="w-4 h-4 text-neon-blue" />
                  <span className="text-sm font-mono text-neon-blue">
                    {formatAddress(address!)}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 cyber-card py-2 z-50">
                    <div className="px-4 py-2 border-b border-neon-blue/20">
                      <p className="text-xs font-mono text-neon-blue/50 uppercase">Account</p>
                      <p className="text-sm font-mono text-neon-blue">{formatAddress(address!)}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        // Open settings modal
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-left text-sm font-mono text-neon-blue/70 hover:text-neon-blue hover:bg-neon-blue/5 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        disconnect()
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-left text-sm font-mono text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Web3Button />
            )}

            {/* Network Status */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-cyber-dark border border-neon-green/30">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
              <span className="text-xs font-mono text-neon-green uppercase">
                Irys Testnet
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}