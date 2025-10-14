import React, { useState, useEffect } from "react";
import styles from "./PatternMatrix.module.css";

// 0 = none, 1 = primary, 2 = secondary
const colorClasses = ["", styles.primary, styles.secondary];

const defaultFigure = [0, 0, 0, 0, 0, 0, 0, 0]; // [top, right, bottom, left, N, E, S, W]

// Helper to get color for SVG
const getColor = (v) => {
  if (v === 1) return "var(--color-green-bg)";
  if (v === 2) return "var(--color-gold)";
  return "var(--color-white)";
};

const PatternFigure = ({
  value,
  onChange,
  interactive = false,
  className = "",
  size = 120,
}) => {
  const [state, setState] = useState(value || defaultFigure);

  // Allow controlled value
  useEffect(() => {
    if (value) setState(value);
  }, [value]);

  // Click handler for segments (0-3)
  const handleSegmentClick = (idx) => {
    if (!interactive) return;
    const next = [...state];
    next[idx] = (next[idx] + 1) % 3;
    setState(next);
    if (onChange) onChange(next);
  };

  // Click handler for squares (4-7)
  const handleSquareClick = (idx) => {
    if (!interactive) return;
    const next = [...state];
    next[idx] = (next[idx] + 1) % 3;
    setState(next);
    if (onChange) onChange(next);
  };

  // Geometry based on size
  const svgSize = 100;
  const scale = size / svgSize;
  const center = svgSize / 2;
  const r = 40; // base radius in SVG units
  const stroke = 2.5;
  const squareSize = 26; // Increased from 22 to 32
  // Place squares so their centers are at the intersection of the circle and cross
  const squareCenters = [
    { x: center, y: center - r }, // N (4)
    { x: center + r, y: center }, // E (5)
    { x: center, y: center + r }, // S (6)
    { x: center - r, y: center }, // W (7)
  ];
  const arcData = [
    { d: describeArc(center, center, r, 0, 90), idx: 0 },
    { d: describeArc(center, center, r, 90, 180), idx: 1 },
    { d: describeArc(center, center, r, 180, 270), idx: 2 },
    { d: describeArc(center, center, r, 270, 360), idx: 3 },
  ];

  return (
    <div
      className={styles.figureWrapper + " " + className}
      style={{ width: size, height: size, position: "relative" }}
    >
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        width={size}
        height={size}
        style={{ display: "block" }}
      >
        {arcData.map(({ d, idx }) => (
          <path
            key={idx}
            d={d}
            fill={getColor(state[idx])}
            stroke="var(--color-black)"
            strokeWidth={stroke}
            onClick={() => handleSegmentClick(idx)}
            style={{
              cursor: interactive ? "pointer" : "default",
              transition: "fill 0.2s",
            }}
          />
        ))}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--color-black)"
          strokeWidth={stroke}
          pointerEvents="none"
        />
      </svg>
      {/* Squares (N, E, S, W) */}
      {squareCenters.map((pos, i) => (
        <div
          key={i + 4}
          className={
            styles.figurePiece +
            " " +
            styles.figureSquare +
            " " +
            colorClasses[state[i + 4]]
          }
          style={{
            position: "absolute",
            width: squareSize * scale,
            height: squareSize * scale,
            boxSizing: "border-box",
            border: `${stroke * scale}px solid var(--color-black)`,
            borderRadius: 6 * scale,
            background: getColor(state[i + 4]),
            cursor: interactive ? "pointer" : "default",
            left: `calc(${pos.x * scale}px - ${(squareSize * scale) / 2}px)`,
            top: `calc(${pos.y * scale}px - ${(squareSize * scale) / 2}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
            zIndex: 2,
          }}
          onClick={() => handleSquareClick(i + 4)}
        />
      ))}
    </div>
  );
};

// Helper: describe an SVG arc (for a pie segment)
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    cx,
    cy,
    "L",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
}
function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

export default PatternFigure;
