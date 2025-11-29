// algorithm to compute s-semi-separated pairs of clusters (s-SSPD) in a set of 2D points
// Callahan–Kosaraju SSPD algorithm adaptation
// Still in progress - making sure it works in all directions and for any number of points
import { minimumEnclosingDisc } from "./enclosing_disc.js";
import { eucl_distance } from "./utils.js";
//  Check if two clusters (A, B) are s-semi-separated
function isSemiSeparated(A, B, s) {
    const discA = minimumEnclosingDisc(A);
    const discB = minimumEnclosingDisc(B);
    // Compute distance between centers
    const centerDist = eucl_distance(discA.center, discB.center);
    const minRadius = Math.min(discA.radius, discB.radius);
    // Special case: if either cluster has zero radius (single point or duplicates)
    // Consider them separated if centers are different, not separated if same point
    if (minRadius === 0) {
        return centerDist > 0;
    }
    // Check s-semi-separation condition
    // Semi-separation condition: ||cA - cB|| >= s * min(rA, rB)
    // where cA, cB are disc centers and rA, rB are their radius
    return centerDist >= s * minRadius;
}
// Helper function to compute pairs between two clusters
function computePairsBetween(A, B, s) {
    const pairs = [];
    // Base case: if either cluster is empty, no pairs
    if (A.length === 0 || B.length === 0) {
        return pairs;
    }
    // Check if the clusters are s-semi-separated
    if (isSemiSeparated(A, B, s)) {
        // They are separated - report this pair
        pairs.push([A, B]);
    }
    else {
        // Not separated: split the larger cluster and recurse
        if (A.length >= B.length && A.length > 1) {
            // Split A into A1 and A2, keeping B intact
            const midA = Math.floor(A.length / 2);
            const A1 = A.slice(0, midA);
            const A2 = A.slice(midA);
            // Find pairs between A1-B and A2-B
            pairs.push(...computePairsBetween(A1, B, s));
            pairs.push(...computePairsBetween(A2, B, s));
        }
        else if (B.length > 1) {
            // Split B into B1 and B2, keeping A intact
            const midB = Math.floor(B.length / 2);
            const B1 = B.slice(0, midB);
            const B2 = B.slice(midB);
            // Find pairs between A-B1 and A-B2
            pairs.push(...computePairsBetween(A, B1, s));
            pairs.push(...computePairsBetween(A, B2, s));
        }
        // If both have size 1 and not separated, no pair is added
    }
    return pairs;
}
//  Recursively partition points and compute s-SSPD pairs
export function computeSSPD(points, EPSILON, minClusterSize = 1, isSorted = false) {
    const s = 4 / EPSILON; // recommended by theory
    // Sort points by y-coordinate on first call
    if (!isSorted) {
        points.sort((a, b) => a.y - b.y);
    }
    // Base case: if too few points, return empty
    if (points.length < 2) {
        return [];
    }
    const pairs = [];
    // Split points into two halves
    const mid = Math.floor(points.length / 2);
    const clusterA = points.slice(0, mid);
    const clusterB = points.slice(mid);
    // Find pairs between the two halves
    pairs.push(...computePairsBetween(clusterA, clusterB, s));
    // Recursively find pairs within each half (only if they have >= 2 points)
    if (clusterA.length >= 2) {
        pairs.push(...computeSSPD(clusterA, EPSILON, minClusterSize, true));
    }
    if (clusterB.length >= 2) {
        pairs.push(...computeSSPD(clusterB, EPSILON, minClusterSize, true));
    }
    return pairs;
}
//# sourceMappingURL=sspd.js.map