'use client'

import { useEffect, useState } from 'react'

const loadingMessages = [
  'Initializing quantum matrices...',
  'Connecting to Irys datachain...',
  'Synchronizing AI neural networks...',
  'Loading NPC behavioral patterns...',
  'Establishing secure blockchain connection...',
  'Decrypting player data...',
  'Calibrating cybernetic interfaces...',
  'Activating holographic displays...'
]

export function LoadingScreen() {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100
        return prev + Math.random() * 10
      })
    }, 100)

    return () => {
      clearInterval(messageInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-cyber-darker flex items-center justify-center z-50">
      <div className="cyber-card max-w-md w-full mx-4 text-center">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-cyber font-bold neon-text mb-2 glitch" data-text="IRYS">
            IRYS
          </h1>
          <h2 className="text-lg font-cyber text-neon-blue/70 uppercase tracking-wider">
            Gaming Platform
          </h2>
        </div>

        {/* Loading Animation */}
        <div className="mb-6">
          <div className="flex justify-center space-x-1 mb-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-8 bg-neon-blue animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-cyber-grid border border-neon-blue/30 h-2 relative overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-neon-blue to-neon-green transition-all duration-300 relative"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-scan" />
          </div>
          
          <div className="mt-2 text-xs font-mono text-neon-blue/70">
            {Math.min(Math.floor(progress), 100)}% Complete
          </div>
        </div>

        {/* Loading Messages */}
        <div className="min-h-[60px] flex items-center justify-center">
          <p className="text-sm font-mono text-neon-blue/80 animate-pulse">
            {loadingMessages[currentMessage]}
          </p>
        </div>

        {/* Technical Details */}
        <div className="mt-6 space-y-1 text-xs font-mono text-neon-blue/50">
          <div className="flex justify-between">
            <span>Network:</span>
            <span className="status-online">IRYS TESTNET</span>
          </div>
          <div className="flex justify-between">
            <span>Protocol:</span>
            <span className="text-neon-blue">DATACHAIN v2.1</span>
          </div>
          <div className="flex justify-between">
            <span>AI Engine:</span>
            <span className="status-online">ACTIVE</span>
          </div>
          <div className="flex justify-between">
            <span>Security:</span>
            <span className="text-neon-green">ENCRYPTED</span>
          </div>
        </div>

        {/* Animated dots */}
        <div className="mt-6 flex justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 bg-neon-blue rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Background Grid Effect */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      {/* Scan Lines */}
      <div className="absolute inset-0">
        <div className="scan-line" />
        <div 
          className="scan-line opacity-30" 
          style={{ animationDelay: '1s', animationDuration: '4s' }}
        />
      </div>
    </div>
  )
}