const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GameState Contract", function () {
  let gameState;
  let owner;
  let player;
  let otherPlayer;
  let mockIrysDataStore;

  beforeEach(async function () {
    [owner, player, otherPlayer] = await ethers.getSigners();

    // Deploy mock Irys data store
    const MockIrysDataStore = await ethers.getContractFactory("MockContract");
    mockIrysDataStore = await MockIrysDataStore.deploy();
    await mockIrysDataStore.waitForDeployment();

    // Deploy GameState contract
    const GameState = await ethers.getContractFactory("GameState");
    gameState = await GameState.deploy(await mockIrysDataStore.getAddress());
    await gameState.waitForDeployment();
  });

  describe("Player Management", function () {
    it("Should allow player registration", async function () {
      const irysDataId = "player-data-123";
      
      await gameState.connect(player).registerPlayer(irysDataId);
      
      const playerData = await gameState.getPlayer(player.address);
      expect(playerData.isActive).to.be.true;
      expect(playerData.x).to.equal(500);
      expect(playerData.y).to.equal(500);
      expect(playerData.level).to.equal(1);
      expect(playerData.irysDataId).to.equal(irysDataId);
    });

    it("Should prevent duplicate player registration", async function () {
      await gameState.connect(player).registerPlayer("data-1");
      
      await expect(
        gameState.connect(player).registerPlayer("data-2")
      ).to.be.revertedWith("Player already registered");
    });

    it("Should allow player position updates", async function () {
      await gameState.connect(player).registerPlayer("data-1");
      
      const newX = 510;
      const newY = 495;
      
      await gameState.connect(player).updatePlayerPosition(newX, newY);
      
      const playerData = await gameState.getPlayer(player.address);
      expect(playerData.x).to.equal(newX);
      expect(playerData.y).to.equal(newY);
    });

    it("Should prevent large position movements", async function () {
      await gameState.connect(player).registerPlayer("data-1");
      
      await expect(
        gameState.connect(player).updatePlayerPosition(600, 600)
      ).to.be.revertedWith("Movement too large");
    });

    it("Should prevent out-of-bounds movements", async function () {
      await gameState.connect(player).registerPlayer("data-1");
      
      await expect(
        gameState.connect(player).updatePlayerPosition(1500, 1500)
      ).to.be.revertedWith("Position out of bounds");
    });
  });

  describe("Quest Management", function () {
    beforeEach(async function () {
      await gameState.connect(player).registerPlayer("player-data");
    });

    it("Should allow owner to create quests", async function () {
      const questData = {
        name: "Test Quest",
        description: "A test quest",
        reward: 100,
        requiredLevel: 1,
        irysDataId: "quest-data-1"
      };

      await gameState.createQuest(
        questData.name,
        questData.description,
        questData.reward,
        questData.requiredLevel,
        questData.irysDataId
      );

      const quest = await gameState.getQuest(1);
      expect(quest.name).to.equal(questData.name);
      expect(quest.reward).to.equal(questData.reward);
      expect(quest.isActive).to.be.true;
    });

    it("Should prevent non-owner from creating quests", async function () {
      await expect(
        gameState.connect(player).createQuest("Test", "Test", 100, 1, "data")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow quest completion", async function () {
      // Create a quest
      await gameState.createQuest("Test Quest", "Description", 100, 1, "data");
      
      // Complete the quest
      await gameState.connect(player).completeQuest(1);
      
      // Check completion status
      const isCompleted = await gameState.isQuestCompleted(player.address, 1);
      expect(isCompleted).to.be.true;
      
      // Check player experience increased
      const playerData = await gameState.getPlayer(player.address);
      expect(playerData.experience).to.equal(100);
    });

    it("Should prevent duplicate quest completion", async function () {
      await gameState.createQuest("Test Quest", "Description", 100, 1, "data");
      await gameState.connect(player).completeQuest(1);
      
      await expect(
        gameState.connect(player).completeQuest(1)
      ).to.be.revertedWith("Quest already completed");
    });

    it("Should prevent quest completion with insufficient level", async function () {
      await gameState.createQuest("Hard Quest", "Description", 100, 5, "data");
      
      await expect(
        gameState.connect(player).completeQuest(1)
      ).to.be.revertedWith("Level too low");
    });
  });

  describe("NPC Management", function () {
    it("Should allow owner to update NPC state", async function () {
      const npcData = {
        id: 1,
        x: 300,
        y: 400,
        health: 85,
        behaviorModel: "guard-model",
        currentState: "patrol"
      };

      await gameState.updateNPCState(
        npcData.id,
        npcData.x,
        npcData.y,
        npcData.health,
        npcData.behaviorModel,
        npcData.currentState
      );

      const npc = await gameState.getNPC(npcData.id);
      expect(npc.x).to.equal(npcData.x);
      expect(npc.y).to.equal(npcData.y);
      expect(npc.health).to.equal(npcData.health);
      expect(npc.isActive).to.be.true;
    });

    it("Should prevent non-owner from updating NPC state", async function () {
      await expect(
        gameState.connect(player).updateNPCState(1, 100, 100, 100, "model", "state")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow player NPC interaction", async function () {
      await gameState.connect(player).registerPlayer("data");
      await gameState.updateNPCState(1, 300, 300, 100, "model", "idle");
      
      await expect(
        gameState.connect(player).interactWithNPC(1, "talk")
      ).to.emit(gameState, "NPCInteraction")
      .withArgs(player.address, 1, "talk");
    });

    it("Should prevent interaction with inactive NPCs", async function () {
      await gameState.connect(player).registerPlayer("data");
      await gameState.updateNPCState(1, 300, 300, 100, "model", "idle");
      await gameState.pauseNPC(1);
      
      await expect(
        gameState.connect(player).interactWithNPC(1, "talk")
      ).to.be.revertedWith("NPC not active");
    });
  });

  describe("Events", function () {
    it("Should emit PlayerRegistered event", async function () {
      const irysDataId = "player-data-123";
      
      await expect(
        gameState.connect(player).registerPlayer(irysDataId)
      ).to.emit(gameState, "PlayerRegistered")
      .withArgs(player.address, irysDataId);
    });

    it("Should emit PlayerMoved event", async function () {
      await gameState.connect(player).registerPlayer("data");
      
      await expect(
        gameState.connect(player).updatePlayerPosition(505, 495)
      ).to.emit(gameState, "PlayerMoved")
      .withArgs(player.address, 505, 495);
    });

    it("Should emit QuestCompleted event", async function () {
      await gameState.connect(player).registerPlayer("data");
      await gameState.createQuest("Test", "Desc", 100, 1, "data");
      
      await expect(
        gameState.connect(player).completeQuest(1)
      ).to.emit(gameState, "QuestCompleted")
      .withArgs(player.address, 1, 100);
    });
  });

  describe("Map Configuration", function () {
    it("Should allow owner to update map dimensions", async function () {
      const newWidth = 2000;
      const newHeight = 1500;
      
      await gameState.updateMapDimensions(newWidth, newHeight);
      
      const width = await gameState.mapWidth();
      const height = await gameState.mapHeight();
      
      expect(width).to.equal(newWidth);
      expect(height).to.equal(newHeight);
    });

    it("Should prevent non-owner from updating map dimensions", async function () {
      await expect(
        gameState.connect(player).updateMapDimensions(2000, 1500)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Level System", function () {
    it("Should level up player when experience threshold is reached", async function () {
      await gameState.connect(player).registerPlayer("data");
      
      // Create quest that gives enough experience to level up
      await gameState.createQuest("Big Quest", "Desc", 150, 1, "data");
      await gameState.connect(player).completeQuest(1);
      
      const playerData = await gameState.getPlayer(player.address);
      expect(playerData.level).to.equal(2); // Should level up to 2
      expect(playerData.experience).to.equal(150);
    });
  });
});

// Mock contract for testing
const MockContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockContract {
    function exists(string calldata) external pure returns (bool) {
        return true;
    }
}
`;