import NumberCode from "../tasks/season2/number-code/index";
import OrderChaos from "../tasks/season2/order-chaos/index";
import PatternSolver from "../tasks/season2/pattern-solver";
import InvestigationMystery from "../tasks/season2/investigation-mystery/index";
import LogicGrid from "../tasks/season2/logic-grid/index";
import PatternMatrix from "../tasks/season2/pattern-matrix/index";
import TheKeeper from "../tasks/season2/the-keeper/index";
import SOS from "../tasks/season2/sos/index";
import Triads from "../tasks/season2/triads/index";
import BuildingBlocks from "../tasks/season2/building-blocks/index";

const NUM_GAMES = 10;

// Game definitions with their components and metadata
const gameDefinitions = [
  {
    id: "building-blocks",
    name: "Building Blocks",
    component: BuildingBlocks,
    description: "But what are we building?",
  },
  {
    id: "number-code",
    name: "Number Code",
    component: NumberCode,
    description: "Someone is trying to tell you something.",
  },
  {
    id: "order-chaos",
    name: "Order & Chaos",
    component: OrderChaos,
    description: "Stop the AIs uprising.",
  },
  {
    id: "pattern-solver",
    name: "Pattern Solver",
    component: PatternSolver,
    description: "Look at all the pretty patterns.",
  },
  {
    id: "investigation-mystery",
    name: "Investigation Mystery",
    component: InvestigationMystery,
    description:
      "Solve the mystery by completing various mini-games and gathering evidence.",
  },
  {
    id: "logic-grid",
    name: "Logic Grid",
    component: LogicGrid,
    description: "Bring back legendary agents from their missions abroad.",
  },
  {
    id: "pattern-matrix",
    name: "Pattern Matrix",
    component: PatternMatrix,
    description: "To understand is to perceive patterns.",
  },
  {
    id: "the-keeper",
    name: "The Keeper",
    component: TheKeeper,
    description: "GET. OUT.",
  },
  {
    id: "sos",
    name: "S.O.S",
    component: SOS,
    description: "Asking for help is not a sign of weakness.",
  },
  {
    id: "triads",
    name: "TRIADS",
    component: Triads,
    description: "Omne trium perfectum.",
  },
];

// Default status for games (fallback when database is not available)
const defaultGameStatuses = [
  { status: "current", placement: null }, // Building Blocks
  { status: "completed", placement: 2 }, // Number Code
  { status: "completed", placement: 1 }, // Order & Chaos
  { status: "completed", placement: 3 }, // Pattern Solver
  { status: "completed", placement: 4 }, // Investigation Mystery
  { status: "completed", placement: 5 }, // Logic Grid
  { status: "completed", placement: 6 }, // Pattern Matrix
  { status: "completed", placement: 7 }, // The Keeper
  { status: "completed", placement: 8 }, // S.O.S
  { status: "completed", placement: 9 }, // TRIADS
];

export const games = Array.from({ length: NUM_GAMES }).map((_, idx) => {
  const gameDef = gameDefinitions[idx];
  const defaultStatus = defaultGameStatuses[idx];

  if (!gameDef) {
    return {
      name: `Game ${idx + 1}`,
      component: null,
      status: "upcoming",
      placement: null,
    };
  }

  return {
    name: gameDef.name,
    component: gameDef.component, // Just return the component, we'll wrap it later
    status: defaultStatus?.status || "upcoming",
    placement: defaultStatus?.placement,
    id: gameDef.id,
    description: gameDef.description,
  };
});

export { NUM_GAMES };

// Function to update games with database status (to be called from components)
export const updateGamesWithDatabaseStatus = async (games, seasonGames) => {
  return games.map((game, idx) => {
    const dbGame = seasonGames.find((g) => g.roundNumber === idx + 1);

    if (dbGame) {
      return {
        ...game,
        status: dbGame.status || game.status,
        placement: dbGame.placement || game.placement,
        releasedAt: dbGame.releasedAt,
        isActive: dbGame.isActive,
      };
    }

    return game;
  });
};
