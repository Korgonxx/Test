/**
 * Model Runner utility for executing AI models
 * Handles both local and remote execution environments
 */

import { DecisionTree, NPCInput, NPCOutput } from '../models/DecisionTree';
import { SimpleNeuralNetwork } from '../models/NeuralNetwork';
import { IrysModelManager } from '../IrysModelManager';

export interface ModelExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  gasUsed?: number;
}

export class ModelRunner {
  private modelManager: IrysModelManager;
  private localModels: Map<string, DecisionTree | SimpleNeuralNetwork> = new Map();

  constructor(modelManager: IrysModelManager) {
    this.modelManager = modelManager;
  }

  /**
   * Execute a model locally
   */
  async executeLocal(modelId: string, input: any): Promise<ModelExecutionResult> {
    const startTime = Date.now();

    try {
      let model = this.localModels.get(modelId);
      
      // Download model if not cached
      if (!model) {
        const { model: downloadedModel } = await this.modelManager.downloadModel(modelId);
        model = downloadedModel;
        this.localModels.set(modelId, model);
      }

      let output: any;

      if (model instanceof DecisionTree) {
        output = model.execute(input as NPCInput);
      } else if (model instanceof SimpleNeuralNetwork) {
        const encodedInput = SimpleNeuralNetwork.encodeInput(input);
        const rawOutput = model.predict(encodedInput);
        output = SimpleNeuralNetwork.decodeOutput(rawOutput);
      } else {
        throw new Error('Unknown model type');
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output,
        executionTime
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute multiple models in batch
   */
  async executeBatch(requests: Array<{
    modelId: string;
    input: any;
  }>): Promise<ModelExecutionResult[]> {
    const promises = requests.map(({ modelId, input }) => 
      this.executeLocal(modelId, input)
    );

    return Promise.all(promises);
  }

  /**
   * Preload models for faster execution
   */
  async preloadModels(modelIds: string[]): Promise<void> {
    const promises = modelIds.map(async (modelId) => {
      try {
        if (!this.localModels.has(modelId)) {
          const { model } = await this.modelManager.downloadModel(modelId);
          this.localModels.set(modelId, model);
        }
      } catch (error) {
        console.error(`Failed to preload model ${modelId}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get model performance metrics
   */
  async benchmarkModel(modelId: string, testInputs: any[]): Promise<{
    averageExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    successRate: number;
  }> {
    const results: ModelExecutionResult[] = [];

    for (const input of testInputs) {
      const result = await this.executeLocal(modelId, input);
      results.push(result);
    }

    const executionTimes = results
      .filter(r => r.success)
      .map(r => r.executionTime);

    const successCount = results.filter(r => r.success).length;

    return {
      averageExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      minExecutionTime: Math.min(...executionTimes),
      maxExecutionTime: Math.max(...executionTimes),
      successRate: successCount / results.length
    };
  }

  /**
   * Validate model output format
   */
  validateOutput(output: any, expectedSchema: string): boolean {
    switch (expectedSchema) {
      case 'NPCOutput':
        return (
          output &&
          typeof output.action === 'string' &&
          typeof output.priority === 'number'
        );
      
      case 'NeuralNetworkOutput':
        return (
          output &&
          typeof output.action === 'string' &&
          typeof output.confidence === 'number' &&
          output.parameters !== undefined
        );
      
      default:
        return true;
    }
  }

  /**
   * Get cached models
   */
  getCachedModels(): string[] {
    return Array.from(this.localModels.keys());
  }

  /**
   * Clear model cache
   */
  clearCache(): void {
    this.localModels.clear();
  }

  /**
   * Create test inputs for NPC models
   */
  static createTestInputs(): NPCInput[] {
    return [
      {
        playerDistance: 3,
        playerLevel: 5,
        playerHealth: 80,
        npcHealth: 100,
        lastAction: 'idle',
        timeOfDay: 12,
        gameState: {
          questActive: false,
          combatMode: false,
          playerHostile: false
        }
      },
      {
        playerDistance: 1,
        playerLevel: 10,
        playerHealth: 50,
        npcHealth: 75,
        lastAction: 'move',
        timeOfDay: 23,
        gameState: {
          questActive: true,
          combatMode: true,
          playerHostile: true
        }
      },
      {
        playerDistance: 8,
        playerLevel: 1,
        playerHealth: 100,
        npcHealth: 90,
        lastAction: 'dialogue',
        timeOfDay: 8,
        gameState: {
          questActive: false,
          combatMode: false,
          playerHostile: false
        }
      }
    ];
  }
}