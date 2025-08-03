'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useWeb3Modal } from '@web3modal/react'

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const { open } = useWeb3Modal()
  const { disconnect } = useDisconnect()

  const connect = async () => {
    try {
      await open()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  return {
    address,
    isConnected,
    isConnecting,
    connect,
    disconnect
  }
}