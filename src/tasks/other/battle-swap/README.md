# Battle Swap

A strategic turn-based battle game inspired by Pokemon, where players can swap attacks with their AI opponent to gain tactical advantages.

## Game Mechanics

### Objective

Defeat the AI monster by reducing their HP to 0 while keeping your own HP above 0.

### Starting Conditions

- **Player starts with:** Self Damage, Weak Heal, Weak Shield, Weak Poison (weaker set)
- **AI starts with:** Heal, Shield, Poison, Double Strike (stronger set)
- Both players have 100 HP

### Attacks

#### Strong Attacks (AI starts with these)

#### 1. Heal 💚

- **Effect:** Restore 30 HP to yourself
- **Strategy:** Use when your HP is low to stay in the game

#### 2. Shield 🛡️

- **Effect:** Block 35 damage from the next attack
- **Strategy:** Use before the opponent attacks to reduce incoming damage

#### 3. Poison ☠️

- **Effect:** Apply a poison debuff that deals 25 damage at the start of the opponent's turn (ignores shields)
- **Strategy:** Use to bypass shields and apply consistent damage over time

#### 4. Double Strike ⚡

- **Effect:** Deal 15 damage twice
- **Strategy:** High burst damage that can't be fully blocked by shields

#### Weak Attacks (Player starts with these)

#### 5. Weak Heal 💚

- **Effect:** Restore 15 HP to yourself
- **Strategy:** Basic healing, less effective than regular Heal

#### 6. Weak Shield 🛡️

- **Effect:** Block 20 damage from the next attack
- **Strategy:** Basic defense, less effective than regular Shield

#### 7. Weak Poison ☠️

- **Effect:** Apply a poison debuff that deals 15 damage at the start of the opponent's turn (ignores shields)
- **Strategy:** Basic poison, less effective than regular Poison

#### 8. Self Damage 💔

- **Effect:** Apply a debuff that makes the opponent take 25 damage at the start of their turn
- **Strategy:** Use when the opponent doesn't have a shield to apply pressure

### Turn Structure

1. **Start of Turn:** Apply any active debuffs (poison, self damage)
2. **Action Phase:** Choose to either:
   - Use one of your attacks
   - Swap attacks with the opponent
3. **End Turn:** Pass control to the opponent

### Attack Swapping

- You can use your turn to swap one of your attacks with one of the AI's attacks
- This is crucial for gaining better attacks and removing harmful ones
- The AI will also strategically swap attacks based on the game state

## Strategy Tips

### Early Game

- **Priority:** Swap away from Self Damage attacks to get better options
- **Target:** Try to get Heal or Shield attacks early

### Mid Game

- **Shield Management:** Use shields before the opponent attacks
- **Poison Timing:** Apply poison when the opponent has no shield
- **Healing:** Heal when your HP drops below 50

### Late Game

- **Pressure:** Use Self Damage when the opponent is low on HP
- **Defense:** Keep shields up to prevent lethal damage
- **Finishing:** Use poison to bypass final defenses

### Advanced Tactics

- **Shield Bypass:** Poison ignores shields, making it valuable against defensive opponents
- **Debuff Stacking:** Multiple poison/self damage debuffs can quickly drain HP
- **Attack Denial:** Swap away powerful attacks from the opponent

## AI Behavior

The AI uses strategic decision-making:

- **Swapping Logic:** Prioritizes getting rid of Self Damage, acquiring healing when low HP, and getting poison to bypass shields
- **Attack Selection:** Heals when low HP, uses poison against shields, uses shield against poison, applies self damage when safe
- **Adaptation:** Changes strategy based on current game state and available attacks

## Balance Notes

The game is designed to be balanced with no dominant strategy:

- **Heal:** Provides sustainability but uses a turn
- **Shield:** Blocks damage but can be bypassed by poison
- **Poison:** Consistent damage but can be blocked by healing
- **Self Damage:** High pressure but can be blocked by shields

The starting attack distribution (both players have balanced sets) creates strategic depth through the swapping mechanic.
