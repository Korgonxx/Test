// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IIrysVM.sol";
import "./interfaces/IIrysDataStore.sol";

/**
 * @title AINPC
 * @dev Handles storage and execution of AI models for NPC behavior using Irys programmable data
 * Executes AI models onchain via IrysVM for transparent and verifiable NPC behavior
 */
contract AINPC is Ownable, ReentrancyGuard {
    // Irys VM interface for executing AI models
    IIrysVM public immutable irysVM;
    IIrysDataStore public immutable irysDataStore;
    
    // AI Model structure
    struct AIModel {
        string modelId; // Irys data ID for the model
        string modelType; // "decision_tree", "neural_network", etc.
        uint256 version;
        address creator;
        bool isActive;
        uint256 gasLimit; // Gas limit for execution
        uint256 executionCount;
        mapping(string => string) parameters; // Model parameters
    }
    
    // NPC AI State
    struct NPCAIState {
        uint256 npcId;
        string currentModelId;
        string lastOutput;
        uint256 lastExecution;
        uint256 executionCount;
        mapping(string => uint256) stateVariables; // Internal AI state
    }
    
    // Execution request
    struct ExecutionRequest {
        uint256 npcId;
        string input;
        address requester;
        uint256 timestamp;
        bool completed;
        string output;
    }
    
    // Mappings
    mapping(string => AIModel) public aiModels;
    mapping(uint256 => NPCAIState) public npcStates;
    mapping(uint256 => ExecutionRequest) public executionRequests;
    mapping(address => bool) public authorizedExecutors;
    
    // Counters
    uint256 public modelCounter = 0;
    uint256 public executionCounter = 0;
    
    // Events
    event ModelRegistered(string indexed modelId, string modelType, address creator);
    event ModelExecuted(string indexed modelId, uint256 indexed npcId, string input, string output);
    event NPCStateUpdated(uint256 indexed npcId, string newState);
    event ExecutionRequested(uint256 indexed requestId, uint256 npcId, string input);
    event ExecutionCompleted(uint256 indexed requestId, string output);
    
    constructor(address _irysVM, address _irysDataStore) Ownable(msg.sender) {
        irysVM = IIrysVM(_irysVM);
        irysDataStore = IIrysDataStore(_irysDataStore);
        authorizedExecutors[msg.sender] = true;
    }
    
    /**
     * @dev Register a new AI model stored on Irys
     * @param _modelId Irys data ID containing the model
     * @param _modelType Type of AI model
     * @param _gasLimit Gas limit for model execution
     */
    function registerAIModel(
        string calldata _modelId,
        string calldata _modelType,
        uint256 _gasLimit
    ) external {
        require(bytes(_modelId).length > 0, "Invalid model ID");
        require(!aiModels[_modelId].isActive, "Model already exists");
        require(_gasLimit > 0 && _gasLimit <= 1000000, "Invalid gas limit");
        
        // Verify model exists on Irys
        require(irysDataStore.exists(_modelId), "Model not found on Irys");
        
        AIModel storage model = aiModels[_modelId];
        model.modelId = _modelId;
        model.modelType = _modelType;
        model.version = 1;
        model.creator = msg.sender;
        model.isActive = true;
        model.gasLimit = _gasLimit;
        model.executionCount = 0;
        
        modelCounter++;
        
        emit ModelRegistered(_modelId, _modelType, msg.sender);
    }
    
    /**
     * @dev Execute AI model for NPC behavior
     * @param _npcId NPC identifier
     * @param _modelId AI model to execute
     * @param _input Input data for the model (JSON string)
     */
    function executeAIModel(
        uint256 _npcId,
        string calldata _modelId,
        string calldata _input
    ) external nonReentrant returns (string memory) {
        require(authorizedExecutors[msg.sender], "Not authorized");
        require(aiModels[_modelId].isActive, "Model not active");
        require(bytes(_input).length > 0, "Invalid input");
        
        AIModel storage model = aiModels[_modelId];
        NPCAIState storage npcState = npcStates[_npcId];
        
        // Create execution request
        executionCounter++;
        ExecutionRequest storage request = executionRequests[executionCounter];
        request.npcId = _npcId;
        request.input = _input;
        request.requester = msg.sender;
        request.timestamp = block.timestamp;
        request.completed = false;
        
        emit ExecutionRequested(executionCounter, _npcId, _input);
        
        // Execute model via IrysVM
        try irysVM.execute{gas: model.gasLimit}(_modelId, _input) returns (bytes memory result) {
            string memory output = string(result);
            
            // Update execution request
            request.output = output;
            request.completed = true;
            
            // Update NPC state
            npcState.npcId = _npcId;
            npcState.currentModelId = _modelId;
            npcState.lastOutput = output;
            npcState.lastExecution = block.timestamp;
            npcState.executionCount++;
            
            // Update model stats
            model.executionCount++;
            
            emit ExecutionCompleted(executionCounter, output);
            emit ModelExecuted(_modelId, _npcId, _input, output);
            
            return output;
        } catch Error(string memory reason) {
            request.output = string(abi.encodePacked("ERROR: ", reason));
            request.completed = true;
            
            emit ExecutionCompleted(executionCounter, request.output);
            
            return request.output;
        }
    }
    
    /**
     * @dev Batch execute multiple AI models for efficiency
     * @param _npcIds Array of NPC identifiers
     * @param _modelIds Array of model IDs
     * @param _inputs Array of input data
     */
    function batchExecuteAI(
        uint256[] calldata _npcIds,
        string[] calldata _modelIds,
        string[] calldata _inputs
    ) external nonReentrant returns (string[] memory outputs) {
        require(authorizedExecutors[msg.sender], "Not authorized");
        require(_npcIds.length == _modelIds.length && _modelIds.length == _inputs.length, "Array length mismatch");
        require(_npcIds.length <= 10, "Too many executions");
        
        outputs = new string[](_npcIds.length);
        
        for (uint256 i = 0; i < _npcIds.length; i++) {
            outputs[i] = executeAIModel(_npcIds[i], _modelIds[i], _inputs[i]);
        }
        
        return outputs;
    }
    
    /**
     * @dev Update NPC AI state variables
     * @param _npcId NPC identifier
     * @param _key State variable key
     * @param _value State variable value
     */
    function updateNPCStateVariable(
        uint256 _npcId,
        string calldata _key,
        uint256 _value
    ) external {
        require(authorizedExecutors[msg.sender], "Not authorized");
        
        npcStates[_npcId].stateVariables[_key] = _value;
        
        emit NPCStateUpdated(_npcId, string(abi.encodePacked(_key, ":", _value)));
    }
    
    /**
     * @dev Set model parameters
     * @param _modelId Model identifier
     * @param _key Parameter key
     * @param _value Parameter value
     */
    function setModelParameter(
        string calldata _modelId,
        string calldata _key,
        string calldata _value
    ) external {
        require(aiModels[_modelId].creator == msg.sender || owner() == msg.sender, "Not authorized");
        require(aiModels[_modelId].isActive, "Model not active");
        
        aiModels[_modelId].parameters[_key] = _value;
    }
    
    /**
     * @dev Get model information
     */
    function getModel(string calldata _modelId) external view returns (
        string memory modelType,
        uint256 version,
        address creator,
        bool isActive,
        uint256 gasLimit,
        uint256 executionCount
    ) {
        AIModel storage model = aiModels[_modelId];
        return (
            model.modelType,
            model.version,
            model.creator,
            model.isActive,
            model.gasLimit,
            model.executionCount
        );
    }
    
    /**
     * @dev Get NPC AI state
     */
    function getNPCState(uint256 _npcId) external view returns (
        string memory currentModelId,
        string memory lastOutput,
        uint256 lastExecution,
        uint256 executionCount
    ) {
        NPCAIState storage state = npcStates[_npcId];
        return (
            state.currentModelId,
            state.lastOutput,
            state.lastExecution,
            state.executionCount
        );
    }
    
    /**
     * @dev Get execution request details
     */
    function getExecutionRequest(uint256 _requestId) external view returns (ExecutionRequest memory) {
        return executionRequests[_requestId];
    }
    
    /**
     * @dev Get NPC state variable
     */
    function getNPCStateVariable(uint256 _npcId, string calldata _key) external view returns (uint256) {
        return npcStates[_npcId].stateVariables[_key];
    }
    
    /**
     * @dev Get model parameter
     */
    function getModelParameter(string calldata _modelId, string calldata _key) external view returns (string memory) {
        return aiModels[_modelId].parameters[_key];
    }
    
    /**
     * @dev Authorize executor
     */
    function setAuthorizedExecutor(address _executor, bool _authorized) external onlyOwner {
        authorizedExecutors[_executor] = _authorized;
    }
    
    /**
     * @dev Deactivate model
     */
    function deactivateModel(string calldata _modelId) external {
        require(aiModels[_modelId].creator == msg.sender || owner() == msg.sender, "Not authorized");
        aiModels[_modelId].isActive = false;
    }
    
    /**
     * @dev Update model version
     */
    function updateModelVersion(string calldata _modelId, uint256 _version) external {
        require(aiModels[_modelId].creator == msg.sender || owner() == msg.sender, "Not authorized");
        aiModels[_modelId].version = _version;
    }
}