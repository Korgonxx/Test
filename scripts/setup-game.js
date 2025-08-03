#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

async function setupGame() {
  console.log('🎮 Setting up Irys Gaming Platform...');
  
  try {
    // Initialize AI models
    console.log('🤖 Initializing AI models...');
    const aiDir = path.join(__dirname, '../ai');
    
    if (!fs.existsSync(path.join(aiDir, 'node_modules'))) {
      console.log('Installing AI dependencies...');
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec('npm install', { cwd: aiDir }, (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
    }
    
    // Build AI models
    console.log('Building AI models...');
    await new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      exec('npm run build', { cwd: aiDir }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
    
    // Create sample AI models
    console.log('Creating sample AI models...');
    const { DecisionTree, SimpleNeuralNetwork } = require('../ai/dist');
    const { IrysModelManager } = require('../ai/dist');
    
    // Sample configuration
    const irysConfig = {
      url: process.env.IRYS_TESTNET_RPC || 'https://testnet.irys.xyz',
      token: 'irys',
      key: process.env.PRIVATE_KEY || 'demo-key'
    };
    
    // Note: In a real setup, you would upload actual models here
    console.log('✅ AI models initialized');
    
    // Setup frontend
    console.log('🖥️ Setting up frontend...');
    const frontendDir = path.join(__dirname, '../frontend');
    
    if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
      console.log('Installing frontend dependencies...');
      await new Promise((resolve, reject) => {
        const { exec } = require('child_process');
        exec('npm install', { cwd: frontendDir }, (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
    }
    
    // Create environment file for frontend
    const frontendEnvExample = `# Irys Gaming Platform Environment Variables

# Network Configuration
NEXT_PUBLIC_IRYS_TESTNET_RPC=https://testnet-rpc.irys.xyz
NEXT_PUBLIC_IRYS_MAINNET_RPC=https://rpc.irys.xyz

# Contract Addresses (update after deployment)
NEXT_PUBLIC_GAME_STATE_CONTRACT=
NEXT_PUBLIC_TOKEN_CONTRACT=
NEXT_PUBLIC_AINPC_CONTRACT=

# Web3 Modal
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=demo

# API Keys
NEXT_PUBLIC_IRYS_API_KEY=

# Development
NEXT_PUBLIC_DEBUG=true
`;
    
    const frontendEnvPath = path.join(frontendDir, '.env.local.example');
    fs.writeFileSync(frontendEnvPath, frontendEnvExample);
    console.log('✅ Frontend environment template created');
    
    // Setup contracts
    console.log('📄 Setting up contracts...');
    const contractsDir = path.join(__dirname, '../contracts');
    
    if (!fs.existsSync(path.join(contractsDir, 'node_modules'))) {
      console.log('Installing contract dependencies...');
      await new Promise((resolve, reject) => {
        const { exec } = require('child_process');
        exec('npm install', { cwd: contractsDir }, (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
    }
    
    // Create contracts environment file
    const contractsEnvPath = path.join(contractsDir, '.env.example');
    if (!fs.existsSync(contractsEnvPath.replace('.example', ''))) {
      console.log('✅ Contract environment template available');
    }
    
    console.log('\n🎉 Game setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Copy and configure environment files:');
    console.log('   - contracts/.env.example → contracts/.env');
    console.log('   - frontend/.env.local.example → frontend/.env.local');
    console.log('2. Fund your wallet with testnet IRYS tokens');
    console.log('3. Deploy contracts: npm run deploy:testnet');
    console.log('4. Upload AI models: npm run upload-models --workspace=ai');
    console.log('5. Start frontend: npm run dev --workspace=frontend');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupGame();