// algorithm to compute s-semi-separated pairs of clusters (s-SSPD) in a set of 2D points
// Callahan–Kosaraju SSPD algorithm adaptation
// Still in progress - making sure it works in all directions and for any number of points

import {Point} from "./classes";
import { minimumEnclosingDisc} from "./enclosing_disc";
import { eucl_distance } from "./utils";

type Pointset = Point[];
type Pair = [Pointset, Pointset];


//  Check if two clusters (A, B) are s-semi-separated
function isSemiSeparated(A: Pointset, B: Pointset, s: number): boolean {
    const discA = minimumEnclosingDisc(A);
    const discB = minimumEnclosingDisc(B);

    // Compute distance between centers
    const centerDist = eucl_distance(discA.center, discB.center);
    const minRadius = Math.min(discA.radius, discB.radius);
    // if either cluster has zero radius, they cannot be semi-separated
    if (minRadius === 0) return false;

    // Check s-semi-separation condition
    // Semi-separation condition: ||cA - cB|| >= s * min(rA, rB)
    // where cA, cB are disc centers and rA, rB are their radius
    return centerDist >= s * minRadius;
}

//  Recursively partition points and compute s-SSPD pairs
export function computeSSPD(points: Pointset, EPSILON: number, minClusterSize: number = 3, isSorted=false): Pair[] {
    const s = 4 / EPSILON; // recommended by theory
    // sort points by y-coordinate
    if (!isSorted) points.sort((a, b) => a.y - b.y);
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
    const leftPairs = computeSSPD(clusterA, EPSILON, minClusterSize, isSorted=true);
    const rightPairs = computeSSPD(clusterB, EPSILON, minClusterSize, isSorted=true);
    pairs.push(...leftPairs, ...rightPairs);
}
// Return the list of s-SSPD pairs
    return pairs;
}