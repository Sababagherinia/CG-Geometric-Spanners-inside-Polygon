import { Point} from "./classes";

type Circle = { center: Point; radius: number };

// Helper function to calculate distance between two points
function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// Circle from two points
function circleFromTwoPoints(p1: Point, p2: Point): Circle {
  const center = {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
  const radius = distance(p1, p2) / 2;
  return { center, radius };
}