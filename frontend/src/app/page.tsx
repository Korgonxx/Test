'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { GameMap } from '@/components/game/GameMap'
import { PlayerDashboard } from '@/components/game/PlayerDashboard'
import { NPCInteraction } from '@/components/game/NPCInteraction'
import { QuestPanel } from '@/components/game/QuestPanel'
import { TokenBalance } from '@/components/game/TokenBalance'
import { Leaderboard } from '@/components/game/Leaderboard'
import { useGameState } from '@/hooks/useGameState'
import { useWallet } from '@/hooks/useWallet'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

export default function GamePage() {
  const { isConnected, connect } = useWallet()
  const { gameState, loading, error } = useGameState()
  const [selectedNPC, setSelectedNPC] = useState<number | null>(null)
  const [showQuests, setShowQuests] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  if (loading) {
    return <LoadingScreen />
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="cyber-card max-w-md w-full mx-4 text-center">
          <h1 className="text-3xl font-cyber font-bold neon-text mb-6">
            IRYS GAMING
          </h1>
          <p className="text-neon-blue/70 mb-8">
            Connect your wallet to enter the cyberpunk realm of AI-powered NPCs
          </p>
          <button
            onClick={connect}
            className="cyber-button w-full"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="cyber-card max-w-md w-full mx-4 text-center">
          <h2 className="text-xl font-cyber font-bold text-red-500 mb-4">
            Connection Error
          </h2>
          <p className="text-neon-blue/70 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="cyber-button w-full"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cyber-darker">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          {/* Left Sidebar - Player Info & Controls */}
          <div className="col-span-3 space-y-6">
            <TokenBalance />
            <PlayerDashboard />
            
            <div className="space-y-2">
              <button
                onClick={() => setShowQuests(!showQuests)}
                className={`cyber-button w-full ${showQuests ? 'bg-neon-blue text-cyber-dark' : ''}`}
              >
                Quests
              </button>
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className={`cyber-button w-full ${showLeaderboard ? 'bg-neon-blue text-cyber-dark' : ''}`}
              >
                Leaderboard
              </button>
            </div>
          </div>

          {/* Main Game Area */}
          <div className="col-span-6">
            <GameMap
              onNPCSelect={setSelectedNPC}
              selectedNPC={selectedNPC}
            />
          </div>

          {/* Right Sidebar - Interactive Panels */}
          <div className="col-span-3 space-y-6">
            {selectedNPC && (
              <NPCInteraction
                npcId={selectedNPC}
                onClose={() => setSelectedNPC(null)}
              />
            )}
            
            {showQuests && (
              <QuestPanel onClose={() => setShowQuests(false)} />
            )}
            
            {showLeaderboard && (
              <Leaderboard onClose={() => setShowLeaderboard(false)} />
            )}
          </div>
        </div>
      </div>

      {/* Scan Line Effect */}
      <div className="scan-line" />
    </div>
  )
}