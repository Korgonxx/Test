#!/usr/bin/env node

/**
 * Upload AI Models to Irys
 * This script uploads sample AI models to Irys for use in the gaming platform
 */

import { IrysModelManager, ModelMetadata } from './IrysModelManager';
import { DecisionTree } from './models/DecisionTree';
import { SimpleNeuralNetwork } from './models/NeuralNetwork';

async function uploadModels() {
  console.log('🚀 Starting AI model upload to Irys...');
  
  try {
    // Initialize Irys model manager
    const irysConfig = {
      url: process.env.IRYS_TESTNET_RPC || 'https://testnet.irys.xyz',
      token: 'irys',
      key: process.env.PRIVATE_KEY || (() => {
        throw new Error('PRIVATE_KEY environment variable is required');
      })()
    };
    
    const modelManager = new IrysModelManager(irysConfig);
    
    // Check balance
    console.log('💰 Checking Irys account balance...');
    const balance = await modelManager.getBalance();
    console.log(`Current balance: ${balance} tokens`);
    
    if (balance < 0.01) {
      console.log('⚠️ Low balance detected. Consider funding your account for model uploads.');
    }
    
    // Create and upload guard decision tree
    console.log('🛡️ Creating guard AI model...');
    const guardTree = DecisionTree.createSampleGuard();
    const guardMetadata: ModelMetadata = {
      name: 'Cyberpunk Guard AI',
      type: 'decision_tree',
      version: '1.0.0',
      description: 'Advanced security AI for perimeter defense and patrol duties. Responds to player proximity and threat levels.',
      creator: 'IrysGaming',
      tags: ['guard', 'security', 'patrol', 'combat', 'npc'],
      gasEstimate: 75000
    };
    
    const guardUpload = await modelManager.uploadDecisionTree(guardTree, guardMetadata);
    console.log(`✅ Guard model uploaded: ${guardUpload.modelId}`);
    console.log(`   URL: ${guardUpload.url}`);
    console.log(`   Cost: ${guardUpload.cost} tokens`);
    
    // Create and upload merchant neural network
    console.log('🏪 Creating merchant AI model...');
    const merchantNetwork = SimpleNeuralNetwork.createPretrainedMerchant();
    const merchantMetadata: ModelMetadata = {
      name: 'Trade Network AI',
      type: 'neural_network',
      version: '1.0.0',
      description: 'Sophisticated trading AI that adapts pricing and inventory based on player behavior and market conditions.',
      creator: 'IrysGaming',
      tags: ['merchant', 'trade', 'commerce', 'economy', 'npc'],
      gasEstimate: 120000
    };
    
    const merchantUpload = await modelManager.uploadNeuralNetwork(merchantNetwork, merchantMetadata);
    console.log(`✅ Merchant model uploaded: ${merchantUpload.modelId}`);
    console.log(`   URL: ${merchantUpload.url}`);
    console.log(`   Cost: ${merchantUpload.cost} tokens`);
    
    // Create and upload quest giver model
    console.log('📜 Creating quest giver AI model...');
    const questGiverTree = DecisionTree.createSampleMerchant(); // Reuse for now, but customize
    const questGiverMetadata: ModelMetadata = {
      name: 'Quest Oracle AI',
      type: 'decision_tree',
      version: '1.0.0',
      description: 'Intelligent quest distribution system that analyzes player progress and preferences to offer personalized missions.',
      creator: 'IrysGaming',
      tags: ['quest', 'oracle', 'missions', 'progression', 'npc'],
      gasEstimate: 85000
    };
    
    const questGiverUpload = await modelManager.uploadDecisionTree(questGiverTree, questGiverMetadata);
    console.log(`✅ Quest Giver model uploaded: ${questGiverUpload.modelId}`);
    console.log(`   URL: ${questGiverUpload.url}`);
    console.log(`   Cost: ${questGiverUpload.cost} tokens`);
    
    // Create configuration file with model IDs
    const modelConfig = {
      timestamp: new Date().toISOString(),
      network: 'irys-testnet',
      models: {
        guard: {
          id: guardUpload.modelId,
          type: 'decision_tree',
          url: guardUpload.url,
          gasEstimate: guardMetadata.gasEstimate
        },
        merchant: {
          id: merchantUpload.modelId,
          type: 'neural_network',
          url: merchantUpload.url,
          gasEstimate: merchantMetadata.gasEstimate
        },
        questGiver: {
          id: questGiverUpload.modelId,
          type: 'decision_tree',
          url: questGiverUpload.url,
          gasEstimate: questGiverMetadata.gasEstimate
        }
      },
      totalCost: guardUpload.cost + merchantUpload.cost + questGiverUpload.cost
    };
    
    // Save configuration
    const fs = require('fs');
    const path = require('path');
    
    const configDir = path.join(__dirname, '../config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
    
    const configFile = path.join(configDir, 'model-config.json');
    fs.writeFileSync(configFile, JSON.stringify(modelConfig, null, 2));
    
    console.log('\n📊 Upload Summary:');
    console.log('==================');
    console.log(`Total Models: 3`);
    console.log(`Total Cost: ${modelConfig.totalCost} tokens`);
    console.log(`Config saved: ${configFile}`);
    
    console.log('\n🎯 Model IDs for Contract Integration:');
    console.log(`Guard Model: ${guardUpload.modelId}`);
    console.log(`Merchant Model: ${merchantUpload.modelId}`);
    console.log(`Quest Giver Model: ${questGiverUpload.modelId}`);
    
    console.log('\n✅ All models uploaded successfully!');
    console.log('💡 Next: Update your smart contracts with these model IDs');
    
    // Test model downloads
    console.log('\n🧪 Testing model downloads...');
    
    try {
      const guardTest = await modelManager.downloadModel(guardUpload.modelId);
      console.log(`✅ Guard model download test: ${guardTest.type}`);
      
      const merchantTest = await modelManager.downloadModel(merchantUpload.modelId);
      console.log(`✅ Merchant model download test: ${merchantTest.type}`);
      
      console.log('✅ All download tests passed!');
    } catch (error) {
      console.warn('⚠️ Download test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Model upload failed:', error);
    
    if (error.message.includes('PRIVATE_KEY')) {
      console.log('\n💡 Setup Help:');
      console.log('1. Create a .env file in the ai/ directory');
      console.log('2. Add your private key: PRIVATE_KEY=your_key_here');
      console.log('3. Fund your account with IRYS tokens');
    }
    
    process.exit(1);
  }
}

// Check if this is being run directly
if (require.main === module) {
  uploadModels();
}

export { uploadModels };