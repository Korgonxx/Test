/**
 * Simple Neural Network implementation for NPC behavior
 * Lightweight design suitable for onchain execution
 */

import { Matrix } from 'ml-matrix';

export interface NetworkLayer {
  weights: number[][];
  biases: number[];
  activation: 'sigmoid' | 'tanh' | 'relu' | 'softmax';
}

export interface NetworkConfig {
  inputSize: number;
  hiddenLayers: number[];
  outputSize: number;
  learningRate?: number;
}

export class SimpleNeuralNetwork {
  private layers: NetworkLayer[];
  private config: NetworkConfig;
  private modelId: string;

  constructor(modelId: string, config: NetworkConfig, layers?: NetworkLayer[]) {
    this.modelId = modelId;
    this.config = config;
    
    if (layers) {
      this.layers = layers;
    } else {
      this.initializeLayers();
    }
  }

  /**
   * Initialize network layers with random weights
   */
  private initializeLayers(): void {
    this.layers = [];
    const sizes = [this.config.inputSize, ...this.config.hiddenLayers, this.config.outputSize];

    for (let i = 0; i < sizes.length - 1; i++) {
      const inputSize = sizes[i];
      const outputSize = sizes[i + 1];
      
      // Xavier initialization
      const limit = Math.sqrt(6 / (inputSize + outputSize));
      
      const weights: number[][] = [];
      for (let j = 0; j < outputSize; j++) {
        const row: number[] = [];
        for (let k = 0; k < inputSize; k++) {
          row.push((Math.random() - 0.5) * 2 * limit);
        }
        weights.push(row);
      }

      const biases: number[] = new Array(outputSize).fill(0);
      
      // Use appropriate activation function for each layer
      let activation: 'sigmoid' | 'tanh' | 'relu' | 'softmax' = 'relu';
      if (i === sizes.length - 2) { // Output layer
        activation = 'softmax';
      } else if (i === 0) { // First hidden layer
        activation = 'tanh';
      }

      this.layers.push({ weights, biases, activation });
    }
  }

  /**
   * Forward pass through the network
   */
  predict(input: number[]): number[] {
    let output = input;

    for (const layer of this.layers) {
      output = this.forwardLayer(output, layer);
    }

    return output;
  }

  /**
   * Forward pass through a single layer
   */
  private forwardLayer(input: number[], layer: NetworkLayer): number[] {
    const output: number[] = [];

    for (let i = 0; i < layer.weights.length; i++) {
      let sum = layer.biases[i];
      for (let j = 0; j < input.length; j++) {
        sum += input[j] * layer.weights[i][j];
      }
      output.push(sum);
    }

    return this.applyActivation(output, layer.activation);
  }

  /**
   * Apply activation function
   */
  private applyActivation(values: number[], activation: string): number[] {
    switch (activation) {
      case 'sigmoid':
        return values.map(x => 1 / (1 + Math.exp(-x)));
      
      case 'tanh':
        return values.map(x => Math.tanh(x));
      
      case 'relu':
        return values.map(x => Math.max(0, x));
      
      case 'softmax':
        const max = Math.max(...values);
        const exp = values.map(x => Math.exp(x - max));
        const sum = exp.reduce((a, b) => a + b, 0);
        return exp.map(x => x / sum);
      
      default:
        return values;
    }
  }

  /**
   * Convert NPC input to neural network input vector
   */
  static encodeInput(input: {
    playerDistance: number;
    playerLevel: number;
    playerHealth: number;
    npcHealth: number;
    timeOfDay: number;
    combatMode: boolean;
    questActive: boolean;
    playerHostile: boolean;
  }): number[] {
    return [
      input.playerDistance / 100, // Normalize to 0-1
      input.playerLevel / 50,     // Assuming max level 50
      input.playerHealth / 100,   // Normalize to 0-1
      input.npcHealth / 100,      // Normalize to 0-1
      input.timeOfDay / 24,       // Normalize to 0-1
      input.combatMode ? 1 : 0,   // Boolean to 0/1
      input.questActive ? 1 : 0,  // Boolean to 0/1
      input.playerHostile ? 1 : 0 // Boolean to 0/1
    ];
  }

  /**
   * Decode neural network output to NPC actions
   */
  static decodeOutput(output: number[]): {
    action: string;
    confidence: number;
    parameters: any;
  } {
    const actions = [
      'idle',
      'patrol',
      'guard',
      'dialogue',
      'trade',
      'attack',
      'flee',
      'quest',
      'move_towards',
      'move_away'
    ];

    // Find action with highest probability
    let maxIndex = 0;
    let maxValue = output[0];
    
    for (let i = 1; i < output.length && i < actions.length; i++) {
      if (output[i] > maxValue) {
        maxValue = output[i];
        maxIndex = i;
      }
    }

    const action = actions[maxIndex];
    const confidence = maxValue;

    // Generate parameters based on action and output values
    let parameters: any = {};
    
    switch (action) {
      case 'dialogue':
        parameters.type = output[actions.length] > 0.5 ? 'friendly' : 'neutral';
        break;
      
      case 'move_towards':
      case 'move_away':
        parameters.speed = Math.min(1, Math.max(0.1, output[actions.length + 1] || 0.5));
        break;
      
      case 'attack':
        parameters.aggressiveness = Math.min(1, Math.max(0, output[actions.length + 2] || 0.7));
        break;
      
      case 'trade':
        parameters.discount = Math.min(0.3, Math.max(0, output[actions.length + 3] || 0.1));
        break;
    }

    return { action, confidence, parameters };
  }

  /**
   * Export the neural network as JSON for storage on Irys
   */
  export(): string {
    return JSON.stringify({
      modelId: this.modelId,
      type: 'neural_network',
      version: '1.0',
      config: this.config,
      layers: this.layers,
      metadata: {
        created: new Date().toISOString(),
        inputSize: this.config.inputSize,
        outputSize: this.config.outputSize,
        totalParameters: this.getTotalParameters()
      }
    });
  }

  /**
   * Import a neural network from JSON
   */
  static import(jsonData: string): SimpleNeuralNetwork {
    const data = JSON.parse(jsonData);
    return new SimpleNeuralNetwork(data.modelId, data.config, data.layers);
  }

  /**
   * Get total number of parameters in the network
   */
  private getTotalParameters(): number {
    let total = 0;
    for (const layer of this.layers) {
      total += layer.weights.length * layer.weights[0].length; // weights
      total += layer.biases.length; // biases
    }
    return total;
  }

  /**
   * Create a pre-trained guard NPC network
   */
  static createPretrainedGuard(): SimpleNeuralNetwork {
    const config: NetworkConfig = {
      inputSize: 8,
      hiddenLayers: [16, 8],
      outputSize: 10
    };

    // Pre-trained weights for guard behavior
    const layers: NetworkLayer[] = [
      {
        weights: [
          [-0.5, 0.3, 0.1, 0.2, -0.1, 0.8, 0.2, -0.6], // Emphasize combat and hostility
          [0.2, -0.1, 0.4, 0.3, 0.6, -0.4, 0.1, 0.3],
          [0.1, 0.2, -0.3, 0.5, 0.2, 0.7, -0.2, 0.4],
          [0.3, 0.4, 0.1, -0.2, 0.3, 0.5, 0.6, -0.1],
          [-0.2, 0.6, 0.3, 0.1, 0.4, -0.3, 0.2, 0.5],
          [0.4, -0.3, 0.2, 0.6, -0.1, 0.2, 0.4, 0.3],
          [0.1, 0.3, 0.5, -0.2, 0.6, 0.1, -0.4, 0.2],
          [0.6, 0.1, -0.2, 0.4, 0.3, 0.5, 0.2, -0.3],
          [-0.1, 0.4, 0.2, 0.3, 0.5, -0.2, 0.6, 0.1],
          [0.3, -0.2, 0.6, 0.1, 0.4, 0.3, -0.1, 0.5],
          [0.2, 0.5, -0.3, 0.4, 0.1, 0.6, 0.3, -0.2],
          [0.5, 0.2, 0.4, -0.1, 0.6, 0.3, 0.1, 0.4],
          [0.1, 0.6, 0.2, 0.3, -0.4, 0.5, 0.4, 0.1],
          [0.4, 0.1, 0.5, 0.2, 0.3, -0.1, 0.6, 0.3],
          [0.3, 0.4, 0.1, 0.6, 0.2, 0.5, -0.2, 0.4],
          [0.6, 0.3, 0.4, 0.1, 0.5, 0.2, 0.3, -0.1]
        ],
        biases: [0.1, -0.2, 0.3, 0.1, -0.1, 0.2, 0.0, 0.1, 0.2, -0.1, 0.0, 0.3, 0.1, 0.2, -0.1, 0.0],
        activation: 'tanh'
      },
      {
        weights: [
          [0.4, -0.2, 0.3, 0.5, 0.1, 0.6, 0.2, -0.3, 0.4, 0.1, 0.5, 0.2, 0.3, 0.4, 0.1, 0.6],
          [0.2, 0.5, -0.1, 0.3, 0.4, 0.2, 0.6, 0.1, -0.2, 0.5, 0.3, 0.4, 0.1, 0.2, 0.6, 0.3],
          [0.6, 0.1, 0.4, 0.2, 0.5, 0.3, -0.1, 0.4, 0.2, 0.6, 0.1, 0.3, 0.5, 0.4, 0.2, 0.1],
          [0.1, 0.4, 0.2, 0.6, 0.3, 0.5, 0.1, 0.2, 0.4, 0.3, 0.6, 0.1, 0.2, 0.5, 0.3, 0.4],
          [0.3, 0.2, 0.5, 0.1, 0.6, 0.4, 0.3, 0.5, 0.1, 0.2, 0.4, 0.6, 0.3, 0.1, 0.5, 0.2],
          [0.5, 0.3, 0.1, 0.4, 0.2, 0.6, 0.5, 0.3, 0.6, 0.1, 0.2, 0.4, 0.5, 0.3, 0.1, 0.6],
          [0.2, 0.6, 0.4, 0.3, 0.5, 0.1, 0.2, 0.6, 0.3, 0.4, 0.5, 0.2, 0.6, 0.1, 0.4, 0.3],
          [0.4, 0.1, 0.6, 0.2, 0.3, 0.5, 0.4, 0.1, 0.5, 0.6, 0.3, 0.2, 0.4, 0.6, 0.1, 0.5]
        ],
        biases: [0.0, 0.1, -0.1, 0.2, 0.0, 0.3, 0.1, -0.2],
        activation: 'relu'
      },
      {
        weights: [
          [0.8, -0.2, 0.1, 0.3, 0.5, -0.6, 0.4, 0.2], // idle
          [0.3, 0.6, -0.1, 0.4, 0.2, 0.1, 0.5, 0.3], // patrol
          [0.5, 0.4, 0.7, -0.2, 0.3, 0.2, 0.6, 0.1], // guard
          [0.2, 0.3, 0.1, 0.6, 0.4, 0.5, -0.1, 0.3], // dialogue
          [-0.3, 0.1, 0.2, 0.4, 0.6, 0.3, 0.1, 0.5], // trade
          [0.1, -0.5, 0.3, 0.2, 0.4, 0.8, 0.6, -0.2], // attack
          [-0.4, 0.2, 0.1, 0.5, 0.3, -0.1, 0.4, 0.6], // flee
          [0.3, 0.4, 0.2, 0.5, 0.6, 0.1, 0.3, 0.4], // quest
          [0.4, 0.5, 0.3, 0.1, 0.2, 0.6, 0.4, 0.3], // move_towards
          [0.2, 0.3, 0.4, 0.6, 0.1, 0.5, 0.2, 0.4]  // move_away
        ],
        biases: [0.2, 0.1, 0.3, 0.0, -0.2, 0.1, -0.1, 0.2, 0.1, 0.0],
        activation: 'softmax'
      }
    ];

    return new SimpleNeuralNetwork('pretrained_guard', config, layers);
  }

  /**
   * Create a pre-trained merchant NPC network
   */
  static createPretrainedMerchant(): SimpleNeuralNetwork {
    const config: NetworkConfig = {
      inputSize: 8,
      hiddenLayers: [12, 6],
      outputSize: 10
    };

    // Simplified merchant behavior - prioritizes trade and dialogue
    const layers: NetworkLayer[] = [
      {
        weights: Array(12).fill(0).map(() => 
          Array(8).fill(0).map(() => (Math.random() - 0.5) * 0.5)
        ),
        biases: Array(12).fill(0),
        activation: 'tanh'
      },
      {
        weights: Array(6).fill(0).map(() => 
          Array(12).fill(0).map(() => (Math.random() - 0.5) * 0.5)
        ),
        biases: Array(6).fill(0),
        activation: 'relu'
      },
      {
        weights: [
          [0.3, 0.2, 0.1, 0.4, 0.2, 0.3], // idle
          [0.1, 0.2, 0.3, 0.1, 0.2, 0.1], // patrol
          [0.2, 0.1, 0.3, 0.2, 0.1, 0.2], // guard
          [0.4, 0.6, 0.5, 0.7, 0.6, 0.5], // dialogue (high priority)
          [0.8, 0.9, 0.7, 0.8, 0.9, 0.8], // trade (highest priority)
          [-0.5, -0.6, -0.4, -0.5, -0.6, -0.5], // attack (low priority)
          [0.1, 0.2, 0.1, 0.2, 0.1, 0.2], // flee
          [0.3, 0.4, 0.3, 0.4, 0.3, 0.4], // quest
          [0.2, 0.3, 0.2, 0.3, 0.2, 0.3], // move_towards
          [0.1, 0.1, 0.2, 0.1, 0.1, 0.2]  // move_away
        ],
        biases: [0.0, -0.2, -0.1, 0.3, 0.5, -0.8, -0.1, 0.2, 0.1, -0.1],
        activation: 'softmax'
      }
    ];

    return new SimpleNeuralNetwork('pretrained_merchant', config, layers);
  }
}