// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IIrysDataStore.sol";

/**
 * @title GameState
 * @dev Manages the core game state including player positions, NPC states, and quest progress
 * Integrates with Irys for permanent data storage and retrieval
 */
contract GameState is Ownable, ReentrancyGuard {
    // Irys data store interface for permanent storage
    IIrysDataStore public immutable irysDataStore;
    
    // Player structure
    struct Player {
        uint256 x;
        uint256 y;
        uint256 level;
        uint256 experience;
        uint256 lastActive;
        bool isActive;
        string irysDataId; // Reference to player data stored on Irys
    }
    
    // Quest structure
    struct Quest {
        uint256 id;
        string name;
        string description;
        uint256 reward;
        bool isActive;
        uint256 requiredLevel;
        string irysDataId; // Quest details stored on Irys
    }
    
    // NPC state structure
    struct NPCState {
        uint256 id;
        uint256 x;
        uint256 y;
        uint256 health;
        uint256 lastInteraction;
        string behaviorModel; // Reference to AI model on Irys
        string currentState; // Current AI state
        bool isActive;
    }
    
    // Mappings
    mapping(address => Player) public players;
    mapping(uint256 => Quest) public quests;
    mapping(uint256 => NPCState) public npcs;
    mapping(address => mapping(uint256 => bool)) public playerQuestCompleted;
    mapping(address => uint256[]) public playerActiveQuests;
    
    // Game configuration
    uint256 public mapWidth = 1000;
    uint256 public mapHeight = 1000;
    uint256 public questCounter = 0;
    uint256 public npcCounter = 0;
    
    // Events for frontend updates
    event PlayerMoved(address indexed player, uint256 x, uint256 y);
    event PlayerRegistered(address indexed player, string irysDataId);
    event QuestCompleted(address indexed player, uint256 questId, uint256 reward);
    event QuestCreated(uint256 indexed questId, string name, uint256 reward);
    event NPCStateUpdated(uint256 indexed npcId, string newState, uint256 x, uint256 y);
    event NPCInteraction(address indexed player, uint256 indexed npcId, string action);
    
    constructor(address _irysDataStore) Ownable(msg.sender) {
        irysDataStore = IIrysDataStore(_irysDataStore);
    }
    
    /**
     * @dev Register a new player in the game
     * @param _irysDataId Reference to player profile data stored on Irys
     */
    function registerPlayer(string calldata _irysDataId) external {
        require(!players[msg.sender].isActive, "Player already registered");
        
        players[msg.sender] = Player({
            x: 500, // Start in center of map
            y: 500,
            level: 1,
            experience: 0,
            lastActive: block.timestamp,
            isActive: true,
            irysDataId: _irysDataId
        });
        
        emit PlayerRegistered(msg.sender, _irysDataId);
    }
    
    /**
     * @dev Update player position with validation
     * @param _x New X coordinate
     * @param _y New Y coordinate
     */
    function updatePlayerPosition(uint256 _x, uint256 _y) external {
        require(players[msg.sender].isActive, "Player not registered");
        require(_x <= mapWidth && _y <= mapHeight, "Position out of bounds");
        
        Player storage player = players[msg.sender];
        
        // Validate movement distance (prevent teleporting)
        uint256 dx = _x > player.x ? _x - player.x : player.x - _x;
        uint256 dy = _y > player.y ? _y - player.y : player.y - _y;
        require(dx <= 10 && dy <= 10, "Movement too large");
        
        player.x = _x;
        player.y = _y;
        player.lastActive = block.timestamp;
        
        emit PlayerMoved(msg.sender, _x, _y);
    }
    
    /**
     * @dev Create a new quest with data stored on Irys
     * @param _name Quest name
     * @param _description Quest description
     * @param _reward Token reward amount
     * @param _requiredLevel Minimum level required
     * @param _irysDataId Reference to detailed quest data on Irys
     */
    function createQuest(
        string calldata _name,
        string calldata _description,
        uint256 _reward,
        uint256 _requiredLevel,
        string calldata _irysDataId
    ) external onlyOwner {
        questCounter++;
        
        quests[questCounter] = Quest({
            id: questCounter,
            name: _name,
            description: _description,
            reward: _reward,
            isActive: true,
            requiredLevel: _requiredLevel,
            irysDataId: _irysDataId
        });
        
        emit QuestCreated(questCounter, _name, _reward);
    }
    
    /**
     * @dev Complete a quest for a player
     * @param _questId Quest identifier
     */
    function completeQuest(uint256 _questId) external nonReentrant {
        require(players[msg.sender].isActive, "Player not registered");
        require(quests[_questId].isActive, "Quest not active");
        require(!playerQuestCompleted[msg.sender][_questId], "Quest already completed");
        require(players[msg.sender].level >= quests[_questId].requiredLevel, "Level too low");
        
        playerQuestCompleted[msg.sender][_questId] = true;
        
        // Award experience and level up if needed
        Player storage player = players[msg.sender];
        player.experience += quests[_questId].reward;
        
        // Simple leveling system
        uint256 newLevel = (player.experience / 100) + 1;
        if (newLevel > player.level) {
            player.level = newLevel;
        }
        
        emit QuestCompleted(msg.sender, _questId, quests[_questId].reward);
    }
    
    /**
     * @dev Create or update NPC state
     * @param _npcId NPC identifier
     * @param _x NPC X position
     * @param _y NPC Y position
     * @param _health NPC health
     * @param _behaviorModel Reference to AI behavior model on Irys
     * @param _currentState Current AI state
     */
    function updateNPCState(
        uint256 _npcId,
        uint256 _x,
        uint256 _y,
        uint256 _health,
        string calldata _behaviorModel,
        string calldata _currentState
    ) external onlyOwner {
        require(_x <= mapWidth && _y <= mapHeight, "Position out of bounds");
        
        if (npcs[_npcId].id == 0) {
            npcCounter++;
            npcs[_npcId].id = _npcId;
        }
        
        NPCState storage npc = npcs[_npcId];
        npc.x = _x;
        npc.y = _y;
        npc.health = _health;
        npc.behaviorModel = _behaviorModel;
        npc.currentState = _currentState;
        npc.isActive = true;
        npc.lastInteraction = block.timestamp;
        
        emit NPCStateUpdated(_npcId, _currentState, _x, _y);
    }
    
    /**
     * @dev Record player interaction with NPC
     * @param _npcId NPC identifier
     * @param _action Action performed
     */
    function interactWithNPC(uint256 _npcId, string calldata _action) external {
        require(players[msg.sender].isActive, "Player not registered");
        require(npcs[_npcId].isActive, "NPC not active");
        
        // Update NPC last interaction time
        npcs[_npcId].lastInteraction = block.timestamp;
        
        emit NPCInteraction(msg.sender, _npcId, _action);
    }
    
    /**
     * @dev Get player information
     */
    function getPlayer(address _player) external view returns (Player memory) {
        return players[_player];
    }
    
    /**
     * @dev Get quest information
     */
    function getQuest(uint256 _questId) external view returns (Quest memory) {
        return quests[_questId];
    }
    
    /**
     * @dev Get NPC state
     */
    function getNPC(uint256 _npcId) external view returns (NPCState memory) {
        return npcs[_npcId];
    }
    
    /**
     * @dev Get active quests for a player
     */
    function getPlayerActiveQuests(address _player) external view returns (uint256[] memory) {
        return playerActiveQuests[_player];
    }
    
    /**
     * @dev Check if player completed a quest
     */
    function isQuestCompleted(address _player, uint256 _questId) external view returns (bool) {
        return playerQuestCompleted[_player][_questId];
    }
    
    /**
     * @dev Update map dimensions (owner only)
     */
    function updateMapDimensions(uint256 _width, uint256 _height) external onlyOwner {
        mapWidth = _width;
        mapHeight = _height;
    }
    
    /**
     * @dev Emergency pause for NPC
     */
    function pauseNPC(uint256 _npcId) external onlyOwner {
        npcs[_npcId].isActive = false;
    }
}