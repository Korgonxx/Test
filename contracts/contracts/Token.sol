// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IrysGameToken (IGT)
 * @dev ERC-20 token for the Irys gaming platform
 * Used for quest rewards, marketplace transactions, and community incentives
 */
contract IrysGameToken is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
    // Maximum supply of tokens (100 million)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    
    // Reward pools
    uint256 public questRewardPool;
    uint256 public leaderboardRewardPool;
    uint256 public developerRewardPool;
    
    // Authorized minters (game contracts)
    mapping(address => bool) public authorizedMinters;
    mapping(address => uint256) public minterAllowances;
    
    // Player rewards tracking
    mapping(address => uint256) public playerTotalRewards;
    mapping(address => uint256) public playerQuestRewards;
    mapping(address => uint256) public playerLeaderboardRewards;
    
    // Developer rewards
    mapping(address => uint256) public developerContributions;
    mapping(address => uint256) public developerRewards;
    
    // Staking for enhanced rewards
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public pendingStakingRewards;
    
    // Daily reward limits to prevent abuse
    mapping(address => mapping(uint256 => uint256)) public dailyRewards;
    uint256 public constant MAX_DAILY_REWARDS = 1000 * 10**18; // 1000 tokens per day
    
    // Events
    event RewardsDistributed(address indexed recipient, uint256 amount, string rewardType);
    event TokensStaked(address indexed staker, uint256 amount);
    event TokensUnstaked(address indexed staker, uint256 amount, uint256 rewards);
    event MinterAuthorized(address indexed minter, uint256 allowance);
    event DeveloperRewarded(address indexed developer, uint256 amount, string contribution);
    event PoolsUpdated(uint256 questPool, uint256 leaderboardPool, uint256 developerPool);
    
    constructor() ERC20("IrysGameToken", "IGT") Ownable(msg.sender) {
        // Initial distribution
        uint256 initialSupply = 10_000_000 * 10**18; // 10% initial supply
        _mint(msg.sender, initialSupply);
        
        // Initialize reward pools (remaining 90% of max supply)
        uint256 remainingSupply = MAX_SUPPLY - initialSupply;
        questRewardPool = (remainingSupply * 50) / 100; // 50% for quests
        leaderboardRewardPool = (remainingSupply * 30) / 100; // 30% for leaderboards
        developerRewardPool = (remainingSupply * 20) / 100; // 20% for developers
    }
    
    /**
     * @dev Mint tokens for quest rewards
     * @param _to Recipient address
     * @param _amount Amount to mint
     */
    function mintQuestReward(address _to, uint256 _amount) external nonReentrant {
        require(authorizedMinters[msg.sender], "Not authorized minter");
        require(minterAllowances[msg.sender] >= _amount, "Insufficient minter allowance");
        require(questRewardPool >= _amount, "Insufficient quest reward pool");
        require(_canReceiveDailyReward(_to, _amount), "Daily reward limit exceeded");
        
        // Update pools and allowances
        questRewardPool -= _amount;
        minterAllowances[msg.sender] -= _amount;
        
        // Update player tracking
        playerTotalRewards[_to] += _amount;
        playerQuestRewards[_to] += _amount;
        
        // Update daily rewards
        uint256 today = block.timestamp / 1 days;
        dailyRewards[_to][today] += _amount;
        
        _mint(_to, _amount);
        
        emit RewardsDistributed(_to, _amount, "quest");
    }
    
    /**
     * @dev Mint tokens for leaderboard rewards
     * @param _recipients Array of recipient addresses
     * @param _amounts Array of amounts to mint
     */
    function mintLeaderboardRewards(
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external onlyOwner nonReentrant {
        require(_recipients.length == _amounts.length, "Array length mismatch");
        require(_recipients.length <= 100, "Too many recipients");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }
        
        require(leaderboardRewardPool >= totalAmount, "Insufficient leaderboard pool");
        leaderboardRewardPool -= totalAmount;
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            uint256 amount = _amounts[i];
            
            if (_canReceiveDailyReward(recipient, amount)) {
                playerTotalRewards[recipient] += amount;
                playerLeaderboardRewards[recipient] += amount;
                
                uint256 today = block.timestamp / 1 days;
                dailyRewards[recipient][today] += amount;
                
                _mint(recipient, amount);
                
                emit RewardsDistributed(recipient, amount, "leaderboard");
            }
        }
    }
    
    /**
     * @dev Mint tokens for developer contributions
     * @param _developer Developer address
     * @param _amount Amount to mint
     * @param _contribution Description of contribution
     */
    function mintDeveloperReward(
        address _developer,
        uint256 _amount,
        string calldata _contribution
    ) external onlyOwner nonReentrant {
        require(developerRewardPool >= _amount, "Insufficient developer pool");
        require(_canReceiveDailyReward(_developer, _amount), "Daily reward limit exceeded");
        
        developerRewardPool -= _amount;
        developerContributions[_developer] += 1;
        developerRewards[_developer] += _amount;
        
        uint256 today = block.timestamp / 1 days;
        dailyRewards[_developer][today] += _amount;
        
        _mint(_developer, _amount);
        
        emit DeveloperRewarded(_developer, _amount, _contribution);
    }
    
    /**
     * @dev Stake tokens for enhanced rewards
     * @param _amount Amount to stake
     */
    function stakeTokens(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Invalid amount");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        
        // Claim any pending staking rewards
        _claimStakingRewards();
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), _amount);
        
        stakedBalances[msg.sender] += _amount;
        stakingTimestamp[msg.sender] = block.timestamp;
        
        emit TokensStaked(msg.sender, _amount);
    }
    
    /**
     * @dev Unstake tokens and claim rewards
     * @param _amount Amount to unstake
     */
    function unstakeTokens(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Invalid amount");
        require(stakedBalances[msg.sender] >= _amount, "Insufficient staked balance");
        
        // Calculate and claim staking rewards
        uint256 rewards = _calculateStakingRewards(msg.sender);
        _claimStakingRewards();
        
        stakedBalances[msg.sender] -= _amount;
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, _amount);
        
        emit TokensUnstaked(msg.sender, _amount, rewards);
    }
    
    /**
     * @dev Claim staking rewards
     */
    function claimStakingRewards() external nonReentrant {
        _claimStakingRewards();
    }
    
    /**
     * @dev Internal function to claim staking rewards
     */
    function _claimStakingRewards() internal {
        uint256 rewards = _calculateStakingRewards(msg.sender);
        
        if (rewards > 0 && questRewardPool >= rewards) {
            questRewardPool -= rewards;
            pendingStakingRewards[msg.sender] = 0;
            stakingTimestamp[msg.sender] = block.timestamp;
            
            _mint(msg.sender, rewards);
            
            emit RewardsDistributed(msg.sender, rewards, "staking");
        }
    }
    
    /**
     * @dev Calculate staking rewards for a user
     * @param _staker Staker address
     */
    function _calculateStakingRewards(address _staker) internal view returns (uint256) {
        if (stakedBalances[_staker] == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - stakingTimestamp[_staker];
        uint256 dailyRewardRate = 50; // 0.5% daily (50 basis points)
        
        // Calculate rewards: (stakedAmount * rate * duration) / (100 * 1 day)
        uint256 rewards = (stakedBalances[_staker] * dailyRewardRate * stakingDuration) / (10000 * 1 days);
        
        return rewards + pendingStakingRewards[_staker];
    }
    
    /**
     * @dev Check if user can receive daily reward
     * @param _user User address
     * @param _amount Amount to check
     */
    function _canReceiveDailyReward(address _user, uint256 _amount) internal view returns (bool) {
        uint256 today = block.timestamp / 1 days;
        return dailyRewards[_user][today] + _amount <= MAX_DAILY_REWARDS;
    }
    
    /**
     * @dev Authorize a minter with allowance
     * @param _minter Minter address
     * @param _allowance Minting allowance
     */
    function authorizeMinter(address _minter, uint256 _allowance) external onlyOwner {
        authorizedMinters[_minter] = true;
        minterAllowances[_minter] = _allowance;
        
        emit MinterAuthorized(_minter, _allowance);
    }
    
    /**
     * @dev Revoke minter authorization
     * @param _minter Minter address
     */
    function revokeMinter(address _minter) external onlyOwner {
        authorizedMinters[_minter] = false;
        minterAllowances[_minter] = 0;
    }
    
    /**
     * @dev Update reward pools
     * @param _questPool New quest pool amount
     * @param _leaderboardPool New leaderboard pool amount
     * @param _developerPool New developer pool amount
     */
    function updateRewardPools(
        uint256 _questPool,
        uint256 _leaderboardPool,
        uint256 _developerPool
    ) external onlyOwner {
        require(_questPool + _leaderboardPool + _developerPool <= MAX_SUPPLY - totalSupply(), "Exceeds max supply");
        
        questRewardPool = _questPool;
        leaderboardRewardPool = _leaderboardPool;
        developerRewardPool = _developerPool;
        
        emit PoolsUpdated(_questPool, _leaderboardPool, _developerPool);
    }
    
    /**
     * @dev Get user staking information
     * @param _user User address
     */
    function getStakingInfo(address _user) external view returns (
        uint256 stakedAmount,
        uint256 stakingTime,
        uint256 pendingRewards
    ) {
        return (
            stakedBalances[_user],
            stakingTimestamp[_user],
            _calculateStakingRewards(_user)
        );
    }
    
    /**
     * @dev Get daily rewards for user
     * @param _user User address
     * @param _day Day timestamp
     */
    function getDailyRewards(address _user, uint256 _day) external view returns (uint256) {
        return dailyRewards[_user][_day];
    }
    
    /**
     * @dev Get current day's rewards for user
     * @param _user User address
     */
    function getTodayRewards(address _user) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        return dailyRewards[_user][today];
    }
    
    /**
     * @dev Override to prevent transfers to contract address
     */
    function _update(address from, address to, uint256 value) internal virtual override {
        if (to == address(this) && from != address(0) && msg.sig != this.stakeTokens.selector) {
            revert("Direct transfers to contract not allowed");
        }
        super._update(from, to, value);
    }
}