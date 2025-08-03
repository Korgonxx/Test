// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IIrysDataStore
 * @dev Interface for interacting with Irys data storage
 * Provides methods to store, retrieve, and verify data on the Irys network
 */
interface IIrysDataStore {
    /**
     * @dev Store data on Irys and return the data ID
     * @param data The data to store
     * @param tags Metadata tags for the data
     * @return dataId The unique identifier for the stored data
     */
    function store(bytes calldata data, string[] calldata tags) external payable returns (string memory dataId);
    
    /**
     * @dev Retrieve data from Irys by data ID
     * @param dataId The unique identifier for the data
     * @return data The retrieved data
     */
    function retrieve(string calldata dataId) external view returns (bytes memory data);
    
    /**
     * @dev Check if data exists on Irys
     * @param dataId The unique identifier for the data
     * @return exists True if the data exists
     */
    function exists(string calldata dataId) external view returns (bool exists);
    
    /**
     * @dev Get the cost to store data of a given size
     * @param dataSize The size of the data in bytes
     * @return cost The cost in wei to store the data
     */
    function getStorageCost(uint256 dataSize) external view returns (uint256 cost);
    
    /**
     * @dev Get metadata for stored data
     * @param dataId The unique identifier for the data
     * @return owner The address that stored the data
     * @return timestamp When the data was stored
     * @return size The size of the data in bytes
     * @return tags Metadata tags associated with the data
     */
    function getMetadata(string calldata dataId) external view returns (
        address owner,
        uint256 timestamp,
        uint256 size,
        string[] memory tags
    );
    
    /**
     * @dev Store JSON data with automatic serialization
     * @param jsonData The JSON data as a string
     * @param tags Metadata tags for the data
     * @return dataId The unique identifier for the stored data
     */
    function storeJSON(string calldata jsonData, string[] calldata tags) external payable returns (string memory dataId);
    
    /**
     * @dev Retrieve JSON data with automatic deserialization
     * @param dataId The unique identifier for the data
     * @return jsonData The retrieved JSON data as a string
     */
    function retrieveJSON(string calldata dataId) external view returns (string memory jsonData);
}