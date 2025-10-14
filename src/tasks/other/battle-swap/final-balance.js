// Final Balanced Combat Simulation for Battle Swap

// Final balanced attack definitions
const FINAL_ATTACKS = {
  strike: { name: "Strike", damage: 30 },
  doubleStrike: { name: "Double Strike", damage: "25-35" },
  riskIt: { name: "Risk It", damage: "20/30 to self OR 30/40 to opponent" },
  poison: { name: "Poison", effect: "Add 1 poison stack" },
  burn: { name: "Burn", effect: "Add 1 burn stack" },
  shield: { name: "Shield", effect: "Add 15 shield" },
  heal: { name: "Heal", effect: "Restore 15 HP" },
  selfDamage: { name: "Self Damage", effect: "Take 20 damage at turn start" },
};

// Game state for simulation
class GameState {
  constructor() {
    this.playerHP = 200;
    this.aiHP = 200;
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
    this.aiHP = 200;
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
        const burnDamage = Math.floor((this.playerBurn * 1.2) / 2); // Further reduced
        this.playerHP = Math.max(0, this.playerHP - burnDamage);
      }
      if (this.playerSelfDamage) {
        this.playerHP = Math.max(0, this.playerHP - 20); // Increased to 20
      }
    } else {
      if (this.aiPoison > 0) {
        this.aiHP = Math.max(0, this.aiHP - this.aiPoison);
      }
      if (this.aiBurn > 0) {
        const burnDamage = Math.floor((this.aiBurn * 1.2) / 2); // Further reduced
        this.aiHP = Math.max(0, this.aiHP - burnDamage);
      }
      if (this.aiSelfDamage) {
        this.aiHP = Math.max(0, this.aiHP - 20); // Increased to 20
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
        damage = 30; // Increased to 30
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
          this.playerShield += 15; // Reduced to 15
        } else {
          this.aiShield += 15; // Reduced to 15
        }
        break;

      case "heal":
        const healAmount = 15; // Reduced to 15
        if (isPlayer) {
          this.playerHP = Math.min(200, this.playerHP + healAmount);
        } else {
          this.aiHP = Math.min(200, this.aiHP + healAmount);
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

// Strategic AI decision making
function makeAIDecision(gameState, aiAttacks) {
  // More strategic AI with better decision making
  const shouldHeal = gameState.aiHP < 80 && aiAttacks.includes("heal");
  const shouldShield = gameState.aiHP < 150 && aiAttacks.includes("shield");
  const shouldUseStatus =
    gameState.playerShield > 0 &&
    (aiAttacks.includes("poison") || aiAttacks.includes("burn"));
  const shouldUseDamage =
    gameState.playerHP < 80 &&
    (aiAttacks.includes("strike") || aiAttacks.includes("doubleStrike"));
  const shouldUseRiskIt =
    gameState.playerHP < 40 && aiAttacks.includes("riskIt");

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

  // Random choice from available attacks
  return aiAttacks[Math.floor(Math.random() * aiAttacks.length)];
}

// Simulate a single battle
function simulateBattle(playerAttacks, aiAttacks, maxTurns = 50) {
  const game = new GameState();
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
      const attack = makeAIDecision(game, aiAttacks);
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

// Analyze attack performance
function analyzeAttacks(simulationResults) {
  const attackStats = {};

  // Initialize stats
  const allAttacks = [
    "strike",
    "doubleStrike",
    "riskIt",
    "poison",
    "burn",
    "shield",
    "heal",
    "selfDamage",
  ];
  allAttacks.forEach((attack) => {
    attackStats[attack] = {
      uses: 0,
      wins: 0,
      winRate: 0,
      avgTurns: 0,
      totalTurns: 0,
    };
  });

  // Collect statistics
  simulationResults.forEach((result) => {
    const winner = result.winner;
    if (winner === "draw") return;

    // Count player attacks
    result.attackHistory.player.forEach((attack) => {
      attackStats[attack].uses++;
      attackStats[attack].totalTurns += result.turnCount;
      if (winner === "player") {
        attackStats[attack].wins++;
      }
    });

    // Count AI attacks
    result.attackHistory.ai.forEach((attack) => {
      attackStats[attack].uses++;
      attackStats[attack].totalTurns += result.turnCount;
      if (winner === "ai") {
        attackStats[attack].wins++;
      }
    });
  });

  // Calculate averages
  Object.keys(attackStats).forEach((attack) => {
    const stats = attackStats[attack];
    if (stats.uses > 0) {
      stats.winRate = (stats.wins / stats.uses) * 100;
      stats.avgTurns = stats.totalTurns / stats.uses;
    }
  });

  return attackStats;
}

// Test different starting attack combinations
function testAttackCombinations() {
  console.log("Testing different attack combinations for balance...\n");

  const combinations = [
    {
      name: "Current Setup",
      player: ["burn", "shield", "heal", "selfDamage"],
      ai: ["strike", "doubleStrike", "riskIt", "poison"],
    },
    {
      name: "Balanced Setup 1",
      player: ["shield", "heal", "burn", "selfDamage"],
      ai: ["strike", "doubleStrike", "poison", "riskIt"],
    },
    {
      name: "Balanced Setup 2",
      player: ["heal", "shield", "selfDamage", "burn"],
      ai: ["strike", "poison", "doubleStrike", "riskIt"],
    },
    {
      name: "Aggressive AI",
      player: ["shield", "heal", "burn", "selfDamage"],
      ai: ["strike", "doubleStrike", "riskIt", "poison"],
    },
  ];

  combinations.forEach((combo) => {
    console.log(`\n=== ${combo.name} ===`);
    const results = [];

    for (let i = 0; i < 5000; i++) {
      const result = simulateBattle(combo.player, combo.ai);
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
  });
}

// Run the final simulation
function runFinalSimulation() {
  console.log("Running FINAL balanced battle simulation...\n");

  const playerAttacks = ["shield", "heal", "burn", "selfDamage"];
  const aiAttacks = ["strike", "doubleStrike", "poison", "riskIt"];

  const results = [];

  for (let i = 0; i < 10000; i++) {
    const result = simulateBattle(playerAttacks, aiAttacks);
    results.push(result);
  }

  // Analyze results
  const stats = analyzeAttacks(results);

  // Calculate overall win rates
  const playerWins = results.filter((r) => r.winner === "player").length;
  const aiWins = results.filter((r) => r.winner === "ai").length;
  const draws = results.filter((r) => r.winner === "draw").length;

  console.log("=== FINAL BALANCED BATTLE SIMULATION RESULTS ===");
  console.log(`Total battles: 10000`);
  console.log(
    `Player wins: ${playerWins} (${((playerWins / 10000) * 100).toFixed(1)}%)`
  );
  console.log(`AI wins: ${aiWins} (${((aiWins / 10000) * 100).toFixed(1)}%)`);
  console.log(`Draws: ${draws} (${((draws / 10000) * 100).toFixed(1)}%)`);
  console.log(
    `Average turns per battle: ${(results.reduce((sum, r) => sum + r.turnCount, 0) / 10000).toFixed(1)}`
  );

  console.log("\n=== FINAL ATTACK PERFORMANCE ANALYSIS ===");
  Object.keys(stats).forEach((attack) => {
    const stat = stats[attack];
    console.log(
      `${attack.padEnd(12)} | Uses: ${stat.uses.toString().padStart(4)} | Win Rate: ${stat.winRate.toFixed(1)}% | Avg Turns: ${stat.avgTurns.toFixed(1)}`
    );
  });

  return { results, stats };
}

// Run tests
testAttackCombinations();
runFinalSimulation();
