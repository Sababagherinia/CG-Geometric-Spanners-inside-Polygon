import { Point, Polygon, Segment } from "./classes.js";

/* eslint-disable no-undef, no-unused-vars */
function computeDet(p: Point, q: Point, r: Point): number {
    /*
    | qx-px rx-px |
    | qy-py ry-py |
    */
    // we need inversion because the y-coordinate are inverted in the canvas
    let a = q.x - p.x;
    let b = r.x - p.x;
    let c = -(q.y - p.y);
    let d = -(r.y - p.y);
    let det = a * d - b * c;

    return det;
}

function isInsideTriangle(p: Point, q: Point, r: Point, a: Point): boolean {
    let det1 = computeDet(p, q, a);
    let det2 = computeDet(q, r, a);
    let det3 = computeDet(r, p, a);

    let seg1: Segment = new Segment(p, q);
    let seg2: Segment = new Segment(q, r);
    let seg3: Segment = new Segment(r, p);

    let onEdge: boolean = seg1.isOnSegment(a) || seg2.isOnSegment(a) || seg3.isOnSegment(a);

    return (
      (det1 > 0 && det2 > 0 && det3 > 0) || (det1 < 0 && det2 < 0 && det3 < 0) || onEdge
    );
}


function pointEquality(p1: Point, p2: Point): boolean {
  return p1.x == p2.x && p1.y == p2.y;
}


function getMin(ps: Point[]): number {
  let min = new Point(9999, 9999);
  let idx = 0;
  for (let i = 0; i < ps.length; i++) {
    if (ps[i].x < min.x) {
      min = ps[i];
      idx = i;
    }
  }

  return idx;
}

// slices [start,end] section from arr with wraparound
function wrapAroundSlice(arr: any[], start: number, end: number): any[] {
    if (end > start) {
        return arr.slice(start, end + 1);
    } 

    if (start === end) return [arr[start]];
  
    let part1 = arr.slice(start, arr.length);
    let part2 = arr.slice(0, end + 1);
    return part1.concat(part2);
}


function compareFn(p1: Point, p2: Point) {
  if (p1.x < p2.x)
    return -1;
  
  return 1;
}

function binarySearch(points: Point[], predicate: CallableFunction): Point | null {
  let start: number = 0;
  let end: number = points.length-1;
  while (start < end) {
    let middle: number = start + (end - start)/2;
    if (predicate(points[middle])) {
      if (!predicate(points[middle+1]))
        return points[middle];

      start = middle+1;
      continue;
    }

    end = middle-1;
  }

  return null;
}

// Compute Euclidean distance between two points
function eucl_distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// Compute Manhattan distance between two points
function manhattan_distance(p1: Point, p2: Point): number {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

/**
 * 
 * @param s1 First Line Segment
 * @param s2 Second Line Segment
 * @returns Point at the intersection of the 2 line segments
 */
function getIntersectionPoint(s1: Segment, s2: Segment): Point {
  let intersectionX: number = (s2.intercept - s1.intercept) / (s1.slope - s2.slope);
  let intersectionY: number = s1.computeY(intersectionX);

  return new Point(intersectionX, intersectionY);
}


function lessThan(seg1: Segment, seg2: Segment, x: number): Boolean {
  let y1: number = seg1.computeY(x);
  let y2: number = seg2.computeY(x);
  return y1 < y2;
}

// Triangulate a simple polygon using Ear Clipping method
function triangulate(polygon: Point[]): Point[][] {
  let n = polygon.length;
  if (n < 3) return [];

  // Make a copy
  let verts = polygon.slice();
  let triangles: Point[][] = [];

  // Ensure polygon is CCW
  let area = 0;
  for (let i = 0; i < n; i++) {
    let p = verts[i];
    let q = verts[(i + 1) % n];
    area += p.x * q.y - q.x * p.y;
  }
  if (area < 0) verts.reverse();

  while (verts.length > 3) {
    let earFound = false;

    for (let i = 0; i < verts.length; i++) {
      let prev = verts[(i - 1 + verts.length) % verts.length];
      let curr = verts[i];
      let next = verts[(i + 1) % verts.length];

      // 1. Check convex
      if (computeDet(prev, curr, next) >= 0) continue;

      // 2. Check no other point is inside
      let isEar = true;
      for (let j = 0; j < verts.length; j++) {
        if (j === i || j === (i - 1 + verts.length) % verts.length || j === (i + 1) % verts.length) continue;
        if (isInsideTriangle(prev, curr, next, verts[j])) {
          isEar = false;
          break;
        }
      }
      if (!isEar) continue;

      // 3. It's an ear
      triangles.push([prev, curr, next]);
      verts.splice(i, 1);
      earFound = true;
      break;
    }

    if (!earFound) {
      throw new Error("Failed to find an ear – polygon might be self-intersecting.");
    }
  }

  triangles.push([verts[0], verts[1], verts[2]]);
  return triangles;
}

/**
 * 
 * @param poly1 Triangle
 * @param poly2 Triangle
 * @returns True if the triangles have the same vertices
 */
function isEqualPoly(poly1: Polygon, poly2: Polygon): Boolean {
  if (poly1.size() !== 3 || poly2.size() !== 3)
    return false;

  for (let i = 0; i < poly1.points.length; i++) {
    let p: Point = poly1.points[i];
    if (!poly2.points.some((q) => q.x == p.x && q.y == p.y))
      return false;
  }

  return true;
}


function getHalfPoint(segment: Segment): Point {
  let newX: number = (segment.src.x + segment.dest.x)/2;
  let newY: number = (segment.src.y + segment.dest.y)/2;
  return new Point(newX, newY);
}


function splitPolygon(polygon: Polygon, verticalSegment: Segment): Polygon[] {
    let src = verticalSegment.src;
    let dest = verticalSegment.dest;

    let segmentSrcIdx: number = polygon.segments.findIndex((s) => s.isOnSegment(src));
    let segmentDestIdx: number = polygon.segments.findIndex((s) => s.isOnSegment(dest));

    // bring segmentDestIdx on the same side of segmentSrcIdx
    if (polygon.points[segmentDestIdx].x < src.x && polygon.points[segmentSrcIdx].x > src.x) {
      if (polygon.points[(segmentDestIdx+1) % polygon.size()].x > src.x)
        segmentDestIdx++;
      else 
        segmentDestIdx--;
    } else if (polygon.points[segmentDestIdx].x > src.x && polygon.points[segmentSrcIdx].x < src.x) {
      if (polygon.points[(segmentDestIdx+1) % polygon.size()].x < src.x)
        segmentDestIdx++;
      else 
        segmentDestIdx--;
    }

    let right_points: Point[] = wrapAroundSlice(polygon.points, segmentSrcIdx, segmentDestIdx);

    let otherSegmentSrcIdx = 0;
    let otherSegmentDestIdx = 0;
    if (polygon.points[segmentDestIdx].x < src.x && polygon.points[(segmentDestIdx+1) % polygon.size()].x > src.x) {
      otherSegmentDestIdx = segmentDestIdx + 1;
      otherSegmentSrcIdx = segmentSrcIdx - 1;
    } else if (polygon.points[segmentDestIdx].x < src.x && polygon.points[(segmentDestIdx+1) % polygon.size()].x > src.x) {
      otherSegmentDestIdx = segmentDestIdx - 1;
      otherSegmentSrcIdx = segmentSrcIdx + 1;
    } else if (polygon.points[segmentDestIdx].x > src.x && polygon.points[(segmentDestIdx+1) % polygon.size()].x > src.x) {
      otherSegmentDestIdx = segmentDestIdx - 1;
      otherSegmentSrcIdx = segmentSrcIdx + 1;
    } else if (polygon.points[segmentDestIdx].x > src.x && polygon.points[(segmentDestIdx+1) % polygon.size()].x < src.x) {
      otherSegmentDestIdx = segmentDestIdx + 1;
      otherSegmentSrcIdx = segmentSrcIdx - 1;
    }

    let left_points = wrapAroundSlice(polygon.points, otherSegmentSrcIdx, otherSegmentDestIdx);

    return [
      new Polygon(left_points),
      new Polygon(right_points),
    ];
}

export {compareFn, wrapAroundSlice, getMin, pointEquality, isInsideTriangle, computeDet, binarySearch, eucl_distance, getIntersectionPoint, lessThan, manhattan_distance, triangulate, isEqualPoly, getHalfPoint, splitPolygon};