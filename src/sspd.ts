// algorithm to compute s-semi-separated pairs of clusters (s-SSPD) in a set of 2D points
// Still in progress - making sure it works in all directions and for any number of points
import {Point} from "./classes";
import { minimumEnclosingDisc} from "./enclosing_disc";

type Pointset = Point[];
type Pair = [Pointset, Pointset];

// Compute Euclidean distance between two points
function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

//  Check if two clusters (A, B) are s-semi-separated
function isSemiSeparated(A: Pointset, B: Pointset, s: number): boolean {
    const discA = minimumEnclosingDisc(A);
    const discB = minimumEnclosingDisc(B);
    // Compute distance between centers
    const centerDist = distance(discA.center, discB.center);
    const minRadius = Math.min(discA.radius, discB.radius);
    // Check s-semi-separation condition
    // Semi-separation condition: ||cA - cB|| >= s * min(rA, rB)
    // where cA, cB are disc centers and rA, rB are their radius
    return centerDist >= s * minRadius;
}

//  Recursively partition points and compute s-SSPD pairs
export function computeSSPD(points: Pointset, EPSILON: number, minClusterSize: number = 3): Pair[] {
    const s = 4 / EPSILON; // recommended by theory
    // Base case: if points are fewer than the minClusterSize, return empty
    if (points.length <= minClusterSize) {
        return [];
    }
    const pairs: Pair[] = [];
// Step 1: Split points into two clusters (balanced)
    const mid = Math.floor(points.length / 2);
    const clusterA = points.slice(0, mid);
    const clusterB = points.slice(mid);

    // Step 2: Check if the clusters are s-semi-separated
if (isSemiSeparated(clusterA, clusterB, s)) {
    pairs.push([clusterA, clusterB]);
} else {
    // Step 3: Recursively compute s-SSPD pairs for each cluster
    const leftPairs = computeSSPD(clusterA, EPSILON, minClusterSize);
    const rightPairs = computeSSPD(clusterB, EPSILON, minClusterSize);
    pairs.push(...leftPairs, ...rightPairs);
}
// Return the list of s-SSPD pairs
    return pairs;
}