# Irys Gaming Platform

> **Decentralized Gaming Platform with AI-Powered NPCs on Irys Blockchain**

A cutting-edge Web3 gaming platform featuring AI-powered NPCs whose behavior is stored and executed onchain using Irys's programmable datachain technology. Built with Solidity smart contracts, React/Next.js frontend, and lightweight AI models optimized for blockchain execution.

![Irys Gaming Platform](https://img.shields.io/badge/Platform-Irys%20Blockchain-00ffff?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

## 🎮 Overview

This platform demonstrates the future of gaming on blockchain by combining:

- **AI-Powered NPCs**: Lightweight AI models (decision trees & neural networks) stored on Irys
- **Onchain Execution**: NPC behavior executed transparently via IrysVM
- **Decentralized Storage**: Game assets, quest data, and AI models permanently stored on Irys
- **ERC-20 Token Economy**: Reward system for quests, leaderboards, and community contributions
- **Cyberpunk Aesthetic**: Immersive dark theme with neon glows and matrix effects

## 🏗️ Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     Frontend        │    │   Smart Contracts   │    │    AI Models        │
│   (Next.js/React)  │────│   (Solidity/Irys)   │────│  (Decision Trees)   │
│                     │    │                     │    │  (Neural Networks)  │
│  • Game Interface   │    │  • GameState.sol    │    │                     │
│  • Player Dashboard │    │  • AINPC.sol        │    │  Stored on Irys     │
│  • NPC Interactions │    │  • Token.sol        │    │  Executed via       │
│  • Cyberpunk UI     │    │                     │    │  IrysVM             │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **Git**
- **Wallet** with Irys testnet tokens ([Get testnet tokens](https://irys.xyz/faucet))

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/irys-gaming-platform
cd irys-gaming-platform

# Install dependencies for all workspaces
npm install

# Setup the game environment
npm run setup:game
```

### 2. Configure Environment

```bash
# Copy environment templates
cp contracts/.env.example contracts/.env
cp frontend/.env.local.example frontend/.env.local
cp ai/.env.example ai/.env

# Edit the files with your configuration:
# - Add your private key to contracts/.env
# - Set Irys API credentials
# - Configure WalletConnect project ID
```

### 3. Deploy Contracts

```bash
# Deploy to Irys testnet
npm run deploy:testnet

# The script will output contract addresses - save these!
```

### 4. Upload AI Models

```bash
# Upload AI models to Irys
npm run upload-models --workspace=ai

# This creates AI models for guards, merchants, and quest givers
```

### 5. Start the Game

```bash
# Start the frontend development server
npm run dev

# Game will be available at http://localhost:3000
```

## 📁 Project Structure

```
irys-gaming-platform/
├── contracts/              # Smart contracts
│   ├── contracts/
│   │   ├── GameState.sol    # Core game state management
│   │   ├── AINPC.sol        # AI model execution
│   │   ├── Token.sol        # ERC-20 game token
│   │   └── interfaces/      # Irys integration interfaces
│   ├── scripts/             # Deployment scripts
│   ├── test/                # Contract tests
│   └── hardhat.config.js    # Hardhat configuration
├── frontend/                # React/Next.js dApp
│   ├── src/
│   │   ├── app/             # Next.js 13 app directory
│   │   ├── components/      # React components
│   │   │   ├── game/        # Game-specific components
│   │   │   ├── layout/      # Layout components
│   │   │   └── ui/          # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   └── styles/          # Styling files
│   └── tailwind.config.js   # Tailwind CSS config
├── ai/                      # AI models and management
│   ├── src/
│   │   ├── models/          # AI model implementations
│   │   ├── utils/           # Utility functions
│   │   └── IrysModelManager.ts  # Irys integration
│   └── config/              # Model configurations
├── scripts/                 # Deployment and setup scripts
└── docs/                    # Documentation
```

## 🎯 Key Features

### Smart Contracts

- **GameState.sol**: Manages player positions, quest progress, and NPC states
- **AINPC.sol**: Handles AI model storage and execution via IrysVM
- **Token.sol**: ERC-20 token with staking, rewards, and governance features

### AI Integration

- **Decision Trees**: Lightweight models for guard and quest-giver NPCs
- **Neural Networks**: More complex behavior for merchant NPCs
- **Irys Storage**: Models stored permanently with programmable data tags
- **Onchain Execution**: Transparent AI execution via IrysVM

### Frontend Features

- **Cyberpunk UI**: Dark theme with neon accents and glitch effects
- **Interactive Map**: Real-time game world with NPC positions
- **Player Dashboard**: Stats, inventory, and quest tracking
- **NPC Interactions**: Dynamic dialogue and behavior based on AI
- **Token Management**: Balance, staking, and rewards tracking

## 🧪 Testing

### Smart Contract Tests

```bash
# Run contract tests
cd contracts
npm test

# Run with coverage
npm run test:coverage

# Test specific contract
npx hardhat test test/GameState.test.js
```

### Frontend Tests

```bash
# Run frontend tests
cd frontend
npm test

# Run E2E tests (if configured)
npm run test:e2e
```

### AI Model Tests

```bash
# Test AI model functionality
cd ai
npm test

# Benchmark model performance
npm run benchmark
```

## 🚀 Deployment

### Testnet Deployment

```bash
# Deploy to Irys testnet
npm run deploy:testnet

# Upload AI models
npm run upload-models --workspace=ai

# Verify deployment
npm run verify:testnet
```

### Mainnet Deployment

```bash
# Configure mainnet environment
cp contracts/.env.testnet contracts/.env.mainnet
# Edit mainnet configuration

# Deploy to mainnet
npm run deploy:mainnet

# Upload production AI models
ENVIRONMENT=mainnet npm run upload-models --workspace=ai
```

## 🔧 Configuration

### Environment Variables

#### Contracts (.env)
```bash
PRIVATE_KEY=your_private_key_without_0x
IRYS_TESTNET_RPC=https://testnet-rpc.irys.xyz
IRYS_MAINNET_RPC=https://rpc.irys.xyz
IRYS_API_KEY=your_irys_api_key
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_IRYS_TESTNET_RPC=https://testnet-rpc.irys.xyz
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_GAME_STATE_CONTRACT=deployed_contract_address
NEXT_PUBLIC_TOKEN_CONTRACT=deployed_token_address
NEXT_PUBLIC_AINPC_CONTRACT=deployed_ainpc_address
```

#### AI Models (.env)
```bash
PRIVATE_KEY=your_private_key_for_irys_uploads
IRYS_TESTNET_RPC=https://testnet.irys.xyz
```

## 🎮 Game Mechanics

### Player System
- **Registration**: Players register with Irys data ID
- **Movement**: Validated position updates with anti-cheat measures
- **Leveling**: Experience-based progression system
- **Tokens**: Earn and stake IGT tokens for rewards

### Quest System
- **Dynamic Quests**: AI-generated and community-created missions
- **Progression Gates**: Level requirements and dependencies
- **Rewards**: Token rewards with daily limits
- **Permanent Storage**: Quest data stored on Irys

### NPC Behavior
- **AI-Driven**: Behavior determined by onchain AI execution
- **Context-Aware**: NPCs respond to player level, time, and game state
- **Transparent**: All NPC decisions verifiable onchain
- **Upgradeable**: New AI models can be deployed and registered

## 🔮 AI Model Details

### Decision Trees
- **Guard NPCs**: Patrol patterns, threat assessment, dialogue trees
- **Quest Givers**: Mission availability based on player progress
- **Lightweight**: ~50KB models, ~75k gas for execution

### Neural Networks
- **Merchant NPCs**: Dynamic pricing, inventory management
- **Advanced Behavior**: Learning from player interactions
- **Optimized**: Xavier initialization, efficient forward passes

### Model Upload Process
1. Train/create model locally
2. Export to JSON format
3. Upload to Irys with metadata tags
4. Register model ID in smart contract
5. NPCs can now use the model for behavior

## 📊 Token Economics

### IGT Token Distribution
- **Initial Supply**: 10M tokens (10%)
- **Quest Rewards**: 45M tokens (45%)
- **Leaderboards**: 27M tokens (27%)
- **Developer Rewards**: 18M tokens (18%)

### Staking Mechanism
- **Daily Rewards**: 0.5% of staked amount
- **Lock Period**: No minimum, rewards accrue daily
- **Enhanced Rewards**: Stakers get bonus quest rewards

### Anti-Abuse Measures
- **Daily Limits**: 1000 tokens per player per day
- **Movement Validation**: Prevent teleportation exploits
- **Gas Limits**: Prevent expensive AI execution attacks

## 🛠️ Development

### Local Development Setup

```bash
# Install dependencies
npm install

# Start local blockchain
npx hardhat node

# Deploy contracts locally
npm run deploy:local

# Start frontend with hot reload
npm run dev --workspace=frontend

# Upload test AI models
npm run upload-models:local --workspace=ai
```

### Adding New AI Models

1. **Create Model Class**
```typescript
// ai/src/models/MyNewModel.ts
export class MyNewModel {
  execute(input: GameInput): GameOutput {
    // Your AI logic here
  }
  
  export(): string {
    // Return JSON representation
  }
}
```

2. **Upload to Irys**
```typescript
const model = new MyNewModel();
const metadata = { name: "My Model", type: "custom", ... };
const result = await modelManager.uploadModel(model, metadata);
```

3. **Register in Contract**
```solidity
// Update AINPC.sol or call registerAIModel
await aiNPC.registerAIModel(result.modelId, "custom", gasLimit);
```

### Custom Components

```tsx
// frontend/src/components/game/MyComponent.tsx
export function MyComponent() {
  return (
    <div className="cyber-card">
      <h2 className="neon-text">Custom Feature</h2>
      {/* Your component logic */}
    </div>
  );
}
```

## 🔒 Security Considerations

### Smart Contract Security
- **OpenZeppelin**: Using battle-tested contracts for standards
- **Reentrancy Guards**: Protection against reentrancy attacks
- **Access Controls**: Owner-only functions for critical operations
- **Input Validation**: Comprehensive validation of user inputs

### AI Model Security
- **Gas Limits**: Prevent infinite loops in AI execution
- **Model Validation**: Verify model integrity before execution
- **Sandboxed Execution**: AI runs in isolated environment
- **Rate Limiting**: Prevent spam attacks on AI execution

### Frontend Security
- **Wallet Integration**: Secure wallet connection via Web3Modal
- **Input Sanitization**: Prevent XSS and injection attacks
- **Environment Variables**: Sensitive data stored securely
- **HTTPS Only**: Secure communication in production

## 🌐 Irys Integration

### Data Storage
- **Permanent**: All game data stored permanently on Irys
- **Low Cost**: Minimal fees for data storage
- **Instant Access**: Fast retrieval via global CDN
- **Taggable**: Rich metadata for content discovery

### Programmable Data
- **AI Models**: Stored as executable data on Irys
- **IrysVM Execution**: Transparent onchain computation
- **Verifiable**: All AI outputs can be verified
- **Upgradeable**: New models can be deployed seamlessly

### Developer Benefits
- **No Infrastructure**: No need to manage servers or databases
- **Global CDN**: Fast access worldwide
- **Version Control**: Built-in versioning for models and data
- **Composability**: Easy integration with other Irys dApps

## 📈 Monitoring and Analytics

### Contract Events
- **Player Actions**: Movement, quest completion, NPC interactions
- **AI Execution**: Model usage, gas consumption, outputs
- **Token Transfers**: Rewards, staking, trading

### Frontend Analytics
- **User Engagement**: Session time, feature usage
- **Performance**: Load times, error rates
- **Game Metrics**: Player retention, quest completion rates

### AI Model Performance
- **Execution Time**: Monitor model performance
- **Gas Usage**: Optimize for cost efficiency
- **Success Rate**: Track model execution success

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Coding Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow the configured rules
- **Prettier**: Consistent code formatting
- **Tests**: Minimum 80% coverage for new code

## 📚 Resources

### Irys Documentation
- [Irys SDK Documentation](https://docs.irys.xyz/sdks)
- [IrysVM Documentation](https://docs.irys.xyz/irysvm)
- [Programmable Data Guide](https://docs.irys.xyz/programmable-data)

### Development Resources
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Wagmi Documentation](https://wagmi.sh/)

### Community
- [Discord](https://discord.gg/irys)
- [Twitter](https://twitter.com/irys_xyz)
- [GitHub Discussions](https://github.com/irys-xyz/discussions)

## 🐛 Troubleshooting

### Common Issues

#### "Failed to connect to Irys"
- Check your network configuration
- Ensure you have testnet tokens
- Verify API keys are correct

#### "Contract deployment failed"
- Check your private key is valid
- Ensure sufficient balance for gas
- Verify network configuration

#### "AI model upload failed"
- Check Irys account balance
- Verify private key has upload permissions
- Ensure model size is reasonable

#### "Frontend won't start"
- Run `npm install` in frontend directory
- Check environment variables are set
- Verify Node.js version >= 18

### Getting Help

1. Check the [troubleshooting guide](docs/troubleshooting.md)
2. Search [existing issues](https://github.com/your-org/irys-gaming-platform/issues)
3. Join our [Discord community](https://discord.gg/irys)
4. Create a new issue with detailed information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Irys Team**: For the innovative datachain technology
- **OpenZeppelin**: For secure smart contract standards
- **Hardhat Team**: For excellent development tools
- **Next.js Team**: For the powerful React framework
- **Community**: For testing, feedback, and contributions

---

**Built with ❤️ for the future of decentralized gaming**

[🌐 Live Demo](https://irys-gaming-platform.vercel.app) | [📖 Documentation](https://docs.irys-gaming.xyz) | [🐛 Report Issues](https://github.com/your-org/irys-gaming-platform/issues)