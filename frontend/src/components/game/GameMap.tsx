'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameState } from '@/hooks/useGameState'
import { Move, Zap, Users, MapPin } from 'lucide-react'

interface GameMapProps {
  onNPCSelect: (npcId: number | null) => void
  selectedNPC: number | null
}

interface Position {
  x: number
  y: number
}

interface NPC {
  id: number
  x: number
  y: number
  type: 'guard' | 'merchant' | 'quest_giver'
  name: string
  status: 'idle' | 'active' | 'busy'
  health: number
}

interface Player {
  x: number
  y: number
  level: number
}

// Mock data - in real app this would come from blockchain
const mockNPCs: NPC[] = [
  { id: 1, x: 200, y: 150, type: 'guard', name: 'Cyber Guardian Alpha', status: 'active', health: 100 },
  { id: 2, x: 400, y: 300, type: 'merchant', name: 'Tech Trader Zyx', status: 'idle', health: 85 },
  { id: 3, x: 600, y: 100, type: 'quest_giver', name: 'Data Oracle Beta', status: 'busy', health: 95 },
  { id: 4, x: 100, y: 400, type: 'guard', name: 'Security Node Gamma', status: 'idle', health: 75 },
  { id: 5, x: 550, y: 450, type: 'merchant', name: 'Code Vendor Delta', status: 'active', health: 90 }
]

export function GameMap({ onNPCSelect, selectedNPC }: GameMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 300, y: 200 })
  const [npcs] = useState<NPC[]>(mockNPCs)
  const [isMoving, setIsMoving] = useState(false)
  const [dimensions] = useState({ width: 800, height: 600 })
  const [hoveredNPC, setHoveredNPC] = useState<number | null>(null)

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const gridSize = 40
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x <= dimensions.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, dimensions.height)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= dimensions.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(dimensions.width, y)
      ctx.stroke()
    }
  }, [dimensions])

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D) => {
    const { x, y } = playerPosition
    
    // Player glow
    ctx.shadowColor = '#00ffff'
    ctx.shadowBlur = 10
    
    // Player body
    ctx.fillStyle = '#00ffff'
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, 2 * Math.PI)
    ctx.fill()
    
    // Player direction indicator
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y - 6, 2, 0, 2 * Math.PI)
    ctx.fill()
    
    // Reset shadow
    ctx.shadowBlur = 0
  }, [playerPosition])

  const drawNPC = useCallback((ctx: CanvasRenderingContext2D, npc: NPC) => {
    const { x, y, type, status, health } = npc
    const isSelected = selectedNPC === npc.id
    const isHovered = hoveredNPC === npc.id
    
    // NPC colors based on type
    const colors = {
      guard: '#ff6b6b',
      merchant: '#4ecdc4',
      quest_giver: '#45b7d1'
    }
    
    const color = colors[type]
    
    // NPC glow effect
    if (isSelected || isHovered) {
      ctx.shadowColor = color
      ctx.shadowBlur = 15
    }
    
    // NPC body
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, isSelected ? 10 : 6, 0, 2 * Math.PI)
    ctx.fill()
    
    // Status indicator
    const statusColors = {
      idle: '#ffeb3b',
      active: '#4caf50',
      busy: '#f44336'
    }
    
    ctx.fillStyle = statusColors[status]
    ctx.beginPath()
    ctx.arc(x + 8, y - 8, 3, 0, 2 * Math.PI)
    ctx.fill()
    
    // Health bar
    if (health < 100) {
      const barWidth = 20
      const barHeight = 3
      
      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(x - barWidth/2, y - 20, barWidth, barHeight)
      
      // Health
      ctx.fillStyle = health > 50 ? '#4caf50' : health > 25 ? '#ffeb3b' : '#f44336'
      ctx.fillRect(x - barWidth/2, y - 20, (barWidth * health) / 100, barHeight)
    }
    
    // Selection indicator
    if (isSelected) {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(x, y, 15, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    // Reset shadow
    ctx.shadowBlur = 0
  }, [selectedNPC, hoveredNPC])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)
    
    // Draw grid
    drawGrid(ctx)
    
    // Draw NPCs
    npcs.forEach(npc => drawNPC(ctx, npc))
    
    // Draw player
    drawPlayer(ctx)
    
    // Draw movement indicator
    if (isMoving) {
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([10, 5])
      ctx.beginPath()
      ctx.arc(playerPosition.x, playerPosition.y, 20, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [dimensions, drawGrid, drawNPC, drawPlayer, npcs, playerPosition, isMoving])

  useEffect(() => {
    draw()
  }, [draw])

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Check if clicked on NPC
    const clickedNPC = npcs.find(npc => {
      const distance = Math.sqrt(Math.pow(x - npc.x, 2) + Math.pow(y - npc.y, 2))
      return distance <= 15
    })
    
    if (clickedNPC) {
      onNPCSelect(clickedNPC.id)
      return
    }
    
    // Move player
    const distance = Math.sqrt(Math.pow(x - playerPosition.x, 2) + Math.pow(y - playerPosition.y, 2))
    if (distance > 10) { // Prevent micro-movements
      setIsMoving(true)
      
      // Animate movement
      const steps = 30
      const dx = (x - playerPosition.x) / steps
      const dy = (y - playerPosition.y) / steps
      
      let step = 0
      const animate = () => {
        if (step < steps) {
          setPlayerPosition(prev => ({
            x: prev.x + dx,
            y: prev.y + dy
          }))
          step++
          requestAnimationFrame(animate)
        } else {
          setPlayerPosition({ x, y })
          setIsMoving(false)
        }
      }
      animate()
    }
  }, [npcs, playerPosition, onNPCSelect])

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Check if hovering over NPC
    const hoveredNPC = npcs.find(npc => {
      const distance = Math.sqrt(Math.pow(x - npc.x, 2) + Math.pow(y - npc.y, 2))
      return distance <= 15
    })
    
    setHoveredNPC(hoveredNPC?.id || null)
    
    // Change cursor
    canvas.style.cursor = hoveredNPC ? 'pointer' : 'crosshair'
  }, [npcs])

  return (
    <div className="cyber-card h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-cyber font-bold text-neon-blue uppercase">
          Sector Map
        </h2>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-neon-blue" />
            <span className="text-neon-blue/70">
              {Math.round(playerPosition.x)}, {Math.round(playerPosition.y)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 text-neon-green" />
            <span className="text-neon-green/70">{npcs.length} NPCs</span>
          </div>
        </div>
      </div>
      
      <div className="relative border border-neon-blue/30 bg-cyber-darker overflow-hidden">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className="block"
        />
        
        {/* Minimap */}
        <div className="absolute top-4 right-4 w-24 h-18 bg-cyber-dark/80 border border-neon-blue/20 p-2">
          <div className="w-full h-full relative bg-cyber-grid">
            {/* Player dot */}
            <div 
              className="absolute w-1 h-1 bg-neon-blue rounded-full"
              style={{
                left: `${(playerPosition.x / dimensions.width) * 100}%`,
                top: `${(playerPosition.y / dimensions.height) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
            {/* NPC dots */}
            {npcs.map(npc => (
              <div
                key={npc.id}
                className="absolute w-0.5 h-0.5 rounded-full"
                style={{
                  left: `${(npc.x / dimensions.width) * 100}%`,
                  top: `${(npc.y / dimensions.height) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: npc.type === 'guard' ? '#ff6b6b' : npc.type === 'merchant' ? '#4ecdc4' : '#45b7d1'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 space-y-1 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full" />
            <span className="text-neon-blue/70">Guards</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-teal-400 rounded-full" />
            <span className="text-neon-blue/70">Merchants</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-neon-blue/70">Quest Givers</span>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="absolute top-4 left-4 text-xs font-mono text-neon-blue/50">
          Click to move • Click NPCs to interact
        </div>
      </div>
      
      {/* Movement indicator */}
      {isMoving && (
        <div className="mt-2 flex items-center space-x-2 text-xs font-mono text-neon-blue/70">
          <Move className="w-3 h-3 animate-pulse" />
          <span>Moving...</span>
        </div>
      )}
    </div>
  )
}