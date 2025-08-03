// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IIrysVM
 * @dev Interface for executing programmable data on IrysVM
 * Enables onchain execution of AI models and other computational tasks
 */
interface IIrysVM {
    /**
     * @dev Execute programmable data stored on Irys
     * @param dataId The Irys data ID containing the executable code/model
     * @param input Input data for the execution (typically JSON)
     * @return output The execution result
     */
    function execute(string calldata dataId, string calldata input) external returns (bytes memory output);
    
    /**
     * @dev Execute programmable data with gas limit
     * @param dataId The Irys data ID containing the executable code/model
     * @param input Input data for the execution
     * @param gasLimit Maximum gas to use for execution
     * @return output The execution result
     */
    function executeWithGasLimit(
        string calldata dataId, 
        string calldata input, 
        uint256 gasLimit
    ) external returns (bytes memory output);
    
    /**
     * @dev Batch execute multiple programmable data items
     * @param dataIds Array of Irys data IDs
     * @param inputs Array of input data
     * @return outputs Array of execution results
     */
    function batchExecute(
        string[] calldata dataIds, 
        string[] calldata inputs
    ) external returns (bytes[] memory outputs);
    
    /**
     * @dev Get execution cost estimate
     * @param dataId The Irys data ID to estimate execution cost for
     * @param input Input data size for cost calculation
     * @return cost The estimated cost in gas
     */
    function getExecutionCost(string calldata dataId, string calldata input) external view returns (uint256 cost);
    
    /**
     * @dev Verify if programmable data is executable
     * @param dataId The Irys data ID to verify
     * @return isExecutable True if the data can be executed
     * @return executableType The type of executable (e.g., "wasm", "ai_model")
     */
    function verifyExecutable(string calldata dataId) external view returns (bool isExecutable, string memory executableType);
    
    /**
     * @dev Get execution environment information
     * @return version The IrysVM version
     * @return supportedTypes Array of supported executable types
     * @return maxGasPerExecution Maximum gas per single execution
     */
    function getExecutionEnvironment() external view returns (
        string memory version,
        string[] memory supportedTypes,
        uint256 maxGasPerExecution
    );
    
    /**
     * @dev Execute with timeout
     * @param dataId The Irys data ID containing the executable code/model
     * @param input Input data for the execution
     * @param timeoutSeconds Maximum execution time in seconds
     * @return output The execution result
     * @return executionTime Actual execution time in milliseconds
     */
    function executeWithTimeout(
        string calldata dataId,
        string calldata input,
        uint256 timeoutSeconds
    ) external returns (bytes memory output, uint256 executionTime);
}