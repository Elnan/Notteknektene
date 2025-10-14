// Game configuration for TRIADS - Card matching game
// Players find sets of 3 cards where each feature is either all the same or all different

const TRIAD_FEATURES = {
  COLORS: ["red", "green", "gold"],
  NUMBERS: [1, 2, 3],
  SHAPES: ["square", "circle", "triangle"],
  SHADINGS: ["outlined", "striped", "solid"],
};

// Validate card properties
function validateCard(card) {
  if (!TRIAD_FEATURES.NUMBERS.includes(card.number)) {
    throw new Error(
      `Invalid number: ${card.number}. Must be one of ${TRIAD_FEATURES.NUMBERS.join(", ")}`
    );
  }
  if (!TRIAD_FEATURES.COLORS.includes(card.color)) {
    throw new Error(
      `Invalid color: ${card.color}. Must be one of ${TRIAD_FEATURES.COLORS.join(", ")}`
    );
  }
  if (!TRIAD_FEATURES.SHAPES.includes(card.shape)) {
    throw new Error(
      `Invalid shape: ${card.shape}. Must be one of ${TRIAD_FEATURES.SHAPES.join(", ")}`
    );
  }
  if (!TRIAD_FEATURES.SHADINGS.includes(card.shading)) {
    throw new Error(
      `Invalid shading: ${card.shading}. Must be one of ${TRIAD_FEATURES.SHADINGS.join(", ")}`
    );
  }
  return true;
}

// Helper function to create a card
function createCard(number, color, shape, shading) {
  const card = { number, color, shape, shading };
  validateCard(card);
  return card;
}

// Helper function to check if a triad is valid
function isValidTriad(card1, card2, card3) {
  const features = ["number", "color", "shape", "shading"];

  for (const feature of features) {
    const values = [card1[feature], card2[feature], card3[feature]];
    const uniqueValues = new Set(values);

    // A feature is valid if all values are the same OR all values are different
    if (uniqueValues.size !== 1 && uniqueValues.size !== 3) {
      return false;
    }
  }
  return true;
}

// Helper function to find all valid triads in a set of cards
function findValidTriads(cards) {
  const triads = [];
  for (let i = 0; i < cards.length - 2; i++) {
    for (let j = i + 1; j < cards.length - 1; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (isValidTriad(cards[i], cards[j], cards[k])) {
          triads.push([cards[i], cards[j], cards[k]]);
        }
      }
    }
  }
  return triads;
}

const rounds = [
  {
    // Round 1
    cards: [
      createCard(2, "red", "square", "solid"),
      createCard(2, "red", "triangle", "solid"),
      createCard(3, "green", "triangle", "striped"),
      createCard(1, "green", "circle", "striped"),
      createCard(3, "gold", "circle", "striped"),
      createCard(1, "green", "square", "solid"),
      createCard(3, "gold", "square", "striped"),
      createCard(2, "green", "circle", "outlined"),
      createCard(3, "green", "circle", "solid"),
      createCard(1, "gold", "square", "solid"),
      createCard(1, "red", "triangle", "outlined"),
      createCard(3, "gold", "circle", "outlined"),
    ],
    maxTriads: 4,
  },
  {
    // Round 2
    cards: [
      createCard(1, "red", "triangle", "striped"),
      createCard(3, "green", "square", "solid"),
      createCard(1, "gold", "circle", "outlined"),
      createCard(2, "green", "square", "striped"),
      createCard(1, "gold", "square", "solid"),
      createCard(2, "red", "circle", "solid"),
      createCard(3, "red", "square", "solid"),
      createCard(1, "red", "circle", "outlined"),
      createCard(3, "gold", "triangle", "outlined"),
      createCard(3, "gold", "square", "solid"),
      createCard(2, "gold", "triangle", "striped"),
      createCard(1, "gold", "triangle", "striped"),
    ],
    maxTriads: 4,
  },
  {
    // Round 3
    cards: [
      createCard(1, "red", "circle", "striped"),
      createCard(2, "green", "circle", "striped"),
      createCard(3, "red", "square", "outlined"),
      createCard(3, "green", "square", "solid"),
      createCard(3, "green", "circle", "outlined"),
      createCard(1, "green", "triangle", "solid"),
      createCard(2, "green", "square", "striped"),
      createCard(1, "red", "circle", "solid"),
      createCard(3, "green", "square", "outlined"),
      createCard(3, "gold", "square", "outlined"),
      createCard(2, "red", "circle", "striped"),
      createCard(2, "green", "triangle", "solid"),
    ],
    maxTriads: 4,
  },
];

// Helper function to create a round
function createRound(cards, maxTriads = 4) {
  // Validate all cards
  cards.forEach(validateCard);

  // Check that we have exactly 12 cards
  if (cards.length !== 12) {
    throw new Error(`Round must have exactly 12 cards, got ${cards.length}`);
  }

  return {
    cards,
    maxTriads,
  };
}

// Calculate solutions for each round
const solutions = rounds.map((round) => findValidTriads(round.cards));

export {
  TRIAD_FEATURES,
  createCard,
  isValidTriad,
  findValidTriads,
  validateCard,
  createRound,
};
export default rounds;
export { solutions };
