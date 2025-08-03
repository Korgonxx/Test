/**
 * Main entry point for the Irys Gaming AI module
 * Exports all AI models, managers, and utilities
 */

export { DecisionTree, DecisionNode, NPCInput, NPCOutput } from './models/DecisionTree';
export { SimpleNeuralNetwork, NetworkLayer, NetworkConfig } from './models/NeuralNetwork';
export { IrysModelManager, ModelMetadata, ModelUploadResult } from './IrysModelManager';

// Utility functions for AI model integration
export * from './utils/ModelRunner';
export * from './utils/GameStateAdapter';

// Type definitions for contract integration
export interface ContractAIOutput {
  action: string;
  parameters: any;
  confidence: number;
  modelId: string;
  timestamp: number;
}

export interface NPCBehaviorConfig {
  modelId: string;
  updateInterval: number; // milliseconds
  fallbackBehavior: string;
  maxExecutionTime: number; // seconds
}