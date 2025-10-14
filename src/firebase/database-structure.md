# Database Structure Proposal

## Overview

Organize data hierarchically by Season → Game → User for better management and readability.

## Proposed Structure

```
/seasons/
  /SeasonTest/                    # Season document
    - seasonNumber: 1
    - name: "SeasonTest"
    - isActive: true
    - currentRound: 3
    - totalRounds: 10
    - startDate: timestamp
    - endDate: timestamp
    - description: "Testing season"

    /games/                       # Subcollection of games in this season
      /theKeeper8/                # Game document (gameName + roundNumber)
        - gameId: "theKeeper"
        - roundNumber: 8
        - status: "current" | "completed" | "upcoming"
        - releasedAt: timestamp
        - isActive: true
        - config: {...}           # Game-specific configuration

        /users/                   # Subcollection of user submissions
          /user123/               # User document (userId)
            - userId: "user123"
            - userName: "John Doe"
            - userEmail: "john@example.com"
            - openedAt: timestamp
            - submittedAt: timestamp
            - score: 85
            - answer: "user's answer"
            - attempts: 3
            - timeSpent: 1200     # seconds
            - hintsUsed: 1
            - completed: true

          /user456/
            - userId: "user456"
            - userName: "Jane Smith"
            - userEmail: "jane@example.com"
            - openedAt: timestamp
            - submittedAt: null   # Not submitted yet
            - score: null
            - answer: null
            - attempts: 0
            - timeSpent: 0
            - hintsUsed: 0
            - completed: false

      /patternSolver9/
        - gameId: "patternSolver"
        - roundNumber: 9
        - status: "upcoming"
        - releasedAt: null
        - isActive: false

        /users/
          /user123/
            - userId: "user123"
            - userName: "John Doe"
            - userEmail: "john@example.com"
            - openedAt: null      # Not opened yet
            - submittedAt: null
            - score: null
            - answer: null
            - attempts: 0
            - timeSpent: 0
            - hintsUsed: 0
            - completed: false

    /participants/                # Subcollection of season participants
      /user123/
        - userId: "user123"
        - userName: "John Doe"
        - userEmail: "john@example.com"
        - participating: true
        - joinedAt: timestamp
        - totalScore: 245
        - gamesPlayed: 7
        - gamesCompleted: 6

      /user456/
        - userId: "user456"
        - userName: "Jane Smith"
        - userEmail: "jane@example.com"
        - participating: true
        - joinedAt: timestamp
        - totalScore: 180
        - gamesPlayed: 5
        - gamesCompleted: 4

  /Season2/                       # Another season
    - seasonNumber: 2
    - name: "Season2"
    - isActive: false
    - currentRound: 10
    - totalRounds: 10
    - startDate: timestamp
    - endDate: timestamp

    /games/
      /theKeeper1/
        /users/
          /user123/
            - userId: "user123"
            - userName: "John Doe"
            - userEmail: "john@example.com"
            - openedAt: timestamp
            - submittedAt: timestamp
            - score: 92
            - answer: "user's answer"
            - attempts: 2
            - timeSpent: 900
            - hintsUsed: 0
            - completed: true

/users/                           # Global user profiles
  /user123/
    - uid: "user123"
    - email: "john@example.com"
    - displayName: "John Doe"
    - createdAt: timestamp
    - isAdmin: false
    - participating: true
    - currentSeason: "SeasonTest"

  /user456/
    - uid: "user456"
    - email: "jane@example.com"
    - displayName: "Jane Smith"
    - createdAt: timestamp
    - isAdmin: false
    - participating: true
    - currentSeason: "SeasonTest"
```

## Benefits of This Structure

1. **Clear Hierarchy**: Season → Game → User makes it easy to navigate
2. **Isolated Data**: Each season's data is completely separate
3. **Easy Queries**: Can easily query all users for a specific game/season
4. **Scalable**: Can add new seasons without affecting existing data
5. **Readable**: Document names clearly indicate what they contain
6. **Flexible**: Easy to add new fields or modify structure per season

## Query Examples

```javascript
// Get all users who opened a specific game
const gameUsers = await getDocs(
  collection(db, "seasons", "SeasonTest", "games", "theKeeper8", "users")
);

// Get a specific user's submission for a game
const userSubmission = await getDoc(
  doc(db, "seasons", "SeasonTest", "games", "theKeeper8", "users", "user123")
);

// Get all games in a season
const seasonGames = await getDocs(
  collection(db, "seasons", "SeasonTest", "games")
);

// Get all participants in a season
const seasonParticipants = await getDocs(
  collection(db, "seasons", "SeasonTest", "participants")
);

// Get user's total score for a season
const userSeasonData = await getDoc(
  doc(db, "seasons", "SeasonTest", "participants", "user123")
);
```

## Migration Strategy

1. Create new structure alongside existing data
2. Write migration scripts to move data
3. Update application code to use new structure
4. Test thoroughly
5. Remove old structure once confirmed working

Would you like me to implement this structure and create the necessary utility functions?
