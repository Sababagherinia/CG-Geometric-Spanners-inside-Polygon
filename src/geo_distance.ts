import { Point, Polygon } from "./classes.js";
import { triangulate, isInsideTriangle, computeDet, eucl_distance } from "./utils.js";

//================================================

// Algorithm: Geodesic Distance inside a Simple Polygon
// Reference: Guibas, L. J., & Hershberger, J. (1989). Optimal shortest path queries in a simple polygon.
// Journal of Computer and System Sciences, 39(3), 126-152.

// Guibas-Hershberger Shortest Path Algorithm
// Step 1: Triangulate the Polygon
//  The polygon P is divided into non-overlapping triangles.
//  This step takes 𝑂(n) time for a simple polygon with n vertices.

// Step 2: Build the Shortest Path Tree (SPT)
// From the source point s, the algorithm constructs a shortest path tree using a data structure called a funnel.
// A funnel is a sequence of edges that represent the shortest path from s to a target vertex t, bending around polygon edges.

// Step 3: Construct the Shortest Path Map (SPM)
// The polygon is partitioned into regions where the shortest path from s to any point in a region follows the same combinatorial structure (i.e., same sequence of turns).
// This map allows querying the geodesic path to any point in 𝑂(n * log n) time.

//Step 4: Query Geodesic Distance
//To find d(𝑠,t), locate the region containing t in the SPM. Use the funnel structure to trace the shortest path from 𝑠 to t.
// The length of this path is the geodesic distance.

//================================================

// Helper functions for Guibas-Hershberger algorithm

// Check if two triangles share an edge
function share_edge(tri1: Point[], tri2: Point[]): boolean {
    let shared = 0;
        for (let p1 of tri1) {
            for (let p2 of tri2) {
                if (p1.x === p2.x && p1.y === p2.y) {
                    shared++;
                }
            }
        }
        return shared === 2;
}

// Create adjacency list of triangles
function build_adjacency(triangles: Point[][]): number[][] {
    const adjacency: number[][] = triangles.map(() => []);
    for (let i = 0; i < triangles.length; i++) {
        for (let j = i + 1; j < triangles.length; j++) {
            if (share_edge(triangles[i], triangles[j])) {
                adjacency[i].push(j);
                adjacency[j].push(i);
            }
        }
    }
    return adjacency;
}

// Find containing triangle for point
function find_containing_triangle(triangles: Point[][], point: Point): number {
    for (let i = 0; i < triangles.length; i++) {
        if (isInsideTriangle(triangles[i][0], triangles[i][1], triangles[i][2], point)) {
            return i;
        }
    }
    return -1; // Not found
}

// Centroid of a triangle, used as weights in graph
function triangle_centroid(triangle: Point[]): Point {
    let x = (triangle[0].x + triangle[1].x + triangle[2].x) / 3;
    let y = (triangle[0].y + triangle[1].y + triangle[2].y) / 3;
    return new Point(x, y);
}

// Dijkstra's algorithm to find shortest path in triangle adjacency graph
function dijkstra(
    triangles: Point[][],
    adjacency: number[][],
    sourceIdx: number,
    targetIdx: number
): number[] {
    const n = triangles.length;
    const distances: number[] = Array(n).fill(Infinity);
    const visited: boolean[] = Array(n).fill(false);
    const prev: number[] = Array(n).fill(-1);

    distances[sourceIdx] = 0;

    // [distance, triangle index]
    const pq: [number, number][] = [[0, sourceIdx]];

    while (pq.length > 0) {
        pq.sort((a, b) => a[0] - b[0]);
        const [distU, u] = pq.shift()!;

        if (visited[u]) continue;
        visited[u] = true;

        if (u === targetIdx) break;

        for (let v of adjacency[u]) {
            if (visited[v]) continue;

            const centroidU = triangle_centroid(triangles[u]);
            const centroidV = triangle_centroid(triangles[v]);

            const weight = eucl_distance(centroidU, centroidV);

            if (distU + weight < distances[v]) {
                distances[v] = distU + weight;
                prev[v] = u;
                pq.push([distances[v], v]);
            }
        }
    }

    // Reconstruct path of triangles
    const path: number[] = [];

    let cur = targetIdx;
    if (prev[cur] === -1 && cur !== sourceIdx) {
        return []; // unreachable, should not happen in convex polygon
    }

    while (cur !== -1) {
        path.push(cur);
        cur = prev[cur];
    }

    return path.reverse();
}

// Create corridor
function create_corridor(triangles: Point[][], path: number[]): Point[][] {
    const corridor: Point[][] = [];
    for (let i = 0; i < path.length - 1; i++) {
        const triA = triangles[path[i]];
        const triB = triangles[path[i + 1]];
        // Find shared edge
        const sharedPoints: Point[] = [];
        for (let p1 of triA) {
            for (let p2 of triB) {
                if (p1.x === p2.x && p1.y === p2.y) {
                    sharedPoints.push(p1);
                }
            }
        }
        corridor.push(sharedPoints);
    }
    return corridor;
}

// Check if points a, b, c are in counter-clockwise order
function ccw(a: Point, b: Point, c: Point) {
  return computeDet(a, b, c) > 0;
}

// Funnel structure to trace path within triangles
function funnel_path(start: Point, end: Point, corridor: Point[][]): Point[] {
  let path: Point[] = [start];

  let apex = start;
  let left = start;
  let right = start;

  let i = 0;

  while (i < corridor.length) {
        const [l, r] = corridor[i];  // left and right vertices of portal

        // try adding left
        if (ccw(apex, left, l)) {
            left = l;
        } else if (ccw(apex, l, right)) {
            path.push(right);
            apex = right;
            left = apex;
            right = apex;
            continue;
        }

        // try adding right
        if (!ccw(apex, right, r)) {
            right = r;
        } else if (!ccw(apex, r, left)) {
            path.push(left);
            apex = left;
            left = apex;
            right = apex;
            continue;
        }

        i++;
    }

    path.push(end);
    return path;
}

//================================================

// Main functions to compute geodesic path and distance
// Geodesic path function
function geodesic_path(polygon: Polygon, source: Point, target: Point): Point[] {
    // Step 1: Triangulate the polygon
    let triangles = triangulate(polygon.points);

    // Step 2: Build the Shortest Path Tree (SPT)
    const adjacency = build_adjacency(triangles);

    // Find containing triangles for source and target
    const sourceIdx = find_containing_triangle(triangles, source);
    const targetIdx = find_containing_triangle(triangles, target);

    if (sourceIdx === -1 || targetIdx === -1) {
        throw new Error("Source or target point is outside the polygon.");
    }

    // Step 3: Dijkstra's algorithm to find shortest path in triangle adjacency graph
    const path = dijkstra(triangles, adjacency, sourceIdx, targetIdx);

    // Step 4: Create corridor from triangle path
    const corridor = create_corridor(triangles, path);
    // Funnel algorithm to trace path within triangles
    const geoPath = funnel_path(source, target, corridor);
    return geoPath;
}

// Geodesic distance function
function geodesic_distance(polygon: Polygon, source: Point, target: Point): number {
    const geoPath = geodesic_path(polygon, source, target);
    let distance = 0;
    for (let i = 0; i < geoPath.length - 1; i++) {
        distance += eucl_distance(geoPath[i], geoPath[i + 1]);
    }
    return distance;
}

export { geodesic_distance, geodesic_path };