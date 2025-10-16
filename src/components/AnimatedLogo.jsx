import React, { useEffect, useRef } from "react";

const AnimatedLogo = ({ className }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Get all path elements and circle
    const paths = svg.querySelectorAll(".logo-path");
    const circle = svg.querySelector(".logo-circle");

    // Animate letters first
    paths.forEach((path, index) => {
      // Calculate the total length of each path
      const pathLength = path.getTotalLength();

      // Set up the dash array and offset
      path.style.strokeDasharray = `${pathLength}`;
      path.style.strokeDashoffset = `${pathLength}`;

      // Animate each path with a slight delay for sequential drawing
      setTimeout(() => {
        path.style.transition = "stroke-dashoffset 1.5s ease-in-out";
        path.style.strokeDashoffset = "0";
      }, index * 200); // 200ms delay between each path
    });

    // After letters finish drawing, start circle animation
    const totalLetterTime = paths.length * 200 + 1500; // 200ms delay + 1.5s animation per letter

    setTimeout(() => {
      if (circle) {
        // Make circle visible and set up the dotted animation
        circle.style.opacity = "1";
        const circleLength = circle.getTotalLength();
        // Set up for drawing animation (like letters)
        // Use a single long dash that covers the entire circle
        circle.style.strokeDasharray = `${circleLength}`;
        circle.style.strokeDashoffset = `${circleLength}`;
        circle.style.transition = "stroke-dashoffset 4s ease-in-out";
        circle.style.strokeDashoffset = "0";

        // After drawing completes, transition to dotted pattern
        setTimeout(() => {
          circle.style.transition = "stroke-dasharray 0.5s ease-in-out";
          circle.style.strokeDasharray = "3, 2";
          circle.style.strokeDashoffset = "0";
        }, 4000); // 4s for the drawing animation
      }
    }, totalLetterTime);

    // After circle finishes, fill the letters
    setTimeout(() => {
      paths.forEach((path) => {
        path.style.fill = "var(--color-green-bg)";
        path.style.stroke = "none";
      });
    }, totalLetterTime + 2000); // 2s for circle animation
  }, []);

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 60"
      width="60"
      height="60"
      className={className}
    >
      <defs />
      <g
        fill="none"
        stroke="var(--color-green-bg)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g transform="translate(18, 18) scale(0.6)">
          {/* N letter */}
          <path
            className="logo-path"
            d="M13.75 36.75L8.15 23.10Q7.80 22.20 7.30 20.70Q6.80 19.20 6.25 17.40Q5.70 15.60 5.17 13.80Q4.65 12 4.20 10.50Q3.75 9 3.50 8.07Q3.25 7.15 3.25 7.15L0.60 4.45L0.90 1.75L4.40 1.75L9.90 15.15Q10.30 16.15 10.82 17.70Q11.35 19.25 11.90 21.02Q12.45 22.80 12.95 24.52Q13.45 26.25 13.88 27.70Q14.30 29.15 14.55 30.02Q14.80 30.90 14.80 30.90L17.60 34.05L17.20 36.75L13.75 36.75M0 36.75L0 2.65Q0 1.75 0.90 1.75L4.55 2.65L3.90 9.30Q4 10.10 4.08 11.30Q4.15 12.50 4.23 13.92Q4.30 15.35 4.38 16.80Q4.45 18.25 4.48 19.60Q4.50 20.95 4.53 22.05Q4.55 23.15 4.55 23.80L4.55 35.85Q4.55 36.30 4.35 36.48Q4.15 36.65 3.23 36.70Q2.30 36.75 0 36.75M17.20 36.75L13.50 35.85L14.10 28.25Q14 27.35 13.93 26.17Q13.85 25 13.78 23.67Q13.70 22.35 13.65 21Q13.60 19.65 13.57 18.40Q13.55 17.15 13.53 16.10Q13.50 15.05 13.50 14.35L13.50 2.65Q13.50 2.20 13.73 2.02Q13.95 1.85 14.90 1.80Q15.85 1.75 18.05 1.75L18.05 35.85Q18.05 36.75 17.20 36.75Z"
          />

          {/* K letter */}
          <path
            className="logo-path"
            d="M36.50 36.85Q35.75 36.85 34.92 36.80Q34.10 36.75 33.30 36.70Q32.90 34 32.50 31.65Q32.10 29.30 31.55 27.32Q31 25.35 30.23 23.77Q29.45 22.20 28.40 21.05Q27.80 20.40 27.05 20Q26.30 19.60 25.55 19.45L25.55 18.70L33.70 2.05Q34.50 1.85 35.28 1.77Q36.05 1.70 36.60 1.70Q39.10 1.70 38.50 2.95L31.20 16.80Q34.10 19.15 35.90 23.98Q37.70 28.80 38.35 35.80Q38.40 36.35 38.05 36.60Q37.70 36.85 36.50 36.85M21.95 36.75L21.95 2.65Q21.95 2.20 22.15 2.02Q22.35 1.85 23.30 1.80Q24.25 1.75 26.55 1.75L26.55 35.85Q26.55 36.30 26.38 36.48Q26.20 36.65 25.23 36.70Q24.25 36.75 21.95 36.75Z"
          />
        </g>
      </g>

      {/* Dotted circle that draws around the letters */}
      <circle
        className="logo-circle"
        cx="30"
        cy="30"
        r="25"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="2"
        strokeDasharray="5, 3"
        strokeLinecap="butt"
        style={{ strokeDashoffset: "1000", opacity: "0" }}
      />
    </svg>
  );
};

export default AnimatedLogo;
