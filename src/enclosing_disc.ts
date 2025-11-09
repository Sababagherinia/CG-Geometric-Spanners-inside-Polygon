// Welzl's algorithm for Minimum Enclosing Disc running in expected O(n) time
import { Point} from "./classes";
import { eucl_distance } from "./utils";

// A small epsilon for floating point comparisons
const EPSILON = 1e-9;

// Circle type
type Circle = { center: Point; radius: number };

// --- Helper Functions ---

// // Compute Euclidean distance between two points
// function eucl_distance(p1: Point, p2: Point): number {
//   return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
// }
// Circle from two points
function circleFromTwoPoints(p1: Point, p2: Point): Circle {
  const center = {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
  const radius = eucl_distance(p1, p2) / 2;
  return { center, radius };
}

// Circle from three non-collinear points
function circleFromThreePoints(p1: Point, p2: Point, p3: Point): Circle | null {
  const A = p2.x - p1.x;
  const B = p2.y - p1.y;
  const C = p3.x - p1.x;
  const D = p3.y - p1.y;
// Determinant
  const E = A * (p1.x + p2.x) + B * (p1.y + p2.y);
  const F = C * (p1.x + p3.x) + D * (p1.y + p3.y);
  const G = 2 * (A * (p3.y - p2.y) - B * (p3.x - p2.x));
// Check for collinearity
  if (Math.abs(G) < EPSILON) {
    return null; // Collinear points
  }
// Center calculation
  const cx = (D * E - B * F) / G;
  const cy = (A * F - C * E) / G;
  const center = { x: cx, y: cy };
  const radius = eucl_distance(center, p1);
  return { center, radius };
}

// Check if a point lies inside or on a circle
function isInCircle(p: Point, circle: Circle): boolean {
  return eucl_distance(p, circle.center) <= circle.radius + EPSILON;
}

// --- Core: Welzl's Algorithm ---
// Trivial circle for 0, 1, 2, or 3 points
function trivialCircle(points: Point[]): Circle {
  // Circle from no points
  if (points.length === 0) {
    return { center: { x: 0, y: 0 }, radius: 0 };
  }
  // Circle from one point
  if (points.length === 1) {
    return { center: points[0], radius: 0 };
  }
  // Circle from two points
  if (points.length === 2) {
    return circleFromTwoPoints(points[0], points[1]);
  }
  // Circle from three points
  const c = circleFromThreePoints(points[0], points[1], points[2]);
  if (c) return c;

  // If collinear, return circle from the two most distant points
  let maxDist = 0;
  // Find the two most distant points
  let best: [Point, Point] = [points[0], points[1]];
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const d = eucl_distance(points[i], points[j]);
      // Update if this pair is more distant
      if (d > maxDist) {
        maxDist = d;
        best = [points[i], points[j]];
      }
    }
  }
  return circleFromTwoPoints(best[0], best[1]);
}
// Welzl's recursive function
function welzl(points: Point[], boundary: Point[] = []): Circle {
  // Base case: no points left or boundary is full
  if (points.length === 0 || boundary.length === 3) {
    return trivialCircle(boundary);
  }
// Remove a random point
  const p = points.pop()!;
  const circle = welzl(points, boundary);
// If the point is inside the circle, return the circle
  if (isInCircle(p, circle)) {
    points.push(p);
    return circle;
  }
// Otherwise, the point is on the boundary
  boundary.push(p);
  const newCircle = welzl(points, boundary);
  boundary.pop();
  points.push(p);
  return newCircle;
}
// Main function to compute the minimum enclosing disc
export function minimumEnclosingDisc(points: Point[]): Circle {
  const shuffled = [...points];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return welzl(shuffled);
}
// Function to get only the radius of the minimum enclosing disc
export function enclosingDiscRadius(points: Point[]): number {
  return minimumEnclosingDisc(points).radius;
}
