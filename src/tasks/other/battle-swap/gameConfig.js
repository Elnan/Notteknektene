// Strategic Battle Swap Game Configuration
// Redesigned for tactical depth and planning

const GAME_CONFIG = {
  // Core Game Settings
  PLAYER_MAX_HP: 150,
  AI_MAX_HP: 200,
  MAX_ENERGY: 3,
  MAX_POSITION_CHANGES: 1,
  SWAP_COOLDOWN: 2,

  // Starting Attacks (balanced for strategy) - 8 unique attacks total
  PLAYER_STARTING_ATTACKS: ["strike", "defend", "poisonStrike", "feint"],
  AI_STARTING_ATTACKS: ["powerStrike", "burnStrike", "counter", "timeWarp"],

  // Positioning System
  POSITIONS: {
    AGGRESSIVE: {
      name: "Aggressive",
      icon: "⚔️",
      damageMultiplier: 1.5,
      damageReduction: 0.75,
      statusMultiplier: 1.25,
      energyRegen: 1,
      vulnerability: "counter",
    },
    NEUTRAL: {
      name: "Neutral",
      icon: "⚖️",
      damageMultiplier: 1.0,
      damageReduction: 1.0,
      statusMultiplier: 1.0,
      energyRegen: 1.25,
      vulnerability: "none",
    },
    DEFENSIVE: {
      name: "Defensive",
      icon: "🛡️",
      damageMultiplier: 0.75,
      damageReduction: 1.5,
      statusMultiplier: 0.75,
      energyRegen: 1,
      vulnerability: "none",
    },
  },

  // Enhanced Attack System with Energy Costs and Cooldowns - 8 Unique Attacks
  ATTACKS: {
    // Basic Attacks (1 Energy)
    strike: {
      name: "Strike",
      icon: "⚔️",
      color: "#4a90e2",
      description: "Basic attack - 15 damage",
      effect: "Deal 15 damage",
      energyCost: 1,
      cooldown: 1,
      damage: 15,
      type: "damage",
    },

    defend: {
      name: "Defend",
      icon: "🛡️",
      color: "#27ae60",
      description: "Gain 10 shield",
      effect: "Gain 10 shield",
      energyCost: 1,
      cooldown: 1,
      shieldAmount: 10,
      type: "defense",
    },

    feint: {
      name: "Feint",
      icon: "🎭",
      color: "#9b59b6",
      description: "10 damage, bypasses shield",
      effect: "Deal 10 damage (ignores shield)",
      energyCost: 1,
      cooldown: 2,
      damage: 10,
      bypassShield: true,
      type: "damage",
    },

    // Medium Attacks (2 Energy)
    powerStrike: {
      name: "Power Strike",
      icon: "💥",
      color: "#e74c3c",
      description: "Heavy attack - 25 damage",
      effect: "Deal 25 damage",
      energyCost: 2,
      cooldown: 2,
      damage: 25,
      type: "damage",
    },

    poisonStrike: {
      name: "Poison Strike",
      icon: "☠️",
      color: "#8b4513",
      description: "15 damage + 2 poison",
      effect: "Deal 15 damage + 2 poison",
      energyCost: 2,
      cooldown: 2,
      damage: 15,
      poisonAmount: 2,
      type: "status",
    },

    burnStrike: {
      name: "Burn Strike",
      icon: "🔥",
      color: "#ff4500",
      description: "15 damage + 2 burn",
      effect: "Deal 15 damage + 2 burn",
      energyCost: 2,
      cooldown: 2,
      damage: 15,
      burnAmount: 2,
      type: "status",
    },

    counter: {
      name: "Counter",
      icon: "🔄",
      color: "#f39c12",
      description: "Reflect 50% damage taken",
      effect: "Reflect 50% of damage taken",
      energyCost: 2,
      cooldown: 3,
      reflectPercent: 50,
      type: "defense",
    },

    // Ultimate Attacks (3 Energy)
    timeWarp: {
      name: "Time Warp",
      icon: "⏰",
      color: "#3498db",
      description: "Reset all cooldowns",
      effect: "Reset all attack cooldowns",
      energyCost: 3,
      cooldown: 4,
      resetCooldowns: true,
      type: "utility",
    },
  },

  // Enhanced Status Effects
  STATUS_EFFECTS: {
    poison: {
      damagePerTurn: 1,
      maxStacks: 5,
      description: "Takes poison damage each turn",
      transferable: true,
    },
    burn: {
      damagePerTurn: 2,
      maxStacks: 3,
      description: "Takes burn damage each turn",
      transferable: true,
    },
    curse: {
      damagePerTurn: 5,
      maxStacks: 1,
      description: "Permanent curse damage",
      transferable: false,
      permanent: true,
    },
    shield: {
      maxAmount: 50,
      description: "Blocks incoming damage",
    },
  },

  // AI Configuration
  AI: {
    DIFFICULTY: "HARD",
    PERSONALITIES: ["AGGRESSIVE", "DEFENSIVE", "STATUS", "ADAPTIVE", "COUNTER"],
    PLANNING_TURNS: 3,
    ADAPTATION_RATE: 0.7,
    MISTAKE_CHANCE: 0.1,
  },

  // Victory Conditions
  VICTORY_CONDITIONS: {
    HP_KILL: "Reduce opponent HP to 0",
    STATUS_OVERWHELM: "Apply 5+ status effects simultaneously",
    SURVIVAL: "Survive 20 turns",
    DAMAGE_DEALT: "Deal 500+ total damage",
  },

  // UI Configuration
  UI: {
    SHOW_ENERGY: true,
    SHOW_COOLDOWNS: true,
    SHOW_POSITION: true,
    SHOW_PLANNING: true,
    ANIMATION_SPEED: 500,
  },
};

// Helper Functions
export const getAttackDamage = (attackType) => {
  const attack = GAME_CONFIG.ATTACKS[attackType];
  return attack ? attack.damage : 0;
};

export const getAttackEnergyCost = (attackType) => {
  const attack = GAME_CONFIG.ATTACKS[attackType];
  return attack ? attack.energyCost : 1;
};

export const getAttackCooldown = (attackType) => {
  const attack = GAME_CONFIG.ATTACKS[attackType];
  return attack ? attack.cooldown : 1;
};

export const getShieldAmount = () => {
  return GAME_CONFIG.ATTACKS.defend.shieldAmount;
};

export const getHealAmount = () => {
  return 0; // No healing attack in current set
};

export const getSelfDamageAmount = () => {
  return GAME_CONFIG.STATUS_EFFECTS.curse.damagePerTurn;
};

export const getStatusEffectDamage = (effectType, stacks, hasShield) => {
  const effect = GAME_CONFIG.STATUS_EFFECTS[effectType];
  if (!effect) return 0;

  let damage = effect.damagePerTurn * stacks;

  // Shield reduces status damage by 50%
  if (hasShield) {
    damage = Math.floor(damage * 0.5);
  }

  return damage;
};

export const getPositionMultiplier = (position, stat) => {
  const pos = GAME_CONFIG.POSITIONS[position];
  return pos ? pos[stat] : 1.0;
};

export default GAME_CONFIG;
