// Enhanced AI Difficulty Simulation for Battle Swap

// Enhanced attack definitions with AI health boost
const ENHANCED_ATTACKS = {
  strike: { name: "Strike", damage: 30 },
  doubleStrike: { name: "Double Strike", damage: "25-35" },
  riskIt: { name: "Risk It", damage: "20/30 to self OR 30/40 to opponent" },
  poison: { name: "Poison", effect: "Add 1 poison stack" },
  burn: { name: "Burn", effect: "Add 1 burn stack" },
  shield: { name: "Shield", effect: "Add 15 shield" },
  heal: { name: "Heal", effect: "Restore 15 HP" },
  selfDamage: { name: "Self Damage", effect: "Take 20 damage at turn start" },
};

// Game state for simulation with AI health boost
class GameState {
  constructor(aiHealthBoost = 0) {
    this.playerHP = 200;
    this.aiHP = 200 + aiHealthBoost; // AI gets extra health
    this.playerShield = 0;
    this.aiShield = 0;
    this.playerPoison = 0;
    this.aiPoison = 0;
    this.playerBurn = 0;
    this.aiBurn = 0;
    this.playerSelfDamage = false;
    this.aiSelfDamage = false;
    this.turn = "player";
    this.turnCount = 0;
  }

  reset() {
    this.playerHP = 200;
    this.aiHP = 200 + (this.aiHP - 200); // Keep the health boost
    this.playerShield = 0;
    this.aiShield = 0;
    this.playerPoison = 0;
    this.aiPoison = 0;
    this.playerBurn = 0;
    this.aiBurn = 0;
    this.playerSelfDamage = false;
    this.aiSelfDamage = false;
    this.turn = "player";
    this.turnCount = 0;
  }

  applyStatusEffects() {
    if (this.turn === "player") {
      if (this.playerPoison > 0) {
        this.playerHP = Math.max(0, this.playerHP - this.playerPoison);
      }
      if (this.playerBurn > 0) {
        const burnDamage = Math.floor((this.playerBurn * 1.2) / 2);
        this.playerHP = Math.max(0, this.playerHP - burnDamage);
      }
      if (this.playerSelfDamage) {
        this.playerHP = Math.max(0, this.playerHP - 20);
      }
    } else {
      if (this.aiPoison > 0) {
        this.aiHP = Math.max(0, this.aiHP - this.aiPoison);
      }
      if (this.aiBurn > 0) {
        const burnDamage = Math.floor((this.aiBurn * 1.2) / 2);
        this.aiHP = Math.max(0, this.aiHP - burnDamage);
      }
      if (this.aiSelfDamage) {
        this.aiHP = Math.max(0, this.aiHP - 20);
      }
    }
  }

  removeBurn() {
    if (this.turn === "player" && this.playerBurn > 0) {
      this.playerBurn = Math.max(0, this.playerBurn - 1);
    } else if (this.turn === "ai" && this.aiBurn > 0) {
      this.aiBurn = Math.max(0, this.aiBurn - 1);
    }
  }

  useAttack(attackType, attacker) {
    const isPlayer = attacker === "player";
    const targetHP = isPlayer ? this.aiHP : this.playerHP;
    const setTargetHP = (value) => {
      if (isPlayer) this.aiHP = value;
      else this.playerHP = value;
    };
    const targetShield = isPlayer ? this.aiShield : this.playerShield;
    const setTargetShield = (value) => {
      if (isPlayer) this.aiShield = value;
      else this.playerShield = value;
    };
    const setTargetPoison = (value) => {
      if (isPlayer) this.aiPoison = value;
      else this.playerPoison = value;
    };
    const setTargetBurn = (value) => {
      if (isPlayer) this.aiBurn = value;
      else this.playerBurn = value;
    };
    const setTargetSelfDamage = (value) => {
      if (isPlayer) this.aiSelfDamage = value;
      else this.playerSelfDamage = value;
    };

    let damage = 0;

    switch (attackType) {
      case "strike":
        damage = 30;
        break;

      case "doubleStrike":
        damage = Math.floor(Math.random() * 11) + 25; // 25-35
        break;

      case "riskIt":
        const riskOptions = [
          { damage: 20, target: "self" },
          { damage: 30, target: "self" },
          { damage: 30, target: "opponent" },
          { damage: 40, target: "opponent" },
        ];
        const riskResult =
          riskOptions[Math.floor(Math.random() * riskOptions.length)];

        if (riskResult.target === "self") {
          if (isPlayer) {
            this.playerHP = Math.max(0, this.playerHP - riskResult.damage);
          } else {
            this.aiHP = Math.max(0, this.aiHP - riskResult.damage);
          }
        } else {
          damage = riskResult.damage;
        }
        break;

      case "poison":
        setTargetPoison((isPlayer ? this.aiPoison : this.playerPoison) + 1);
        break;

      case "burn":
        setTargetBurn((isPlayer ? this.aiBurn : this.playerBurn) + 1);
        break;

      case "shield":
        if (isPlayer) {
          this.playerShield += 15;
        } else {
          this.aiShield += 15;
        }
        break;

      case "heal":
        const healAmount = 15;
        if (isPlayer) {
          this.playerHP = Math.min(200, this.playerHP + healAmount);
        } else {
          this.aiHP = Math.min(200 + (this.aiHP - 200), this.aiHP + healAmount); // Respect max HP with boost
        }
        break;

      case "selfDamage":
        setTargetSelfDamage(true);
        break;
    }

    // Apply damage if any
    if (damage > 0) {
      if (
        attackType === "poison" ||
        attackType === "burn" ||
        targetShield === 0
      ) {
        setTargetHP(Math.max(0, targetHP - damage));
      } else {
        const remainingDamage = Math.max(0, damage - targetShield);
        setTargetShield(0);
        if (remainingDamage > 0) {
          setTargetHP(Math.max(0, targetHP - remainingDamage));
        }
      }
    }
  }

  isGameOver() {
    return this.playerHP <= 0 || this.aiHP <= 0 || this.turnCount > 50;
  }

  getWinner() {
    if (this.playerHP <= 0) return "ai";
    if (this.aiHP <= 0) return "player";
    if (this.turnCount > 50) return "draw";
    return null;
  }
}

// Enhanced AI decision making with multiple difficulty levels
function makeEnhancedAIDecision(gameState, aiAttacks, difficulty = "hard") {
  const aiHP = gameState.aiHP;
  const playerHP = gameState.playerHP;
  const playerShield = gameState.playerShield;
  const aiShield = gameState.aiShield;
  const playerPoison = gameState.playerPoison;
  const aiPoison = gameState.aiPoison;
  const playerBurn = gameState.playerBurn;
  const aiBurn = gameState.aiBurn;

  // Calculate threat levels
  const playerThreat =
    playerHP + playerShield + playerPoison * 2 + playerBurn * 1.5;
  const aiThreat = aiHP + aiShield + aiPoison * 2 + aiBurn * 1.5;

  if (difficulty === "easy") {
    // Simple random AI
    return aiAttacks[Math.floor(Math.random() * aiAttacks.length)];
  }

  if (difficulty === "medium") {
    // Basic strategic AI
    const shouldHeal = aiHP < 100 && aiAttacks.includes("heal");
    const shouldShield = aiHP < 150 && aiAttacks.includes("shield");
    const shouldUseStatus =
      playerShield > 0 &&
      (aiAttacks.includes("poison") || aiAttacks.includes("burn"));

    if (shouldHeal) return "heal";
    if (shouldShield) return "shield";
    if (shouldUseStatus) {
      if (aiAttacks.includes("poison")) return "poison";
      if (aiAttacks.includes("burn")) return "burn";
    }

    return aiAttacks[Math.floor(Math.random() * aiAttacks.length)];
  }

  if (difficulty === "hard") {
    // Advanced strategic AI
    const shouldHeal = aiHP < 120 && aiAttacks.includes("heal");
    const shouldShield = aiHP < 180 && aiAttacks.includes("shield");
    const shouldUseStatus =
      playerShield > 0 &&
      (aiAttacks.includes("poison") || aiAttacks.includes("burn"));
    const shouldUseDamage =
      playerHP < 100 &&
      (aiAttacks.includes("strike") || aiAttacks.includes("doubleStrike"));
    const shouldUseRiskIt = playerHP < 60 && aiAttacks.includes("riskIt");
    const shouldPrioritizeDamage = playerHP < 50;

    if (shouldPrioritizeDamage) {
      if (aiAttacks.includes("strike")) return "strike";
      if (aiAttacks.includes("doubleStrike")) return "doubleStrike";
      if (aiAttacks.includes("riskIt")) return "riskIt";
    }

    if (shouldHeal) return "heal";
    if (shouldShield) return "shield";
    if (shouldUseStatus) {
      if (aiAttacks.includes("poison")) return "poison";
      if (aiAttacks.includes("burn")) return "burn";
    }
    if (shouldUseDamage) {
      if (aiAttacks.includes("strike")) return "strike";
      if (aiAttacks.includes("doubleStrike")) return "doubleStrike";
    }
    if (shouldUseRiskIt) return "riskIt";

    // Default to most effective attack
    if (aiAttacks.includes("strike")) return "strike";
    if (aiAttacks.includes("doubleStrike")) return "doubleStrike";
    if (aiAttacks.includes("poison")) return "poison";
    if (aiAttacks.includes("burn")) return "burn";
    if (aiAttacks.includes("riskIt")) return "riskIt";

    return aiAttacks[0];
  }

  if (difficulty === "expert") {
    // Expert AI with advanced tactics
    const shouldHeal = aiHP < 140 && aiAttacks.includes("heal");
    const shouldShield = aiHP < 200 && aiAttacks.includes("shield");
    const shouldUseStatus =
      playerShield > 0 &&
      (aiAttacks.includes("poison") || aiAttacks.includes("burn"));
    const shouldUseDamage =
      playerHP < 120 &&
      (aiAttacks.includes("strike") || aiAttacks.includes("doubleStrike"));
    const shouldUseRiskIt = playerHP < 80 && aiAttacks.includes("riskIt");
    const shouldPrioritizeDamage = playerHP < 60;
    const shouldDefend =
      aiHP < 80 && (aiAttacks.includes("heal") || aiAttacks.includes("shield"));

    if (shouldPrioritizeDamage) {
      if (aiAttacks.includes("strike")) return "strike";
      if (aiAttacks.includes("doubleStrike")) return "doubleStrike";
      if (aiAttacks.includes("riskIt")) return "riskIt";
    }

    if (shouldDefend) {
      if (aiAttacks.includes("heal")) return "heal";
      if (aiAttacks.includes("shield")) return "shield";
    }

    if (shouldHeal) return "heal";
    if (shouldShield) return "shield";
    if (shouldUseStatus) {
      if (aiAttacks.includes("poison")) return "poison";
      if (aiAttacks.includes("burn")) return "burn";
    }
    if (shouldUseDamage) {
      if (aiAttacks.includes("strike")) return "strike";
      if (aiAttacks.includes("doubleStrike")) return "doubleStrike";
    }
    if (shouldUseRiskIt) return "riskIt";

    // Default to most effective attack
    if (aiAttacks.includes("strike")) return "strike";
    if (aiAttacks.includes("doubleStrike")) return "doubleStrike";
    if (aiAttacks.includes("poison")) return "poison";
    if (aiAttacks.includes("burn")) return "burn";
    if (aiAttacks.includes("riskIt")) return "riskIt";

    return aiAttacks[0];
  }

  return aiAttacks[Math.floor(Math.random() * aiAttacks.length)];
}

// Simulate a single battle
function simulateBattle(
  playerAttacks,
  aiAttacks,
  maxTurns = 50,
  aiHealthBoost = 0,
  aiDifficulty = "hard"
) {
  const game = new GameState(aiHealthBoost);
  const attackHistory = { player: [], ai: [] };

  while (!game.isGameOver() && game.turnCount < maxTurns) {
    game.turnCount++;

    // Apply status effects at turn start
    game.applyStatusEffects();

    // Choose and use attack
    if (game.turn === "player") {
      const attack =
        playerAttacks[Math.floor(Math.random() * playerAttacks.length)];
      game.useAttack(attack, "player");
      attackHistory.player.push(attack);
    } else {
      const attack = makeEnhancedAIDecision(game, aiAttacks, aiDifficulty);
      game.useAttack(attack, "ai");
      attackHistory.ai.push(attack);
    }

    // Remove burn at end of turn
    game.removeBurn();

    // Switch turns
    game.turn = game.turn === "player" ? "ai" : "player";
  }

  return {
    winner: game.getWinner(),
    turnCount: game.turnCount,
    finalPlayerHP: game.playerHP,
    finalAiHP: game.aiHP,
    attackHistory,
  };
}

// Test different AI configurations
function testAIConfigurations() {
  console.log(
    "Testing different AI configurations for optimal difficulty...\n"
  );

  const playerAttacks = ["burn", "shield", "heal", "selfDamage"];
  const aiAttacks = ["strike", "doubleStrike", "poison", "riskIt"];

  const configurations = [
    { name: "Easy AI", difficulty: "easy", healthBoost: 0 },
    { name: "Medium AI", difficulty: "medium", healthBoost: 0 },
    { name: "Hard AI", difficulty: "hard", healthBoost: 0 },
    { name: "Expert AI", difficulty: "expert", healthBoost: 0 },
    { name: "Hard AI + 50 HP", difficulty: "hard", healthBoost: 50 },
    { name: "Expert AI + 50 HP", difficulty: "expert", healthBoost: 50 },
    { name: "Expert AI + 100 HP", difficulty: "expert", healthBoost: 100 },
    { name: "Expert AI + 150 HP", difficulty: "expert", healthBoost: 150 },
  ];

  configurations.forEach((config) => {
    console.log(`\n=== ${config.name} ===`);
    const results = [];

    for (let i = 0; i < 5000; i++) {
      const result = simulateBattle(
        playerAttacks,
        aiAttacks,
        50,
        config.healthBoost,
        config.difficulty
      );
      results.push(result);
    }

    const playerWins = results.filter((r) => r.winner === "player").length;
    const aiWins = results.filter((r) => r.winner === "ai").length;
    const draws = results.filter((r) => r.winner === "draw").length;

    console.log(
      `Player wins: ${playerWins} (${((playerWins / 5000) * 100).toFixed(1)}%)`
    );
    console.log(`AI wins: ${aiWins} (${((aiWins / 5000) * 100).toFixed(1)}%)`);
    console.log(`Draws: ${draws} (${((draws / 5000) * 100).toFixed(1)}%)`);
    console.log(
      `Avg turns: ${(results.reduce((sum, r) => sum + r.turnCount, 0) / 5000).toFixed(1)}`
    );
    console.log(`AI health: ${200 + config.healthBoost}`);
  });
}

// Run the enhanced AI tests
testAIConfigurations();
