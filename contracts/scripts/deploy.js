const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to Irys network...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "IRYS");

  // Mock Irys interface addresses (in real deployment, these would be actual Irys contracts)
  const IRYS_DATA_STORE = process.env.IRYS_DATA_STORE || "0x0000000000000000000000000000000000000001";
  const IRYS_VM = process.env.IRYS_VM || "0x0000000000000000000000000000000000000002";

  console.log("\n📦 Deploying contracts...");

  // Deploy Token contract
  console.log("Deploying IrysGameToken...");
  const Token = await hre.ethers.getContractFactory("IrysGameToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  console.log("✅ IrysGameToken deployed to:", await token.getAddress());

  // Deploy GameState contract
  console.log("Deploying GameState...");
  const GameState = await hre.ethers.getContractFactory("GameState");
  const gameState = await GameState.deploy(IRYS_DATA_STORE);
  await gameState.waitForDeployment();
  console.log("✅ GameState deployed to:", await gameState.getAddress());

  // Deploy AINPC contract
  console.log("Deploying AINPC...");
  const AINPC = await hre.ethers.getContractFactory("AINPC");
  const aiNPC = await AINPC.deploy(IRYS_VM, IRYS_DATA_STORE);
  await aiNPC.waitForDeployment();
  console.log("✅ AINPC deployed to:", await aiNPC.getAddress());

  console.log("\n🔧 Setting up contracts...");

  // Authorize GameState contract to mint tokens
  const tokenAddress = await token.getAddress();
  const gameStateAddress = await gameState.getAddress();
  const aiNPCAddress = await aiNPC.getAddress();

  console.log("Authorizing GameState contract as token minter...");
  const mintingAllowance = hre.ethers.parseEther("1000000"); // 1M tokens
  await token.authorizeMinter(gameStateAddress, mintingAllowance);
  console.log("✅ GameState authorized as minter");

  // Authorize AINPC contract as executor
  console.log("Authorizing AINPC contract as AI executor...");
  await aiNPC.setAuthorizedExecutor(gameStateAddress, true);
  console.log("✅ AINPC authorized as executor");

  console.log("\n🎮 Creating sample game content...");

  // Create sample quests
  const sampleQuests = [
    {
      name: "Data Retrieval Alpha",
      description: "Collect encrypted data fragments from sector 7",
      reward: 100,
      requiredLevel: 1,
      irysDataId: "quest-data-alpha-001"
    },
    {
      name: "Network Security Breach",
      description: "Eliminate hostile AI entities threatening the network",
      reward: 250,
      requiredLevel: 3,
      irysDataId: "quest-security-beta-002"
    },
    {
      name: "System Maintenance",
      description: "Repair damaged connection nodes in the outer rim",
      reward: 500,
      requiredLevel: 5,
      irysDataId: "quest-maintenance-gamma-003"
    }
  ];

  for (const quest of sampleQuests) {
    await gameState.createQuest(
      quest.name,
      quest.description,
      hre.ethers.parseEther(quest.reward.toString()),
      quest.requiredLevel,
      quest.irysDataId
    );
    console.log(`✅ Created quest: ${quest.name}`);
  }

  // Create sample NPCs
  const sampleNPCs = [
    {
      id: 1,
      x: 200,
      y: 150,
      health: 100,
      behaviorModel: "guard-model-alpha",
      currentState: "patrol"
    },
    {
      id: 2,
      x: 400,
      y: 300,
      health: 85,
      behaviorModel: "merchant-model-beta",
      currentState: "idle"
    },
    {
      id: 3,
      x: 600,
      y: 100,
      health: 95,
      behaviorModel: "questgiver-model-gamma",
      currentState: "waiting"
    }
  ];

  for (const npc of sampleNPCs) {
    await gameState.updateNPCState(
      npc.id,
      npc.x,
      npc.y,
      npc.health,
      npc.behaviorModel,
      npc.currentState
    );
    console.log(`✅ Created NPC ${npc.id} at position (${npc.x}, ${npc.y})`);
  }

  console.log("\n📋 Deployment Summary:");
  console.log("====================================");
  console.log(`Token Contract: ${tokenAddress}`);
  console.log(`GameState Contract: ${gameStateAddress}`);
  console.log(`AINPC Contract: ${aiNPCAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log("====================================");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      token: tokenAddress,
      gameState: gameStateAddress,
      aiNPC: aiNPCAddress
    },
    irysInterfaces: {
      dataStore: IRYS_DATA_STORE,
      vm: IRYS_VM
    }
  };

  const fs = require('fs');
  const path = require('path');
  
  const deploymentDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir);
  }
  
  const filename = `deployment-${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`\n💾 Deployment info saved to: deployments/${filename}`);

  // Verify contracts if on testnet/mainnet
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verifying contracts...");
    
    try {
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: []
      });
      console.log("✅ Token contract verified");
    } catch (error) {
      console.log("❌ Token verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: gameStateAddress,
        constructorArguments: [IRYS_DATA_STORE]
      });
      console.log("✅ GameState contract verified");
    } catch (error) {
      console.log("❌ GameState verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: aiNPCAddress,
        constructorArguments: [IRYS_VM, IRYS_DATA_STORE]
      });
      console.log("✅ AINPC contract verified");
    } catch (error) {
      console.log("❌ AINPC verification failed:", error.message);
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Update frontend environment variables with contract addresses");
  console.log("2. Upload AI models to Irys using the AI module");
  console.log("3. Test the game functionality");
  console.log("4. Consider setting up monitoring and analytics");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });