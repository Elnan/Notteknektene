# Pattern Matrix Save State Testing Guide

## Overview

The Pattern Matrix game now includes a comprehensive save state system that implements smart round progression logic to prevent abuse while allowing players to resume exactly where they left off.

## Key Features

### 1. Smart Round Progression

- **Round Start Tracking**: When a round starts, the system records the start time
- **Automatic Advancement**: If a player closes the browser after a round has started, they advance to the next round when they return
- **Timer-Based Logic**: If paused between rounds when timer expires, player advances to next round

### 2. Save State Logic

#### Scenario 1: Player finishes round 6 and closes browser

- **State**: `lastRoundCompleted: 6, phase: "main", mainRound: 6`
- **Result**: When player returns, they continue from round 7

#### Scenario 2: Player starts round 7, closes browser 3 seconds later

- **State**: `roundStartTime: [timestamp], phase: "main", mainRound: 6`
- **Result**: When player returns, they advance to round 8 (round 7 was considered started)

#### Scenario 3: Player pauses between round 6 and 7, timer expires, closes browser

- **State**: `phase: "pause", lastRoundCompleted: 6, pausedDueToTimer: true`
- **Result**: When player returns, they advance to round 7

## Testing Scenarios

### Test 1: Normal Progression

1. Start Pattern Matrix game
2. Complete practice rounds 1-2
3. Complete main rounds 1-6
4. Close browser
5. **Expected**: Resume at round 7

### Test 2: Round Start Abuse Prevention

1. Start round 7
2. Wait 3 seconds
3. Close browser immediately
4. **Expected**: When returning, advance to round 8 (not stay at round 7)

### Test 3: Pause Between Rounds

1. Complete round 6
2. Pause the game
3. Wait for timer to expire (60+ seconds)
4. Close browser while paused
5. **Expected**: When returning, advance to round 7

### Test 4: Timer Expiration During Round

1. Start round 7
2. Don't answer, let timer run out
3. Close browser during pause overlay
4. **Expected**: When returning, advance to round 8

### Test 5: Long-term Save State

1. Complete 6 rounds
2. Close browser for several days
3. **Expected**: Resume exactly at round 7, no time-based advancement

## Implementation Details

### State Management

The game state includes:

- `roundStartTime`: Timestamp when current round started
- `lastRoundCompleted`: Index of last completed round
- `phase`: Current game phase (rules, practice, main, end, pause)
- `paused`: Whether game is currently paused
- `pausedDueToTimer`: Whether pause was caused by timer expiration

### Smart Logic Function

The `applySmartRoundLogic` function handles:

1. **Round Timeout Detection**: If more than 60 seconds passed since round start
2. **Pause Between Rounds**: If paused and timer expired
3. **Automatic Advancement**: Moves player to appropriate next round

### Auto-Save Features

- **Auto-save every 10 seconds** during active gameplay
- **Save on round completion** to prevent data loss
- **Save on component unmount** for browser close scenarios
- **Manual save/load** via SaveStateManager UI

## Usage

The save state system is automatically integrated into Pattern Matrix. Players will see:

- Loading screen when restoring progress
- Save state manager UI for manual save/load
- Automatic progress restoration
- Smart round advancement based on timing

## Error Handling

- Network errors during save are handled gracefully
- Invalid save states fall back to initial state
- User-friendly error messages for save failures
- Automatic retry mechanisms for transient errors

## Performance

- Efficient state serialization/deserialization
- Minimal Firebase operations
- Smart auto-save scheduling
- Memory-efficient state management
