import { minimumEnclosingDisc, enclosingDiscRadius } from "./enclosing_disc";
import { Point } from "./classes";

const Points = [
  new Point(0, 0),
  new Point(1, 0),
  new Point(0, 1),
  new Point(1, 1),
  new Point(0.5, 0.5)
];

const circle = minimumEnclosingDisc(Points);
console.log("Center:", circle.center, "Radius:", circle.radius);

const radiusOnly = enclosingDiscRadius(Points);
console.log("Radius only:", radiusOnly);