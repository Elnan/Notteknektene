// Balanced Combat Simulation for Battle Swap

// Balanced attack definitions
const BALANCED_ATTACKS = {
  strike: { name: "Strike", damage: 25 },
  doubleStrike: { name: "Double Strike", damage: "20-30" },
  riskIt: { name: "Risk It", damage: "15/25 to self OR 25/35 to opponent" },
  poison: { name: "Poison", effect: "Add 1 poison stack" },
  burn: { name: "Burn", effect: "Add 1 burn stack" },
  shield: { name: "Shield", effect: "Add 20 shield" },
  heal: { name: "Heal", effect: "Restore 20 HP" },
  selfDamage: { name: "Self Damage", effect: "Take 15 damage at turn start" },
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
        const burnDamage = Math.floor((this.playerBurn * 1.5) / 2); // Reduced from 2 to 1.5
        this.playerHP = Math.max(0, this.playerHP - burnDamage);
      }
      if (this.playerSelfDamage) {
        this.playerHP = Math.max(0, this.playerHP - 15); // Increased from 10 to 15
      }
    } else {
      if (this.aiPoison > 0) {
        this.aiHP = Math.max(0, this.aiHP - this.aiPoison);
      }
      if (this.aiBurn > 0) {
        const burnDamage = Math.floor((this.aiBurn * 1.5) / 2); // Reduced from 2 to 1.5
        this.aiHP = Math.max(0, this.aiHP - burnDamage);
      }
      if (this.aiSelfDamage) {
        this.aiHP = Math.max(0, this.aiHP - 15); // Increased from 10 to 15
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
        damage = 25; // Increased from 20 to 25
        break;

      case "doubleStrike":
        damage = Math.floor(Math.random() * 11) + 20; // 20-30 (increased from 15-25)
        break;

      case "riskIt":
        const riskOptions = [
          { damage: 15, target: "self" }, // Increased from 10
          { damage: 25, target: "self" }, // Increased from 20
          { damage: 25, target: "opponent" }, // Increased from 20
          { damage: 35, target: "opponent" }, // Increased from 30
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
          this.playerShield += 20; // Reduced from 25 to 20
        } else {
          this.aiShield += 20; // Reduced from 25 to 20
        }
        break;

      case "heal":
        const healAmount = 20; // Reduced from 25 to 20
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

// Improved AI decision making
function makeAIDecision(gameState, aiAttacks) {
  // More strategic AI
  const shouldHeal = gameState.aiHP < 60 && aiAttacks.includes("heal");
  const shouldShield = gameState.aiHP < 120 && aiAttacks.includes("shield");
  const shouldUseStatus =
    gameState.playerShield > 0 &&
    (aiAttacks.includes("poison") || aiAttacks.includes("burn"));
  const shouldUseDamage =
    gameState.playerHP < 50 &&
    (aiAttacks.includes("strike") || aiAttacks.includes("doubleStrike"));

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

// Run simulations
function runSimulations(numSimulations = 10000) {
  console.log(`Running ${numSimulations} BALANCED battle simulations...`);

  const playerAttacks = ["burn", "shield", "heal", "selfDamage"];
  const aiAttacks = ["strike", "doubleStrike", "riskIt", "poison"];

  const results = [];

  for (let i = 0; i < numSimulations; i++) {
    const result = simulateBattle(playerAttacks, aiAttacks);
    results.push(result);
  }

  // Analyze results
  const stats = analyzeAttacks(results);

  // Calculate overall win rates
  const playerWins = results.filter((r) => r.winner === "player").length;
  const aiWins = results.filter((r) => r.winner === "ai").length;
  const draws = results.filter((r) => r.winner === "draw").length;

  console.log("\n=== BALANCED BATTLE SIMULATION RESULTS ===");
  console.log(`Total battles: ${numSimulations}`);
  console.log(
    `Player wins: ${playerWins} (${((playerWins / numSimulations) * 100).toFixed(1)}%)`
  );
  console.log(
    `AI wins: ${aiWins} (${((aiWins / numSimulations) * 100).toFixed(1)}%)`
  );
  console.log(
    `Draws: ${draws} (${((draws / numSimulations) * 100).toFixed(1)}%)`
  );
  console.log(
    `Average turns per battle: ${(results.reduce((sum, r) => sum + r.turnCount, 0) / numSimulations).toFixed(1)}`
  );

  console.log("\n=== BALANCED ATTACK PERFORMANCE ANALYSIS ===");
  Object.keys(stats).forEach((attack) => {
    const stat = stats[attack];
    console.log(
      `${attack.padEnd(12)} | Uses: ${stat.uses.toString().padStart(4)} | Win Rate: ${stat.winRate.toFixed(1)}% | Avg Turns: ${stat.avgTurns.toFixed(1)}`
    );
  });

  return { results, stats };
}

// Run the simulation
const simulationResults = runSimulations(10000);
