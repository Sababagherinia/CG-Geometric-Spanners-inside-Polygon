// // algorithm to compute s-semi-separated pairs of clusters (s-SSPD) in a set of 2D points
// // Callahan–Kosaraju SSPD algorithm adaptation
// // Still in progress - making sure it works in all directions and for any number of points
import { minimumEnclosingDisc } from "./enclosing_disc.js";
import { eucl_distance } from "./utils.js";
// ---- Helpers --------------------------------------------------------------
/**
 * Build a fair-split binary tree over the point set.
 * Each node stores its minimum enclosing disc.
 */
function buildClusterTree(points, minClusterSize) {
    // Always work on a copy to avoid mutating the caller’s array
    const pts = points.slice();
    const disc = minimumEnclosingDisc(pts); // assumes { center: Point, radius: number }
    // Stop splitting if cluster is small
    if (pts.length <= minClusterSize) {
        return {
            points: pts,
            disc,
            left: null,
            right: null,
        };
    }
    // Choose split dimension by larger spread (x vs y)
    let minX = pts[0].x, maxX = pts[0].x;
    let minY = pts[0].y, maxY = pts[0].y;
    for (const p of pts) {
        if (p.x < minX)
            minX = p.x;
        if (p.x > maxX)
            maxX = p.x;
        if (p.y < minY)
            minY = p.y;
        if (p.y > maxY)
            maxY = p.y;
    }
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    if (spanX >= spanY) {
        pts.sort((a, b) => a.x - b.x);
    }
    else {
        pts.sort((a, b) => a.y - b.y);
    }
    const mid = Math.floor(pts.length / 2);
    const leftPts = pts.slice(0, mid);
    const rightPts = pts.slice(mid);
    // If one side would be empty (shouldn’t happen often), fall back to leaf
    if (leftPts.length === 0 || rightPts.length === 0) {
        return {
            points: pts,
            disc,
            left: null,
            right: null,
        };
    }
    const left = buildClusterTree(leftPts, minClusterSize);
    const right = buildClusterTree(rightPts, minClusterSize);
    return {
        points: pts,
        disc,
        left,
        right,
    };
}
/**
 * Check if two clusters (A,B) are s-semi-separated.
 *
 *   dist(A,B) >= s * min(radius(A), radius(B)),
 * where dist(A,B) is the distance between their minimum enclosing discs.
 */
function isSemiSeparatedNode(A, B, s) {
    const cA = A.disc.center;
    const cB = B.disc.center;
    const rA = A.disc.radius;
    const rB = B.disc.radius;
    const centerDist = eucl_distance(cA, cB);
    const discDist = centerDist - (rA + rB); // distance between discs
    const minRadius = Math.min(rA, rB);
    // For singleton clusters radius can be 0; condition becomes discDist >= 0, which is fine.
    return discDist >= s * minRadius;
}
function isLeaf(node) {
    return node.left === null && node.right === null;
}
// ---- Main SSPD generation -------------------------------------------------
/**
 * Recursively generate s-SSPD pairs for a pair of cluster-tree nodes.
 *
 * This is the standard Callahan–Kosaraju pattern:
 *   - If (u,v) is s-semi-separated: output (u.points, v.points).
 *   - Else split the larger node and recurse.
 */
function generateSSPDPairs(u, v, s, result) {
    // We never need a pair of a cluster with itself that contains a single point.
    if (u === v && u.points.length <= 1) {
        return;
    }
    // If they are semi-separated, we’re done.
    if (isSemiSeparatedNode(u, v, s)) {
        result.push([u.points, v.points]);
        return;
    }
    const uLeaf = isLeaf(u);
    const vLeaf = isLeaf(v);
    // If both are leaves and still not semi-separated, we must stop:
    // accept this pair anyway to terminate (only happens when minClusterSize > 1).
    if (uLeaf && vLeaf) {
        result.push([u.points, v.points]);
        return;
    }
    // Decide which node to split:
    // heuristic: split the one with larger radius, then by size.
    const rU = u.disc.radius;
    const rV = v.disc.radius;
    if ((!uLeaf && (rU >= rV || vLeaf))) {
        // Split u
        // (left/right are non-null because !uLeaf)
        generateSSPDPairs(u.left, v, s, result);
        generateSSPDPairs(u.right, v, s, result);
    }
    else {
        // Split v
        generateSSPDPairs(u, v.left, s, result);
        generateSSPDPairs(u, v.right, s, result);
    }
}
export function computeSSPD(points, EPSILON, minClusterSize = 1) {
    if (points.length === 0)
        return [];
    const s = 4 / EPSILON;
    // Build fair-split tree
    const root = buildClusterTree(points, minClusterSize);
    // If no children, no pairs
    if (!root.left || !root.right)
        return [];
    const pairs = [];
    // Only start with the two *different* children
    generateSSPDPairs(root.left, root.right, s, pairs);
    return pairs;
}
//# sourceMappingURL=sspd.js.map