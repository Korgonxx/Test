/**
 * Irys Model Manager
 * Handles uploading, retrieving, and managing AI models on Irys
 */

import Irys from '@irys/sdk';
import { DecisionTree } from './models/DecisionTree';
import { SimpleNeuralNetwork } from './models/NeuralNetwork';

export interface ModelMetadata {
  name: string;
  type: 'decision_tree' | 'neural_network';
  version: string;
  description: string;
  creator: string;
  tags: string[];
  gasEstimate: number;
}

export interface ModelUploadResult {
  modelId: string;
  txId: string;
  url: string;
  cost: number;
}

export class IrysModelManager {
  private irys: Irys;
  private models: Map<string, ModelMetadata> = new Map();

  constructor(irysConfig: {
    url: string;
    token: string;
    key: string;
  }) {
    this.irys = new Irys({
      url: irysConfig.url,
      token: irysConfig.token,
      key: irysConfig.key
    });
  }

  /**
   * Upload a Decision Tree model to Irys
   */
  async uploadDecisionTree(
    tree: DecisionTree,
    metadata: ModelMetadata
  ): Promise<ModelUploadResult> {
    const modelData = tree.export();
    
    const tags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Model-Type', value: 'decision_tree' },
      { name: 'Model-Name', value: metadata.name },
      { name: 'Model-Version', value: metadata.version },
      { name: 'Creator', value: metadata.creator },
      { name: 'Description', value: metadata.description },
      { name: 'Gas-Estimate', value: metadata.gasEstimate.toString() },
      ...metadata.tags.map(tag => ({ name: 'Tag', value: tag }))
    ];

    try {
      const response = await this.irys.upload(modelData, { tags });
      
      const result: ModelUploadResult = {
        modelId: response.id,
        txId: response.id,
        url: `https://gateway.irys.xyz/${response.id}`,
        cost: parseFloat(response.receipt?.fee || '0')
      };

      // Store metadata locally
      this.models.set(response.id, metadata);

      console.log(`Decision Tree uploaded successfully: ${response.id}`);
      return result;

    } catch (error) {
      console.error('Error uploading decision tree:', error);
      throw error;
    }
  }

  /**
   * Upload a Neural Network model to Irys
   */
  async uploadNeuralNetwork(
    network: SimpleNeuralNetwork,
    metadata: ModelMetadata
  ): Promise<ModelUploadResult> {
    const modelData = network.export();
    
    const tags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Model-Type', value: 'neural_network' },
      { name: 'Model-Name', value: metadata.name },
      { name: 'Model-Version', value: metadata.version },
      { name: 'Creator', value: metadata.creator },
      { name: 'Description', value: metadata.description },
      { name: 'Gas-Estimate', value: metadata.gasEstimate.toString() },
      ...metadata.tags.map(tag => ({ name: 'Tag', value: tag }))
    ];

    try {
      const response = await this.irys.upload(modelData, { tags });
      
      const result: ModelUploadResult = {
        modelId: response.id,
        txId: response.id,
        url: `https://gateway.irys.xyz/${response.id}`,
        cost: parseFloat(response.receipt?.fee || '0')
      };

      // Store metadata locally
      this.models.set(response.id, metadata);

      console.log(`Neural Network uploaded successfully: ${response.id}`);
      return result;

    } catch (error) {
      console.error('Error uploading neural network:', error);
      throw error;
    }
  }

  /**
   * Download a model from Irys
   */
  async downloadModel(modelId: string): Promise<{
    type: 'decision_tree' | 'neural_network';
    model: DecisionTree | SimpleNeuralNetwork;
    metadata: any;
  }> {
    try {
      const response = await fetch(`https://gateway.irys.xyz/${modelId}`);
      const modelData = await response.text();
      const parsedData = JSON.parse(modelData);

      let model: DecisionTree | SimpleNeuralNetwork;
      
      if (parsedData.type === 'decision_tree') {
        model = DecisionTree.import(modelData);
        return { type: 'decision_tree', model, metadata: parsedData.metadata };
      } else if (parsedData.type === 'neural_network') {
        model = SimpleNeuralNetwork.import(modelData);
        return { type: 'neural_network', model, metadata: parsedData.metadata };
      } else {
        throw new Error(`Unknown model type: ${parsedData.type}`);
      }

    } catch (error) {
      console.error('Error downloading model:', error);
      throw error;
    }
  }

  /**
   * Get model metadata from Irys
   */
  async getModelMetadata(modelId: string): Promise<ModelMetadata | null> {
    try {
      // Check local cache first
      if (this.models.has(modelId)) {
        return this.models.get(modelId)!;
      }

      // Fetch from Irys
      const response = await this.irys.transactions.get(modelId);
      const tags = response.tags;

      const metadata: ModelMetadata = {
        name: tags.find(t => t.name === 'Model-Name')?.value || 'Unknown',
        type: tags.find(t => t.name === 'Model-Type')?.value as any || 'decision_tree',
        version: tags.find(t => t.name === 'Model-Version')?.value || '1.0',
        description: tags.find(t => t.name === 'Description')?.value || '',
        creator: tags.find(t => t.name === 'Creator')?.value || 'Unknown',
        tags: tags.filter(t => t.name === 'Tag').map(t => t.value),
        gasEstimate: parseInt(tags.find(t => t.name === 'Gas-Estimate')?.value || '100000')
      };

      this.models.set(modelId, metadata);
      return metadata;

    } catch (error) {
      console.error('Error fetching model metadata:', error);
      return null;
    }
  }

  /**
   * Search for models by tags
   */
  async searchModels(searchTags: string[]): Promise<{
    modelId: string;
    metadata: ModelMetadata;
  }[]> {
    try {
      const query = {
        tags: [
          { name: 'Content-Type', values: ['application/json'] },
          { name: 'Model-Type', values: ['decision_tree', 'neural_network'] },
          ...searchTags.map(tag => ({ name: 'Tag', values: [tag] }))
        ]
      };

      const results = await this.irys.search('irys:transactions', query);
      const models: { modelId: string; metadata: ModelMetadata }[] = [];

      for (const result of results) {
        const metadata = await this.getModelMetadata(result.id);
        if (metadata) {
          models.push({ modelId: result.id, metadata });
        }
      }

      return models;

    } catch (error) {
      console.error('Error searching models:', error);
      return [];
    }
  }

  /**
   * Upload sample models for testing
   */
  async uploadSampleModels(): Promise<{
    guardModel: ModelUploadResult;
    merchantModel: ModelUploadResult;
  }> {
    console.log('Uploading sample models...');

    // Upload guard decision tree
    const guardTree = DecisionTree.createSampleGuard();
    const guardMetadata: ModelMetadata = {
      name: 'Sample Guard',
      type: 'decision_tree',
      version: '1.0',
      description: 'A basic guard NPC that patrols and responds to players',
      creator: 'IrysGaming',
      tags: ['guard', 'security', 'patrol', 'sample'],
      gasEstimate: 50000
    };

    // Upload merchant neural network
    const merchantNetwork = SimpleNeuralNetwork.createPretrainedMerchant();
    const merchantMetadata: ModelMetadata = {
      name: 'Sample Merchant',
      type: 'neural_network',
      version: '1.0',
      description: 'A merchant NPC that prioritizes trading and friendly dialogue',
      creator: 'IrysGaming',
      tags: ['merchant', 'trade', 'commerce', 'sample'],
      gasEstimate: 75000
    };

    const [guardModel, merchantModel] = await Promise.all([
      this.uploadDecisionTree(guardTree, guardMetadata),
      this.uploadNeuralNetwork(merchantNetwork, merchantMetadata)
    ]);

    console.log('Sample models uploaded successfully!');
    console.log('Guard Model ID:', guardModel.modelId);
    console.log('Merchant Model ID:', merchantModel.modelId);

    return { guardModel, merchantModel };
  }

  /**
   * Get storage cost estimate
   */
  async getStorageCost(dataSize: number): Promise<number> {
    try {
      const price = await this.irys.getPrice(dataSize);
      return parseFloat(price.toString());
    } catch (error) {
      console.error('Error getting storage cost:', error);
      return 0;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<number> {
    try {
      const balance = await this.irys.getBalance();
      return parseFloat(balance.toString());
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  /**
   * Fund the account for storage
   */
  async fund(amount: number): Promise<string> {
    try {
      const response = await this.irys.fund(amount);
      console.log(`Funded account with ${amount} tokens`);
      return response.id;
    } catch (error) {
      console.error('Error funding account:', error);
      throw error;
    }
  }

  /**
   * Create a model execution wrapper for smart contracts
   */
  createExecutionWrapper(modelId: string): {
    execute: (input: string) => Promise<string>;
    getModelId: () => string;
    getMetadata: () => Promise<ModelMetadata | null>;
  } {
    return {
      execute: async (input: string): Promise<string> => {
        try {
          const { model, type } = await this.downloadModel(modelId);
          
          if (type === 'decision_tree') {
            const tree = model as DecisionTree;
            const parsedInput = JSON.parse(input);
            const result = tree.execute(parsedInput);
            return JSON.stringify(result);
          } else if (type === 'neural_network') {
            const network = model as SimpleNeuralNetwork;
            const parsedInput = JSON.parse(input);
            const encodedInput = SimpleNeuralNetwork.encodeInput(parsedInput);
            const output = network.predict(encodedInput);
            const result = SimpleNeuralNetwork.decodeOutput(output);
            return JSON.stringify(result);
          } else {
            throw new Error('Unknown model type');
          }
        } catch (error) {
          console.error('Model execution error:', error);
          return JSON.stringify({ error: error.message });
        }
      },
      getModelId: () => modelId,
      getMetadata: () => this.getModelMetadata(modelId)
    };
  }

  /**
   * Batch upload multiple models
   */
  async batchUpload(models: Array<{
    model: DecisionTree | SimpleNeuralNetwork;
    metadata: ModelMetadata;
  }>): Promise<ModelUploadResult[]> {
    const results: ModelUploadResult[] = [];
    
    for (const { model, metadata } of models) {
      try {
        let result: ModelUploadResult;
        
        if (model instanceof DecisionTree) {
          result = await this.uploadDecisionTree(model, metadata);
        } else {
          result = await this.uploadNeuralNetwork(model, metadata);
        }
        
        results.push(result);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error uploading model ${metadata.name}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get all locally cached models
   */
  getLocalModels(): Map<string, ModelMetadata> {
    return new Map(this.models);
  }

  /**
   * Clear local model cache
   */
  clearCache(): void {
    this.models.clear();
  }
}