/**
 * Simple Decision Tree implementation for NPC behavior
 * Designed to be lightweight and suitable for onchain execution
 */

export interface DecisionNode {
  id: string;
  condition?: {
    attribute: string;
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    value: any;
  };
  action?: string;
  children?: DecisionNode[];
  probability?: number; // For random decisions
}

export interface NPCInput {
  playerDistance: number;
  playerLevel: number;
  playerHealth: number;
  npcHealth: number;
  lastAction: string;
  timeOfDay: number; // 0-23
  gameState: {
    questActive: boolean;
    combatMode: boolean;
    playerHostile: boolean;
  };
}

export interface NPCOutput {
  action: string;
  dialogue?: string;
  movement?: {
    direction: string;
    distance: number;
  };
  targetPlayer?: boolean;
  priority: number;
}

export class DecisionTree {
  private root: DecisionNode;
  private modelId: string;

  constructor(modelId: string, root: DecisionNode) {
    this.modelId = modelId;
    this.root = root;
  }

  /**
   * Execute the decision tree with given input
   */
  execute(input: NPCInput): NPCOutput {
    const result = this.traverseTree(this.root, input);
    return this.parseAction(result, input);
  }

  /**
   * Traverse the decision tree recursively
   */
  private traverseTree(node: DecisionNode, input: NPCInput): string {
    // If leaf node, return the action
    if (!node.children || node.children.length === 0) {
      return node.action || 'idle';
    }

    // If no condition, use probability-based selection
    if (!node.condition) {
      const randomChild = this.selectRandomChild(node.children);
      return this.traverseTree(randomChild, input);
    }

    // Evaluate condition
    const conditionMet = this.evaluateCondition(node.condition, input);
    
    if (conditionMet && node.children.length > 0) {
      return this.traverseTree(node.children[0], input);
    } else if (!conditionMet && node.children.length > 1) {
      return this.traverseTree(node.children[1], input);
    }

    return node.action || 'idle';
  }

  /**
   * Evaluate a condition against the input
   */
  private evaluateCondition(condition: any, input: NPCInput): boolean {
    const value = this.getValueFromInput(condition.attribute, input);
    
    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'gt':
        return value > condition.value;
      case 'lt':
        return value < condition.value;
      case 'gte':
        return value >= condition.value;
      case 'lte':
        return value <= condition.value;
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value);
      default:
        return false;
    }
  }

  /**
   * Extract value from input based on attribute path
   */
  private getValueFromInput(attribute: string, input: NPCInput): any {
    const parts = attribute.split('.');
    let value: any = input;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Select a random child based on probability weights
   */
  private selectRandomChild(children: DecisionNode[]): DecisionNode {
    const totalProbability = children.reduce((sum, child) => sum + (child.probability || 1), 0);
    const random = Math.random() * totalProbability;
    
    let accumulated = 0;
    for (const child of children) {
      accumulated += child.probability || 1;
      if (random <= accumulated) {
        return child;
      }
    }
    
    return children[children.length - 1];
  }

  /**
   * Parse action string into NPCOutput
   */
  private parseAction(actionString: string, input: NPCInput): NPCOutput {
    const parts = actionString.split(':');
    const action = parts[0];
    const params = parts.slice(1);

    const output: NPCOutput = {
      action,
      priority: this.getActionPriority(action)
    };

    switch (action) {
      case 'dialogue':
        output.dialogue = this.getDialogue(params[0] || 'greeting', input);
        break;
      
      case 'move':
        output.movement = {
          direction: params[0] || 'random',
          distance: parseInt(params[1]) || 1
        };
        break;
      
      case 'attack':
        output.targetPlayer = true;
        output.dialogue = 'You look like trouble!';
        break;
      
      case 'flee':
        output.movement = {
          direction: 'away',
          distance: 3
        };
        output.dialogue = 'I must retreat!';
        break;
      
      case 'patrol':
        output.movement = {
          direction: 'patrol',
          distance: 2
        };
        break;
      
      case 'guard':
        output.dialogue = 'This area is protected.';
        break;
      
      case 'trade':
        output.dialogue = 'Want to see my wares?';
        break;
      
      case 'quest':
        output.dialogue = this.getQuestDialogue(input);
        break;
    }

    return output;
  }

  /**
   * Get dialogue based on context
   */
  private getDialogue(type: string, input: NPCInput): string {
    const dialogues = {
      greeting: [
        'Hello there, traveler!',
        'Greetings, adventurer.',
        'Well met!',
        'Good day to you.'
      ],
      warning: [
        'Be careful out there.',
        'Danger lurks ahead.',
        'Watch your step.',
        'Stay alert.'
      ],
      hostile: [
        'You don\'t belong here!',
        'Turn back now!',
        'You dare approach?',
        'This is your final warning!'
      ],
      friendly: [
        'Nice to see a friendly face.',
        'How can I help you?',
        'Welcome to our town.',
        'It\'s a beautiful day, isn\'t it?'
      ]
    };

    const options = dialogues[type] || dialogues.greeting;
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Get quest-related dialogue
   */
  private getQuestDialogue(input: NPCInput): string {
    if (input.gameState.questActive) {
      return 'How goes your quest, hero?';
    } else {
      return 'I have a task that needs doing. Interested?';
    }
  }

  /**
   * Get action priority for conflict resolution
   */
  private getActionPriority(action: string): number {
    const priorities = {
      attack: 10,
      flee: 9,
      guard: 8,
      dialogue: 7,
      quest: 6,
      trade: 5,
      move: 4,
      patrol: 3,
      idle: 1
    };

    return priorities[action] || 1;
  }

  /**
   * Export the decision tree as JSON for storage on Irys
   */
  export(): string {
    return JSON.stringify({
      modelId: this.modelId,
      type: 'decision_tree',
      version: '1.0',
      root: this.root,
      metadata: {
        created: new Date().toISOString(),
        inputSchema: 'NPCInput',
        outputSchema: 'NPCOutput'
      }
    });
  }

  /**
   * Import a decision tree from JSON
   */
  static import(jsonData: string): DecisionTree {
    const data = JSON.parse(jsonData);
    return new DecisionTree(data.modelId, data.root);
  }

  /**
   * Create a sample NPC behavior tree
   */
  static createSampleGuard(): DecisionTree {
    const root: DecisionNode = {
      id: 'root',
      condition: {
        attribute: 'playerDistance',
        operator: 'lt',
        value: 5
      },
      children: [
        {
          id: 'close_player',
          condition: {
            attribute: 'gameState.playerHostile',
            operator: 'eq',
            value: true
          },
          children: [
            { id: 'attack_hostile', action: 'attack' },
            {
              id: 'check_distance',
              condition: {
                attribute: 'playerDistance',
                operator: 'lt',
                value: 2
              },
              children: [
                { id: 'warn_close', action: 'dialogue:warning' },
                { id: 'greet_far', action: 'dialogue:greeting' }
              ]
            }
          ]
        },
        {
          id: 'far_player',
          condition: {
            attribute: 'timeOfDay',
            operator: 'gt',
            value: 22
          },
          children: [
            { id: 'night_patrol', action: 'patrol' },
            { id: 'day_guard', action: 'guard' }
          ]
        }
      ]
    };

    return new DecisionTree('sample_guard', root);
  }

  /**
   * Create a sample merchant NPC
   */
  static createSampleMerchant(): DecisionTree {
    const root: DecisionNode = {
      id: 'root',
      condition: {
        attribute: 'playerDistance',
        operator: 'lt',
        value: 3
      },
      children: [
        {
          id: 'player_nearby',
          condition: {
            attribute: 'timeOfDay',
            operator: 'gte',
            value: 6
          },
          children: [
            {
              id: 'business_hours',
              condition: {
                attribute: 'timeOfDay',
                operator: 'lte',
                value: 22
              },
              children: [
                { id: 'offer_trade', action: 'trade' },
                { id: 'closed', action: 'dialogue:Sorry, I\'m closed for the night.' }
              ]
            },
            { id: 'too_early', action: 'dialogue:Come back when the sun is up.' }
          ]
        },
        { id: 'player_far', action: 'idle' }
      ]
    };

    return new DecisionTree('sample_merchant', root);
  }
}