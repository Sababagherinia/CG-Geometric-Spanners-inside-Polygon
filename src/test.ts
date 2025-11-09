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

const epsilon = 1; // desired stretch precision/bigger epsilon means more pairs smaller epsilon means less pairs

// Create three spatially separated 2D clusters
const points = [
  // Cluster 1
  { x: 0,  y: 0 }, { x: 1,  y: 2 }, { x: -1, y: 1 },
  { x: 2,  y: -1 }, { x: -2, y: -1 },

  // Cluster 2
  { x: 20, y: 5 }, { x: 22, y: 7 }, { x: 18, y: 6 },
  { x: 21, y: 3 }, { x: 19, y: 4 },

  // Cluster 3
  { x: 45, y: 15 }, { x: 47, y: 17 }, { x: 43, y: 14 },
  { x: 46, y: 13 }, { x: 44, y: 16 }
];


const pairs = computeSSPD(points, epsilon);

console.log(`ε = ${epsilon}, s = ${4 / epsilon}`);
console.log(`Found ${pairs.length} s-semi-separated pairs:\n`);

pairs.forEach(([A, B], i) => {
  const centersA = A.map(p => `(${p.x},${p.y})`).join(", ");
  const centersB = B.map(p => `(${p.x},${p.y})`).join(", ");
  console.log(`Pair ${i + 1}:`);
  console.log(`  A[${A.length}]: ${centersA}`);
  console.log(`  B[${B.length}]: ${centersB}\n`);
});
