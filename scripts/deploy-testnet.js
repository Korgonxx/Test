#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🌐 Deploying to Irys Testnet...');

// Set environment variables for testnet
process.env.NODE_ENV = 'development';

// Run the Hardhat deployment script
const contractsDir = path.join(__dirname, '../contracts');
const deployCommand = `cd ${contractsDir} && npx hardhat run scripts/deploy.js --network irys-testnet`;

exec(deployCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Deployment failed: ${error}`);
    return;
  }
  
  if (stderr) {
    console.error(`⚠️ Warnings: ${stderr}`);
  }
  
  console.log(stdout);
  console.log('🎉 Testnet deployment completed!');
  
  // Additional testnet-specific setup
  console.log('\n📝 Testnet Setup Checklist:');
  console.log('- [ ] Fund your wallet with testnet IRYS tokens');
  console.log('- [ ] Verify contract addresses in deployment output');
  console.log('- [ ] Update frontend environment variables');
  console.log('- [ ] Upload sample AI models to Irys testnet');
  console.log('- [ ] Test basic game functionality');
});