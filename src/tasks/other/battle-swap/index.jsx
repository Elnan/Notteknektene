import React, { useState, useEffect } from "react";
import { IoSwapVertical } from "react-icons/io5";
import Modal from "../../../components/Modal.jsx";
import Button from "../../../components/Button.jsx";
import styles from "./BattleSwap.module.css";

import GAME_CONFIG, {
  getAttackDamage,
  getAttackEnergyCost,
  getAttackCooldown,
  getShieldAmount,
  getHealAmount,
  getStatusEffectDamage,
  getPositionMultiplier,
} from "./gameConfig.js";

const { ATTACKS, POSITIONS } = GAME_CONFIG;

const BattleSwap = () => {
  // Core Game State
  const [gameState, setGameState] = useState("playing");
  const [currentTurn, setCurrentTurn] = useState("player");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState("");
  const [turnCount, setTurnCount] = useState(0);

  // Health and Energy
  const [playerHP, setPlayerHP] = useState(GAME_CONFIG.PLAYER_MAX_HP);
  const [aiHP, setAiHP] = useState(GAME_CONFIG.AI_MAX_HP);
  const [playerEnergy, setPlayerEnergy] = useState(GAME_CONFIG.MAX_ENERGY);
  const [aiEnergy, setAiEnergy] = useState(GAME_CONFIG.MAX_ENERGY);

  // Positioning System
  const [playerPosition, setPlayerPosition] = useState("NEUTRAL");
  const [aiPosition, setAiPosition] = useState("NEUTRAL");
  const [playerPositionChanges, setPlayerPositionChanges] = useState(0);
  const [aiPositionChanges, setAiPositionChanges] = useState(0);

  // Attack Management
  const [playerAttacks, setPlayerAttacks] = useState([
    ...GAME_CONFIG.PLAYER_STARTING_ATTACKS,
  ]);
  const [aiAttacks, setAiAttacks] = useState([
    ...GAME_CONFIG.AI_STARTING_ATTACKS,
  ]);

  // Cooldown System
  const [playerCooldowns, setPlayerCooldowns] = useState({});
  const [aiCooldowns, setAiCooldowns] = useState({});

  // Swap System
  const [swapCooldown, setSwapCooldown] = useState(0);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedPlayerAttack, setSelectedPlayerAttack] = useState(null);
  const [selectedAIAttack, setSelectedAIAttack] = useState(null);

  // Status Effects
  const [playerShield, setPlayerShield] = useState(0);
  const [aiShield, setAiShield] = useState(0);
  const [playerPoison, setPlayerPoison] = useState(0);
  const [aiPoison, setAiPoison] = useState(0);
  const [playerBurn, setPlayerBurn] = useState(0);
  const [aiBurn, setAiBurn] = useState(0);
  const [playerCurse, setPlayerCurse] = useState(false);
  const [aiCurse, setAiCurse] = useState(false);

  // Game Over
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // Initialize cooldowns
  useEffect(() => {
    const initialCooldowns = {};
    Object.keys(ATTACKS).forEach((attack) => {
      initialCooldowns[attack] = 0;
    });
    setPlayerCooldowns(initialCooldowns);
    setAiCooldowns(initialCooldowns);
  }, []);

  // Check for game over
  useEffect(() => {
    if (playerHP <= 0) {
      setGameState("gameOver");
      setShowGameOverModal(true);
    } else if (aiHP <= 0) {
      setGameState("gameOver");
      setShowGameOverModal(true);
    }
  }, [playerHP, aiHP]);

  // Turn start effects
  useEffect(() => {
    if (currentTurn === "player") {
      // Reset energy and position changes
      setPlayerEnergy(GAME_CONFIG.MAX_ENERGY);
      setPlayerPositionChanges(0);

      // Apply status effects
      if (playerPoison > 0) {
        const poisonDamage = getStatusEffectDamage(
          "poison",
          playerPoison,
          playerShield > 0
        );
        setPlayerHP((prev) => Math.max(0, prev - poisonDamage));
        setLastAction(`You took ${poisonDamage} poison damage!`);
      }
      if (playerBurn > 0) {
        const burnDamage = getStatusEffectDamage(
          "burn",
          playerBurn,
          playerShield > 0
        );
        setPlayerHP((prev) => Math.max(0, prev - burnDamage));
        setLastAction(`You took ${burnDamage} burn damage!`);
      }
      if (playerCurse) {
        const curseDamage = getStatusEffectDamage("curse", 1, playerShield > 0);
        setPlayerHP((prev) => Math.max(0, prev - curseDamage));
        setLastAction(`You took ${curseDamage} curse damage!`);
      }

      // Reduce cooldowns
      setPlayerCooldowns((prev) => {
        const newCooldowns = { ...prev };
        Object.keys(newCooldowns).forEach((attack) => {
          if (newCooldowns[attack] > 0) {
            newCooldowns[attack]--;
          }
        });
        return newCooldowns;
      });
    } else if (currentTurn === "ai") {
      // Reset energy and position changes
      setAiEnergy(GAME_CONFIG.MAX_ENERGY);
      setAiPositionChanges(0);

      // Apply status effects
      if (aiPoison > 0) {
        const poisonDamage = getStatusEffectDamage(
          "poison",
          aiPoison,
          aiShield > 0
        );
        setAiHP((prev) => Math.max(0, prev - poisonDamage));
        setLastAction(`AI took ${poisonDamage} poison damage!`);
      }
      if (aiBurn > 0) {
        const burnDamage = getStatusEffectDamage("burn", aiBurn, aiShield > 0);
        setAiHP((prev) => Math.max(0, prev - burnDamage));
        setLastAction(`AI took ${burnDamage} burn damage!`);
      }
      if (aiCurse) {
        const curseDamage = getStatusEffectDamage("curse", 1, aiShield > 0);
        setAiHP((prev) => Math.max(0, prev - curseDamage));
        setLastAction(`AI took ${curseDamage} curse damage!`);
      }

      // Reduce cooldowns
      setAiCooldowns((prev) => {
        const newCooldowns = { ...prev };
        Object.keys(newCooldowns).forEach((attack) => {
          if (newCooldowns[attack] > 0) {
            newCooldowns[attack]--;
          }
        });
        return newCooldowns;
      });
    }

    // Reduce swap cooldown
    if (swapCooldown > 0) {
      setSwapCooldown((prev) => prev - 1);
    }

    setTurnCount((prev) => prev + 1);
  }, [currentTurn]);

  // AI turn logic
  useEffect(() => {
    if (currentTurn === "ai" && !isProcessing && gameState === "playing") {
      const aiTurn = setTimeout(() => {
        makeAIMove();
      }, 1000);
      return () => clearTimeout(aiTurn);
    }
  }, [currentTurn, isProcessing, gameState]);

  const makeAIMove = () => {
    setIsProcessing(true);

    // Strategic AI decision making
    const aiPersonality = getAIPersonality();
    const plan = createAIPlan(aiPersonality);
    executeAIPlan(plan);
  };

  const getAIPersonality = () => {
    const personalities = GAME_CONFIG.AI.PERSONALITIES;
    return personalities[Math.floor(Math.random() * personalities.length)];
  };

  const createAIPlan = (personality) => {
    const plan = {
      position: aiPosition,
      attacks: [],
      energy: aiEnergy,
      priority: "damage",
    };

    switch (personality) {
      case "AGGRESSIVE":
        plan.position = "AGGRESSIVE";
        plan.priority = "damage";
        break;
      case "DEFENSIVE":
        plan.position = "DEFENSIVE";
        plan.priority = "survival";
        break;
      case "STATUS":
        plan.position = "NEUTRAL";
        plan.priority = "status";
        break;
      case "ADAPTIVE":
        plan.position =
          playerPosition === "AGGRESSIVE" ? "DEFENSIVE" : "AGGRESSIVE";
        plan.priority = "counter";
        break;
      case "COUNTER":
        plan.position = "NEUTRAL";
        plan.priority = "counter";
        break;
    }

    return plan;
  };

  const executeAIPlan = (plan) => {
    let remainingEnergy = aiEnergy;
    const actions = [];

    // Change position if needed
    if (
      plan.position !== aiPosition &&
      aiPositionChanges < GAME_CONFIG.MAX_POSITION_CHANGES
    ) {
      if (remainingEnergy >= 1) {
        setAiPosition(plan.position);
        setAiPositionChanges((prev) => prev + 1);
        remainingEnergy -= 1;
        actions.push(`AI changed to ${POSITIONS[plan.position].name} position`);
      }
    }

    // Select attacks based on priority
    const availableAttacks = aiAttacks.filter(
      (attack) =>
        aiCooldowns[attack] === 0 &&
        getAttackEnergyCost(attack) <= remainingEnergy
    );

    if (availableAttacks.length > 0) {
      const selectedAttack = selectAIAttack(availableAttacks, plan.priority);
      if (selectedAttack) {
        useAttack(selectedAttack, "ai");
        remainingEnergy -= getAttackEnergyCost(selectedAttack);
        actions.push(`AI used ${ATTACKS[selectedAttack].name}`);
      }
    }

    setAiEnergy(remainingEnergy);
    setLastAction(actions.join(" | "));
    setCurrentTurn("player");
    setIsProcessing(false);
  };

  const selectAIAttack = (availableAttacks, priority) => {
    // Sort attacks by priority and energy efficiency
    const sortedAttacks = availableAttacks.sort((a, b) => {
      const aCost = getAttackEnergyCost(a);
      const bCost = getAttackEnergyCost(b);
      const aDamage = getAttackDamage(a);
      const bDamage = getAttackDamage(b);

      // Prefer efficient attacks
      const aEfficiency = aDamage / aCost;
      const bEfficiency = bDamage / bCost;

      return bEfficiency - aEfficiency;
    });

    return sortedAttacks[0];
  };

  const useAttack = (attackType, attacker) => {
    const isPlayer = attacker === "player";
    const attack = ATTACKS[attackType];

    if (!attack) return;

    const targetHP = isPlayer ? aiHP : playerHP;
    const setTargetHP = isPlayer ? setAiHP : setPlayerHP;
    const targetShield = isPlayer ? aiShield : playerShield;
    const setTargetShield = isPlayer ? setAiShield : setPlayerShield;
    const setTargetPoison = isPlayer ? setAiPoison : setPlayerPoison;
    const setTargetBurn = isPlayer ? setAiBurn : setPlayerBurn;
    const setTargetCurse = isPlayer ? setAiCurse : setPlayerCurse;

    const attackerPosition = isPlayer ? playerPosition : aiPosition;
    const positionMultiplier = getPositionMultiplier(
      attackerPosition,
      "damageMultiplier"
    );

    let damage = 0;
    let actionText = "";

    // Apply attack effects
    switch (attackType) {
      case "strike":
      case "powerStrike":
        damage = Math.floor(attack.damage * positionMultiplier);
        actionText = `${isPlayer ? "You" : "AI"} dealt ${damage} damage!`;
        break;

      case "feint":
        damage = Math.floor(attack.damage * positionMultiplier);
        actionText = `${isPlayer ? "You" : "AI"} feinted for ${damage} damage!`;
        break;

      case "defend":
        const shieldAmount = attack.shieldAmount;
        if (isPlayer) {
          setPlayerShield((prev) => Math.min(50, prev + shieldAmount));
        } else {
          setAiShield((prev) => Math.min(50, prev + shieldAmount));
        }
        actionText = `${isPlayer ? "You" : "AI"} gained ${shieldAmount} shield!`;
        break;

      case "poisonStrike":
        damage = Math.floor(attack.damage * positionMultiplier);
        setTargetPoison((prev) => Math.min(5, prev + attack.poisonAmount));
        actionText = `${isPlayer ? "You" : "AI"} poisoned for ${damage} damage + ${attack.poisonAmount} poison!`;
        break;

      case "burnStrike":
        damage = Math.floor(attack.damage * positionMultiplier);
        setTargetBurn((prev) => Math.min(3, prev + attack.burnAmount));
        actionText = `${isPlayer ? "You" : "AI"} burned for ${damage} damage + ${attack.burnAmount} burn!`;
        break;

      case "counter":
        // Counter logic will be handled in damage application
        actionText = `${isPlayer ? "You" : "AI"} prepared to counter!`;
        break;

      case "timeWarp":
        if (isPlayer) {
          setPlayerCooldowns({});
        } else {
          setAiCooldowns({});
        }
        actionText = `${isPlayer ? "You" : "AI"} reset all cooldowns!`;
        break;
    }

    // Apply damage with shield and counter logic
    if (damage > 0) {
      if (attack.bypassShield) {
        setTargetHP((prev) => Math.max(0, prev - damage));
      } else if (targetShield > 0) {
        const remainingDamage = Math.max(0, damage - targetShield);
        setTargetShield(0);
        if (remainingDamage > 0) {
          setTargetHP((prev) => Math.max(0, prev - remainingDamage));
        }
        actionText += " (Shield blocked some damage!)";
      } else {
        setTargetHP((prev) => Math.max(0, prev - damage));
      }
    }

    // Set cooldown
    if (isPlayer) {
      setPlayerCooldowns((prev) => ({
        ...prev,
        [attackType]: attack.cooldown,
      }));
    } else {
      setAiCooldowns((prev) => ({ ...prev, [attackType]: attack.cooldown }));
    }

    setLastAction(actionText);
    setCurrentTurn(isPlayer ? "ai" : "player");
    setIsProcessing(false);
  };

  const handlePlayerAttack = (attackIndex) => {
    if (currentTurn !== "player" || isProcessing || gameState !== "playing") {
      return;
    }

    const attackType = playerAttacks[attackIndex];
    const attack = ATTACKS[attackType];

    // Check if attack is available
    if (playerCooldowns[attackType] > 0) {
      setLastAction(
        `${attack.name} is on cooldown for ${playerCooldowns[attackType]} turns!`
      );
      return;
    }

    // Check energy cost
    if (playerEnergy < attack.energyCost) {
      setLastAction(
        `Not enough energy! Need ${attack.energyCost}, have ${playerEnergy}`
      );
      return;
    }

    // Use energy
    setPlayerEnergy((prev) => prev - attack.energyCost);

    useAttack(attackType, "player");
  };

  const handlePositionChange = (newPosition) => {
    if (currentTurn !== "player" || isProcessing || gameState !== "playing") {
      return;
    }

    if (playerPositionChanges >= GAME_CONFIG.MAX_POSITION_CHANGES) {
      setLastAction("You can only change position once per turn!");
      return;
    }

    if (playerEnergy < 1) {
      setLastAction("Not enough energy to change position!");
      return;
    }

    setPlayerPosition(newPosition);
    setPlayerPositionChanges((prev) => prev + 1);
    setPlayerEnergy((prev) => prev - 1);
    setLastAction(`Changed to ${POSITIONS[newPosition].name} position!`);
  };

  const handleSwapAttacks = () => {
    if (swapCooldown > 0) {
      setLastAction(`Swap is on cooldown for ${swapCooldown} turns!`);
      return;
    }

    setSelectedPlayerAttack(null);
    setSelectedAIAttack(null);
    setShowSwapModal(true);
  };

  const performSwap = () => {
    if (selectedPlayerAttack === null || selectedAIAttack === null) {
      return;
    }

    const newPlayerAttacks = [...playerAttacks];
    const newAiAttacks = [...aiAttacks];

    [newPlayerAttacks[selectedPlayerAttack], newAiAttacks[selectedAIAttack]] = [
      newAiAttacks[selectedAIAttack],
      newPlayerAttacks[selectedPlayerAttack],
    ];

    setPlayerAttacks(newPlayerAttacks);
    setAiAttacks(newAiAttacks);
    setSelectedPlayerAttack(null);
    setSelectedAIAttack(null);
    setShowSwapModal(false);
    setSwapCooldown(GAME_CONFIG.SWAP_COOLDOWN);
    setLastAction("You swapped attacks!");
    setCurrentTurn("ai");
  };

  const resetGame = () => {
    setGameState("playing");
    setCurrentTurn("player");
    setPlayerHP(GAME_CONFIG.PLAYER_MAX_HP);
    setAiHP(GAME_CONFIG.AI_MAX_HP);
    setPlayerEnergy(GAME_CONFIG.MAX_ENERGY);
    setAiEnergy(GAME_CONFIG.MAX_ENERGY);
    setPlayerPosition("NEUTRAL");
    setAiPosition("NEUTRAL");
    setPlayerPositionChanges(0);
    setAiPositionChanges(0);
    setPlayerAttacks([...GAME_CONFIG.PLAYER_STARTING_ATTACKS]);
    setAiAttacks([...GAME_CONFIG.AI_STARTING_ATTACKS]);
    setPlayerShield(0);
    setAiShield(0);
    setPlayerPoison(0);
    setAiPoison(0);
    setPlayerBurn(0);
    setAiBurn(0);
    setPlayerCurse(false);
    setAiCurse(false);
    setSwapCooldown(0);
    setTurnCount(0);
    setLastAction("");
    setIsProcessing(false);
    setShowGameOverModal(false);

    // Reset cooldowns
    const initialCooldowns = {};
    Object.keys(ATTACKS).forEach((attack) => {
      initialCooldowns[attack] = 0;
    });
    setPlayerCooldowns(initialCooldowns);
    setAiCooldowns(initialCooldowns);
  };

  const renderHealthBar = (currentHP, maxHP, isPlayer) => (
    <div className={styles.healthBarContainer}>
      <div className={styles.healthBar}>
        <div
          className={styles.healthFill}
          style={{ width: `${(currentHP / maxHP) * 100}%` }}
        />
      </div>
      <span className={styles.healthText}>
        {currentHP}/{maxHP}
      </span>
    </div>
  );

  const renderEnergyBar = (currentEnergy, maxEnergy) => (
    <div className={styles.energyBarContainer}>
      <div className={styles.energyBar}>
        <div
          className={styles.energyFill}
          style={{ width: `${(currentEnergy / maxEnergy) * 100}%` }}
        />
      </div>
      <span className={styles.energyText}>
        ⚡ {currentEnergy}/{maxEnergy}
      </span>
    </div>
  );

  const renderAttackButton = (attackType, index, isPlayer) => {
    const attack = ATTACKS[attackType];
    const isCurrentPlayer = isPlayer && currentTurn === "player";
    const isDisabled =
      !isCurrentPlayer || isProcessing || gameState !== "playing";

    const cooldowns = isPlayer ? playerCooldowns : aiCooldowns;
    const energy = isPlayer ? playerEnergy : aiEnergy;
    const isOnCooldown = cooldowns[attackType] > 0;
    const hasEnergy = energy >= attack.energyCost;

    const canUse = isCurrentPlayer && !isOnCooldown && hasEnergy && !isDisabled;

    return (
      <button
        key={index}
        className={`${styles.attackButton} ${!canUse ? styles.disabled : ""}`}
        style={{ backgroundColor: attack.color }}
        onClick={() => (isPlayer ? handlePlayerAttack(index) : null)}
        disabled={!canUse}
        title={`${attack.description} | Energy: ${attack.energyCost} | Cooldown: ${attack.cooldown} turns`}
      >
        <span className={styles.attackIcon}>{attack.icon}</span>
        <span className={styles.attackName}>{attack.name}</span>
        <span className={styles.attackCost}>⚡{attack.energyCost}</span>
        {isOnCooldown && (
          <span className={styles.cooldownIndicator}>
            ⏰{cooldowns[attackType]}
          </span>
        )}
      </button>
    );
  };

  const renderPositionButton = (position) => {
    const pos = POSITIONS[position];
    const isCurrentPosition = playerPosition === position;
    const canChange =
      currentTurn === "player" &&
      !isProcessing &&
      gameState === "playing" &&
      playerPositionChanges < GAME_CONFIG.MAX_POSITION_CHANGES &&
      playerEnergy >= 1;

    // Create easy-to-understand tooltip text
    const getPositionTooltip = (position) => {
      switch (position) {
        case "AGGRESSIVE":
          return (
            `⚔️ AGGRESSIVE Position\n\n` +
            `✅ You deal 50% MORE damage\n` +
            `✅ You take 25% LESS damage\n` +
            `✅ Status effects deal 25% more damage\n` +
            `⚠️ Vulnerable to counter-attacks\n\n` +
            `Cost: 1 Energy\n` +
            `Best for: Dealing maximum damage when you're healthy`
          );

        case "NEUTRAL":
          return (
            `⚖️ NEUTRAL Position\n\n` +
            `✅ Normal damage dealt and taken\n` +
            `✅ 25% more energy regeneration\n` +
            `✅ No special vulnerabilities\n\n` +
            `Cost: 1 Energy\n` +
            `Best for: Balanced gameplay and energy management`
          );

        case "DEFENSIVE":
          return (
            `🛡️ DEFENSIVE Position\n\n` +
            `✅ You take 50% LESS damage\n` +
            `✅ Healing is 25% more effective\n` +
            `⚠️ You deal 25% LESS damage\n` +
            `✅ Immune to critical hits\n\n` +
            `Cost: 1 Energy\n` +
            `Best for: Survival when HP is low`
          );

        default:
          return pos.name;
      }
    };

    return (
      <button
        key={position}
        className={`${styles.positionButton} ${isCurrentPosition ? styles.activePosition : ""} ${!canChange ? styles.disabled : ""}`}
        onClick={() => handlePositionChange(position)}
        disabled={!canChange}
        title={getPositionTooltip(position)}
      >
        <span className={styles.positionIcon}>{pos.icon}</span>
        <span className={styles.positionName}>{pos.name}</span>
      </button>
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Strategic Battle Swap</h1>
      <p className={styles.description}>
        Master the tactical combat system! Manage energy, cooldowns, and
        positioning to outmaneuver your opponent.
      </p>

      {/* Game Status */}
      <div className={styles.gameStatus}>
        <div className={styles.turnInfo}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Turn:</span>
            <span
              className={`${styles.statusValue} ${currentTurn === "player" ? styles.playerTurn : styles.aiTurn}`}
            >
              {currentTurn === "player" ? "Your Turn" : "AI Turn"}
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>Turn:</span>
            <span className={styles.statusValue}>{turnCount}</span>
          </div>
        </div>
        {lastAction && <div className={styles.lastAction}>{lastAction}</div>}
      </div>

      {/* Battle Arena */}
      <div className={styles.battleArena}>
        {/* AI Side */}
        <div className={styles.aiSide}>
          <div className={styles.characterInfo}>
            <div className={styles.characterName}>AI-Tron</div>
            {renderHealthBar(aiHP, GAME_CONFIG.AI_MAX_HP, false)}
            {renderEnergyBar(aiEnergy, GAME_CONFIG.MAX_ENERGY)}

            {/* AI Position */}
            <div className={styles.positionDisplay}>
              <span className={styles.positionLabel}>Position:</span>
              <span className={styles.positionValue}>
                {POSITIONS[aiPosition].icon} {POSITIONS[aiPosition].name}
              </span>
            </div>

            <div className={styles.attacksContainer}>
              <h3>AI-Tron's Attacks:</h3>
              <div className={styles.attacksRow}>
                {aiAttacks.map((attack, index) =>
                  renderAttackButton(attack, index, false)
                )}
              </div>
            </div>

            {/* AI Status Indicators */}
            {(aiShield > 0 || aiPoison > 0 || aiBurn > 0 || aiCurse) && (
              <div className={styles.aiStatusRight}>
                {aiShield > 0 && (
                  <div
                    className={styles.aiStatusRightItem}
                    style={{ backgroundColor: "#3498db" }}
                  >
                    🛡️ {aiShield}
                  </div>
                )}
                {aiPoison > 0 && (
                  <div
                    className={styles.aiStatusRightItem}
                    style={{ backgroundColor: "#8b4513" }}
                  >
                    ☠️ {aiPoison}
                  </div>
                )}
                {aiBurn > 0 && (
                  <div
                    className={styles.aiStatusRightItem}
                    style={{ backgroundColor: "#ff4500" }}
                  >
                    🔥 {aiBurn}
                  </div>
                )}
                {aiCurse && (
                  <div
                    className={styles.aiStatusRightItem}
                    style={{ backgroundColor: "#8e44ad" }}
                  >
                    👻
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.characterImage}>
            <img src="/AI-Tron.png" alt="AI-Tron" />
          </div>
        </div>

        {/* Player Side */}
        <div className={styles.playerSide}>
          <div className={styles.characterImage}>
            <img src="/Player.png" alt="Player" />
          </div>
          <div className={styles.characterInfo}>
            <div className={styles.characterName}>You</div>
            {renderHealthBar(playerHP, GAME_CONFIG.PLAYER_MAX_HP, true)}
            {renderEnergyBar(playerEnergy, GAME_CONFIG.MAX_ENERGY)}

            {/* Player Position */}
            <div className={styles.positionDisplay}>
              <span className={styles.positionLabel}>Position:</span>
              <span className={styles.positionValue}>
                {POSITIONS[playerPosition].icon}{" "}
                {POSITIONS[playerPosition].name}
              </span>
            </div>

            {/* Player Status Indicators */}
            <div className={styles.playerStatusRow}>
              {playerShield > 0 && (
                <div className={styles.playerStatusItem}>
                  <span className={styles.playerStatusIcon}>🛡️</span>
                  <span className={styles.playerStatusText}>
                    {playerShield}
                  </span>
                </div>
              )}
              {playerPoison > 0 && (
                <div className={styles.playerStatusItem}>
                  <span className={styles.playerStatusIcon}>☠️</span>
                  <span className={styles.playerStatusText}>
                    {playerPoison}
                  </span>
                </div>
              )}
              {playerBurn > 0 && (
                <div className={styles.playerStatusItem}>
                  <span className={styles.playerStatusIcon}>🔥</span>
                  <span className={styles.playerStatusText}>{playerBurn}</span>
                </div>
              )}
              {playerCurse && (
                <div className={styles.playerStatusItem}>
                  <span className={styles.playerStatusIcon}>👻</span>
                  <span className={styles.playerStatusText}>CURSE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom UI Panel */}
        <div className={styles.bottomPanel}>
          {/* Position Controls */}
          <div className={styles.positionContainer}>
            <div className={styles.positionText}>Choose Position:</div>
            <div className={styles.positionButtons}>
              {Object.keys(POSITIONS).map((position) =>
                renderPositionButton(position)
              )}
            </div>
          </div>

          {/* Action Controls */}
          <div className={styles.actionContainer}>
            <div className={styles.swapContainer}>
              <div className={styles.swapText}>Actions:</div>
              <button
                className={`${styles.swapButton} ${swapCooldown > 0 || currentTurn !== "player" || isProcessing || gameState !== "playing" ? styles.disabled : ""}`}
                onClick={handleSwapAttacks}
                disabled={
                  swapCooldown > 0 ||
                  currentTurn !== "player" ||
                  isProcessing ||
                  gameState !== "playing"
                }
                title={
                  swapCooldown > 0
                    ? `Swap on cooldown: ${swapCooldown} turns`
                    : "Swap Attacks"
                }
              >
                <IoSwapVertical />
                {swapCooldown > 0 && (
                  <span className={styles.cooldownText}>{swapCooldown}</span>
                )}
              </button>
            </div>
          </div>

          {/* Player Attacks */}
          <div className={styles.playerAttacksContainer}>
            <div className={styles.attacksRow}>
              {playerAttacks.map((attack, index) => (
                <button
                  key={index}
                  className={`${styles.attackButton} ${currentTurn !== "player" || isProcessing || gameState !== "playing" || playerCooldowns[attack] > 0 || playerEnergy < getAttackEnergyCost(attack) ? styles.disabled : ""}`}
                  onClick={() => handlePlayerAttack(index)}
                  disabled={
                    currentTurn !== "player" ||
                    isProcessing ||
                    gameState !== "playing" ||
                    playerCooldowns[attack] > 0 ||
                    playerEnergy < getAttackEnergyCost(attack)
                  }
                  title={`${ATTACKS[attack].description} | Energy: ${getAttackEnergyCost(attack)} | Cooldown: ${getAttackCooldown(attack)} turns`}
                  style={{ backgroundColor: ATTACKS[attack].color }}
                >
                  <span className={styles.attackIcon}>
                    {ATTACKS[attack].icon}
                  </span>
                  <span className={styles.attackName}>
                    {ATTACKS[attack].name}
                  </span>
                  <span className={styles.attackCost}>
                    ⚡{getAttackEnergyCost(attack)}
                  </span>
                  {playerCooldowns[attack] > 0 && (
                    <span className={styles.cooldownIndicator}>
                      ⏰{playerCooldowns[attack]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Swap Modal */}
      <Modal
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        title="Swap Attacks"
        className={styles.swapModal}
      >
        <div className={styles.swapContent}>
          <p>Choose which attacks to swap:</p>

          <div className={styles.swapGrid}>
            <div className={styles.swapColumn}>
              <h4>Your Attacks:</h4>
              {playerAttacks.map((attack, index) => (
                <button
                  key={`player-${index}`}
                  className={`${styles.swapButton} ${selectedPlayerAttack === index ? styles.selected : ""}`}
                  style={{ backgroundColor: ATTACKS[attack].color }}
                  onClick={() => setSelectedPlayerAttack(index)}
                >
                  <span className={styles.attackIcon}>
                    {ATTACKS[attack].icon}
                  </span>
                  <span className={styles.attackName}>
                    {ATTACKS[attack].name}
                  </span>
                </button>
              ))}
            </div>

            <div className={styles.swapColumn}>
              <h4>AI Attacks:</h4>
              {aiAttacks.map((attack, index) => (
                <button
                  key={`ai-${index}`}
                  className={`${styles.swapButton} ${selectedAIAttack === index ? styles.selected : ""}`}
                  style={{ backgroundColor: ATTACKS[attack].color }}
                  onClick={() => setSelectedAIAttack(index)}
                >
                  <span className={styles.attackIcon}>
                    {ATTACKS[attack].icon}
                  </span>
                  <span className={styles.attackName}>
                    {ATTACKS[attack].name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.swapActions}>
            <p className={styles.swapValidation}>
              {selectedPlayerAttack === null && selectedAIAttack === null
                ? "Select one attack from each side to swap"
                : selectedPlayerAttack === null
                  ? "Select one of your attacks"
                  : selectedAIAttack === null
                    ? "Select one AI attack"
                    : "Ready to swap!"}
            </p>
            <div className={styles.modalButtons}>
              <Button
                variant="primary"
                onClick={performSwap}
                disabled={
                  selectedPlayerAttack === null || selectedAIAttack === null
                }
              >
                Swap Attacks
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowSwapModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Game Over Modal */}
      <Modal
        isOpen={showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        title="Game Over"
      >
        <div className={styles.gameOverContent}>
          <h2>{playerHP <= 0 ? "You Lost!" : "You Won!"}</h2>
          <p>
            {playerHP <= 0
              ? "The AI defeated you! Try a different strategy."
              : "You defeated the AI! Well played!"}
          </p>
          <div className={styles.modalButtons}>
            <Button variant="primary" onClick={resetGame}>
              Play Again
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BattleSwap;
