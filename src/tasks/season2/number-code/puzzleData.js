const puzzle = {
  quote:
    "Man is the only animal for whom his own existence is a problem which he has to solve",
  author: "Erich Fromm",
  occupation: "German Sociologist",
  years: "1900-1980",
  layout: [
    // M A N
    [{ type: "hidden" }, { type: "padlock", dots: 2 }, { type: "hidden" }],
    // I S
    [{ type: "hidden" }, { type: "hidden" }],
    // T H E
    [{ type: "hidden" }, { type: "padlock", dots: 2 }, { type: "hidden" }],
    // O N L Y
    [
      { type: "hidden" },
      { type: "padlock", dots: 2 },
      { type: "hidden" },
      { type: "hidden" },
    ],
    // A N I M A L
    [
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "padlock", dots: 1 },
      { type: "hidden" },
    ],
    // F O R
    [{ type: "hidden" }, { type: "hidden" }, { type: "revealed", letter: "R" }],
    // W H O M
    [
      { type: "hidden" },
      { type: "hidden" },
      { type: "padlock", dots: 2 },
      { type: "hidden" },
    ],
    // H I S
    [{ type: "hidden" }, { type: "padlock", dots: 1 }, { type: "hidden" }],
    // O W N
    [{ type: "hidden" }, { type: "hidden" }, { type: "hidden" }],
    // E X I S T E N C E
    [
      { type: "hidden" },
      { type: "revealed", letter: "X" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
    ],
    // I S
    [{ type: "hidden" }, { type: "hidden" }],
    // A
    [{ type: "hidden" }],
    // P R O B L E M
    [
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "revealed", letter: "M" },
    ],
    // W H I C H
    [
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "revealed", letter: "C" },
      { type: "hidden" },
    ],
    // H E
    [{ type: "hidden" }, { type: "hidden" }],
    // H A S
    [{ type: "hidden" }, { type: "hidden" }, { type: "revealed", letter: "S" }],
    // T O
    [{ type: "hidden" }, { type: "hidden" }],
    // S O L V E
    [
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
      { type: "hidden" },
    ],
  ],
};

export default puzzle;
