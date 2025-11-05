// import { minimumEnclosingDisc, enclosingDiscRadius } from "./enclosing_disc";
// import { Point } from "./classes";

// const Points = [
//   new Point(0, 0),
//   new Point(1, 0),
//   new Point(0, 1),
//   new Point(1, 1),
//   new Point(0.5, 0.5)
// ];

// const circle = minimumEnclosingDisc(Points);
// console.log("Center:", circle.center, "Radius:", circle.radius);

// const radiusOnly = enclosingDiscRadius(Points);
// console.log("Radius only:", radiusOnly);

import { computeSSPD } from "./sspd";

const projectedPoints = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 5, y: 0 },
  { x: 6, y: 0 },
  { x: 9, y: 0 }
];

const epsilon = 1; // desired stretch precision
const pairs = computeSSPD(projectedPoints, epsilon);

console.log("Computed s-SSPD pairs:");
pairs.forEach(([A, B], i) => {
  console.log(`Pair ${i + 1}: A(${A.length}) – B(${B.length})`);
});