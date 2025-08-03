/**
 * Game State Adapter
 * Converts between blockchain game state and AI model input/output formats
 */

import { NPCInput, NPCOutput } from '../models/DecisionTree';

export interface BlockchainGameState {
  player: {
    address: string;
    x: number;
    y: number;
    level: number;
    experience: number;
    lastActive: number;
    isActive: boolean;
  };
  npc: {
    id: number;
    x: number;
    y: number;
    health: number;
    lastInteraction: number;
    behaviorModel: string;
    currentState: string;
    isActive: boolean;
  };
  gameConfig: {
    mapWidth: number;
    mapHeight: number;
    currentTime: number;
  };
  questData?: {
    activeQuests: number[];
    completedQuests: number[];
    questInProgress: boolean;
  };
}

export interface SmartContractInput {
  npcId: number;
  input: string; // JSON string
  gasLimit: number;
}

export interface SmartContractOutput {
  success: boolean;
  output: string; // JSON string
  gasUsed: number;
  blockNumber: number;
  transactionHash: string;
}

export class GameStateAdapter {
  
  /**
   * Convert blockchain game state to AI model input
   */
  static gameStateToAIInput(gameState: BlockchainGameState): NPCInput {
    const player = gameState.player;
    const npc = gameState.npc;
    
    // Calculate distance between player and NPC
    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Convert timestamp to time of day (0-23)
    const timeOfDay = new Date(gameState.gameConfig.currentTime * 1000).getHours();
    
    // Determine player health percentage (simplified)
    const playerHealthPercent = Math.min(100, (player.experience / 10)); // Rough approximation
    
    // Determine if player is hostile (simplified logic)
    const playerHostile = npc.currentState.includes('hostile') || 
                         npc.currentState.includes('combat');
    
    return {
      playerDistance: distance,
      playerLevel: player.level,
      playerHealth: playerHealthPercent,
      npcHealth: npc.health,
      lastAction: npc.currentState || 'idle',
      timeOfDay,
      gameState: {
        questActive: gameState.questData?.questInProgress || false,
        combatMode: npc.currentState.includes('combat'),
        playerHostile
      }
    };
  }

  /**
   * Convert AI model output to blockchain-compatible format
   */
  static aiOutputToContractData(output: NPCOutput, npcId: number): {
    action: string;
    parameters: string[];
    priority: number;
    targetPlayer: boolean;
  } {
    const parameters: string[] = [];
    
    // Convert movement data to parameters
    if (output.movement) {
      parameters.push(`direction:${output.movement.direction}`);
      parameters.push(`distance:${output.movement.distance}`);
    }
    
    // Add dialogue if present
    if (output.dialogue) {
      parameters.push(`dialogue:${output.dialogue}`);
    }
    
    // Add target player flag
    if (output.targetPlayer) {
      parameters.push('target:player');
    }

    return {
      action: output.action,
      parameters,
      priority: output.priority,
      targetPlayer: output.targetPlayer || false
    };
  }

  /**
   * Create smart contract input for AI execution
   */
  static createContractInput(
    npcId: number,
    gameState: BlockchainGameState,
    gasLimit: number = 100000
  ): SmartContractInput {
    const aiInput = this.gameStateToAIInput(gameState);
    
    return {
      npcId,
      input: JSON.stringify(aiInput),
      gasLimit
    };
  }

  /**
   * Parse smart contract output
   */
  static parseContractOutput(contractOutput: SmartContractOutput): NPCOutput | null {
    try {
      if (!contractOutput.success) {
        console.error('Contract execution failed');
        return null;
      }

      const parsedOutput = JSON.parse(contractOutput.output);
      
      // Validate the output structure
      if (!parsedOutput.action || typeof parsedOutput.priority !== 'number') {
        console.error('Invalid AI output format');
        return null;
      }

      return parsedOutput as NPCOutput;
    } catch (error) {
      console.error('Error parsing contract output:', error);
      return null;
    }
  }

  /**
   * Convert NPC output to game state updates
   */
  static outputToStateUpdates(output: NPCOutput, npcId: number): {
    updateNPCState?: {
      id: number;
      x?: number;
      y?: number;
      currentState: string;
      lastInteraction: number;
    };
    updatePlayerState?: {
      dialogue?: string;
      combatInitiated?: boolean;
    };
    triggerEvents?: string[];
  } {
    const updates: any = {
      triggerEvents: []
    };

    // Update NPC state
    updates.updateNPCState = {
      id: npcId,
      currentState: output.action,
      lastInteraction: Math.floor(Date.now() / 1000)
    };

    // Handle movement
    if (output.movement) {
      updates.triggerEvents.push(`npc_movement:${npcId}:${output.movement.direction}:${output.movement.distance}`);
    }

    // Handle dialogue
    if (output.dialogue) {
      updates.updatePlayerState = {
        dialogue: output.dialogue
      };
      updates.triggerEvents.push(`npc_dialogue:${npcId}`);
    }

    // Handle combat
    if (output.action === 'attack' && output.targetPlayer) {
      updates.updatePlayerState = {
        ...updates.updatePlayerState,
        combatInitiated: true
      };
      updates.triggerEvents.push(`combat_initiated:${npcId}`);
    }

    // Handle trading
    if (output.action === 'trade') {
      updates.triggerEvents.push(`trade_offer:${npcId}`);
    }

    // Handle quests
    if (output.action === 'quest') {
      updates.triggerEvents.push(`quest_interaction:${npcId}`);
    }

    return updates;
  }

  /**
   * Validate game state data
   */
  static validateGameState(gameState: any): boolean {
    try {
      return (
        gameState &&
        gameState.player &&
        gameState.npc &&
        gameState.gameConfig &&
        typeof gameState.player.x === 'number' &&
        typeof gameState.player.y === 'number' &&
        typeof gameState.npc.x === 'number' &&
        typeof gameState.npc.y === 'number' &&
        typeof gameState.npc.health === 'number'
      );
    } catch {
      return false;
    }
  }

  /**
   * Create a mock game state for testing
   */
  static createMockGameState(
    playerPos: { x: number; y: number } = { x: 500, y: 500 },
    npcPos: { x: number; y: number } = { x: 495, y: 498 }
  ): BlockchainGameState {
    return {
      player: {
        address: '0x742d35cc6636c0532925a3b8',
        x: playerPos.x,
        y: playerPos.y,
        level: 5,
        experience: 250,
        lastActive: Math.floor(Date.now() / 1000),
        isActive: true
      },
      npc: {
        id: 1,
        x: npcPos.x,
        y: npcPos.y,
        health: 85,
        lastInteraction: Math.floor(Date.now() / 1000) - 300,
        behaviorModel: 'sample_guard',
        currentState: 'idle',
        isActive: true
      },
      gameConfig: {
        mapWidth: 1000,
        mapHeight: 1000,
        currentTime: Math.floor(Date.now() / 1000)
      },
      questData: {
        activeQuests: [1, 3],
        completedQuests: [2],
        questInProgress: true
      }
    };
  }

  /**
   * Batch process multiple NPC states
   */
  static batchProcessNPCs(
    gameStates: BlockchainGameState[],
    gasLimitPerNPC: number = 75000
  ): SmartContractInput[] {
    return gameStates.map((gameState, index) => 
      this.createContractInput(gameState.npc.id, gameState, gasLimitPerNPC)
    );
  }

  /**
   * Calculate interaction priority based on game state
   */
  static calculateInteractionPriority(gameState: BlockchainGameState): number {
    const player = gameState.player;
    const npc = gameState.npc;
    
    const distance = Math.sqrt(
      Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2)
    );
    
    // Priority factors
    let priority = 0;
    
    // Distance factor (closer = higher priority)
    priority += Math.max(0, 100 - distance * 10);
    
    // Player level factor
    priority += player.level * 2;
    
    // Time since last interaction
    const timeSinceInteraction = Date.now() / 1000 - npc.lastInteraction;
    priority += Math.min(50, timeSinceInteraction / 60); // Max 50 points for 1+ minute
    
    // Active quest bonus
    if (gameState.questData?.questInProgress) {
      priority += 25;
    }
    
    // Health factor
    if (npc.health < 50) {
      priority += 20; // Injured NPCs might need attention
    }
    
    return Math.floor(priority);
  }
}