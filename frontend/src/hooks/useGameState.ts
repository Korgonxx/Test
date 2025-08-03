'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

export interface GameState {
  player: {
    address: string
    x: number
    y: number
    level: number
    experience: number
    isActive: boolean
  }
  npcs: Array<{
    id: number
    x: number
    y: number
    type: string
    status: string
    health: number
  }>
  quests: Array<{
    id: number
    name: string
    description: string
    reward: number
    completed: boolean
  }>
  tokenBalance: number
}

export function useGameState() {
  const { address, isConnected } = useAccount()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !address) {
      setGameState(null)
      setLoading(false)
      return
    }

    const loadGameState = async () => {
      try {
        setLoading(true)
        setError(null)

        // Mock data - in real app this would call smart contracts
        const mockGameState: GameState = {
          player: {
            address,
            x: 300,
            y: 200,
            level: 5,
            experience: 1250,
            isActive: true
          },
          npcs: [
            { id: 1, x: 200, y: 150, type: 'guard', status: 'active', health: 100 },
            { id: 2, x: 400, y: 300, type: 'merchant', status: 'idle', health: 85 },
            { id: 3, x: 600, y: 100, type: 'quest_giver', status: 'busy', health: 95 }
          ],
          quests: [
            { id: 1, name: 'Data Retrieval', description: 'Collect encrypted data fragments', reward: 100, completed: false },
            { id: 2, name: 'System Security', description: 'Eliminate hostile code', reward: 150, completed: true },
            { id: 3, name: 'Network Repair', description: 'Fix damaged connection nodes', reward: 200, completed: false }
          ],
          tokenBalance: 2500
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setGameState(mockGameState)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game state')
      } finally {
        setLoading(false)
      }
    }

    loadGameState()
  }, [address, isConnected])

  const updatePlayerPosition = async (x: number, y: number) => {
    if (!gameState) return

    try {
      // In real app, this would call smart contract
      setGameState(prev => prev ? {
        ...prev,
        player: { ...prev.player, x, y }
      } : null)
    } catch (err) {
      console.error('Failed to update player position:', err)
    }
  }

  const completeQuest = async (questId: number) => {
    if (!gameState) return

    try {
      // In real app, this would call smart contract
      setGameState(prev => {
        if (!prev) return null
        
        const quest = prev.quests.find(q => q.id === questId)
        if (!quest || quest.completed) return prev

        return {
          ...prev,
          quests: prev.quests.map(q => 
            q.id === questId ? { ...q, completed: true } : q
          ),
          tokenBalance: prev.tokenBalance + quest.reward,
          player: {
            ...prev.player,
            experience: prev.player.experience + quest.reward
          }
        }
      })
    } catch (err) {
      console.error('Failed to complete quest:', err)
    }
  }

  return {
    gameState,
    loading,
    error,
    updatePlayerPosition,
    completeQuest
  }
}