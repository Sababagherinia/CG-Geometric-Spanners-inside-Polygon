import { minimumEnclosingDisc, enclosingDiscRadius } from "./enclosing_disc";
// import { Point } from "./classes";

const Points = [
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: 1 },
  { x: 0, y: 0 },
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: -0.5 },
  { x: -0.5, y: 0.5 },
  { x: -0.5, y: -0.5 },
  { x: 0.2, y: 0.3 },
  { x: -0.2, y: -0.3},
  { x: 0.3, y: -0.2 },
  { x: -0.3, y: 0.2 },
  { x: 1.5, y: 1 },
  { x: 1.5, y: -1.8 },
];

const circle = minimumEnclosingDisc(Points);
console.log("Center:", circle.center, "Radius:", circle.radius);

const radiusOnly = enclosingDiscRadius(Points);
console.log("Radius only:", radiusOnly);