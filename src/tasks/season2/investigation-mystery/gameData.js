// Investigation Mystery Game Data
// This file contains all the configurable data for each mini-game
// Modify this file to change answers, hints, and content

// Mystery data - different cases with clues and answers
export const MYSTERIES = [
  {
    id: 1,
    title: "The Missing Artifact",
    description:
      "A valuable historical artifact has disappeared from the museum. I need you to solve the mystery.",
  },
];

// Countries list for autocomplete
export const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Brazil",
  "Bulgaria",
  "Cambodia",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Ecuador",
  "Egypt",
  "Estonia",
  "Ethiopia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Latvia",
  "Lebanon",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Norway",
  "Pakistan",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Venezuela",
  "Vietnam",
];

// Connections game data for "Who" mini-game
export const CONNECTIONS_DATA = {
  categories: [
    {
      id: 1,
      name: "Doctors",
      words: ["Dre", "Evil", "Pepper", "Seuss"],
      color: "yellow", // Easy
      revealed: false,
    },
    {
      id: 2,
      name: "Associated with Freud",
      words: ["Dreams", "Id", "Oedipus", "Slip"],
      color: "green", // Medium
      revealed: false,
    },
    {
      id: 3,
      name: "___Stone",
      words: ["Birth", "Key", "Corner", "Wet"],
      color: "blue", // Hard
      revealed: false,
    },
    {
      id: 4,
      name: "Michael",
      words: ["Jordan", "Jackson", "Fox", "Bay"],
      color: "purple", // Hardest
      revealed: false,
    },
  ],
};

export const MYSTERY_DATA = {
  // When & Where mini-game data
  whenWhere: {
    question:
      "Look at the image to guess when and where this artifact was discovered?",
    imageUrl: "/WhenAndWhere.jpg",
    correctYear: 1957,
    correctCountry: "United Kingdom",
    hints: [
      "Notice any famous persons in the image? Or equipment in the background?",
    ],
    countries: COUNTRIES,
  },

  // What mini-game data (Wordle)
  what: {
    question: "Wordle: What artifact was stolen?",
    targetWord: "SCROLL",
    maxAttempts: 6,
    hint: "Ancient document made from papyrus or parchment",
    keyboardLayout: [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
    ],
  },

  // How mini-game data (Flow Puzzle)
  how: {
    question: "How did they bypass the security system?",
    type: "flow",
    levels: [
      {
        id: 1,
        title: "Security Grid Access",
        size: 10,
        dots: [
          { color: "blue", start: [6, 7], end: [7, 5] },
          { color: "red", start: [5, 1], end: [7, 0] },
          { color: "pink", start: [4, 5], end: [6, 5] },
          { color: "orange", start: [4, 4], end: [7, 2] },
          { color: "yellow", start: [3, 1], end: [9, 0] },
          { color: "brown", start: [8, 0], end: [6, 6] },
          { color: "green", start: [8, 2], end: [7, 4] },
          { color: "cyan", start: [9, 6], end: [5, 7] },
        ],
      },
    ],
    settings: {
      showDragPreview: true,
      allowBridges: true,
      requireFullGrid: true,
    },
    solutionPath: [
      // Start at [3,1]
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 3, col: 5 },
      { row: 3, col: 6 },
      { row: 3, col: 7 },
      { row: 4, col: 7 },
      { row: 5, col: 7 },
      { row: 6, col: 7 },
      { row: 7, col: 7 },
      { row: 8, col: 7 },
      { row: 9, col: 7 },
      { row: 9, col: 6 },
      { row: 9, col: 5 },
      { row: 9, col: 4 },
      { row: 9, col: 3 },
      { row: 9, col: 2 },
      { row: 9, col: 1 },
      { row: 9, col: 0 },
    ],
  },

  // Who mini-game data (Connections)
  who: CONNECTIONS_DATA,
};

export const POINTS_PER_QUESTION = 2;
export const MAX_SCORE = 10;
export const MAX_HINTS_PER_MINIGAME = 2;

// Why mini-game data (Suguru puzzle)
export const WHY_DATA = {
  why: {
    gridSize: 6, // <--- Add this variable for board size
    levels: [
      {
        size: 6,
        regions: [
          {
            cells: [
              [0, 0],
              [0, 1],
              [0, 2],
              [1, 0],
              [1, 1],
            ],
            maxNumber: 5,
            color: "region1",
          },
          {
            cells: [
              [0, 3],
              [0, 4],
              [1, 3],
              [1, 4],
              [2, 3],
            ],
            maxNumber: 5,
            color: "region2",
          },
          {
            cells: [
              [0, 5],
              [1, 5],
              [2, 5],
              [3, 5],
              [2, 4],
            ],
            maxNumber: 5,
            color: "region3",
          },
          {
            cells: [
              [2, 0],
              [3, 0],
            ],
            maxNumber: 2,
            color: "region4",
          },
          {
            cells: [
              [1, 2],
              [2, 1],
              [2, 2],
              [3, 1],
            ],
            maxNumber: 4,
            color: "region5",
          },
          {
            cells: [
              [4, 0],
              [5, 0],
              [5, 1],
            ],
            maxNumber: 3,
            color: "region6",
          },
          {
            cells: [
              [3, 2],
              [4, 1],
              [4, 2],
              [4, 3],
              [5, 2],
            ],
            maxNumber: 5,
            color: "region7",
          },
          {
            cells: [
              [3, 3],
              [3, 4],
              [4, 4],
              [4, 5],
              [5, 5],
            ],
            maxNumber: 5,
            color: "region8",
          },
          {
            cells: [
              [5, 3],
              [5, 4],
            ],
            maxNumber: 2,
            color: "region9",
          },
        ],
        clues: [
          { row: 0, col: 0, value: 1 },
          { row: 0, col: 2, value: 4 },
          { row: 1, col: 5, value: 3 },
          { row: 2, col: 3, value: 3 },
          { row: 4, col: 0, value: 3 },
          { row: 4, col: 2, value: 1 },
          { row: 5, col: 5, value: 3 },
        ],
        solution: [
          [1, 3, 4, 1, 2, 1],
          [2, 5, 2, 5, 4, 3],
          [1, 3, 1, 3, 2, 2],
          [2, 4, 2, 4, 1, 4],
          [3, 5, 1, 3, 5, 2],
          [1, 2, 4, 2, 1, 3],
        ],
      },
    ],
  },
};
