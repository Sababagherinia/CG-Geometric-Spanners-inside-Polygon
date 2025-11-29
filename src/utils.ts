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

/**
 * 
 * @param arr Array to be sliced
 * @param start Start index
 * @param end End Index
 * @returns Shallow copy of the array from start to end index
 */
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

/**
 * 
 * @param polygon polygon to be split
 * @param verticalSegment vertical segment with respect to which you will be splitting
 * @returns two sub-polygons
 */
function polySplit(polygon: Polygon, verticalSegment: Segment): [Polygon,Polygon] {

  // points and segments of the polygon
  let points: Point[] = polygon.points;
  let segments: Segment[] = polygon.segments;

  // get the indices of the src and destination point in the points array
  let iSrc: number = points.indexOf(verticalSegment.src);
  let iDest: number = points.indexOf(verticalSegment.dest);
  let start: number = min(iSrc,iDest);
  let end: number = max(iSrc,iDest);

  // Case 1: segment endpoints are vertices of the polygon
  if (iSrc !== -1 && iDest !== -1) {
    // define points and segments of polyogn on one side
    let pointsOne: Point[] = points.slice(start,end+1);
    let segmentsOne: Segment[] = [...segments.slice(start,end), new Segment(points[end],points[start])];

    // define points and segments of the polygon on the other side
    let pointsRest: Point[] = [...wrapAroundSlice(points, end, start)];
    let segmentsRest: Segment[] = [...wrapAroundSlice(segments, end, start-1), new Segment(points[start], points[end])];

    // return the two sub-polygons
    return [new Polygon(pointsOne,segmentsOne), new Polygon(pointsRest,segmentsRest)];
  }

  // Case 2: one endpoint is a vertex and the other is an intersection
  let iVertex: number = max(iSrc, iDest);
  let vertex: Point = points[iVertex];
  let otherEndpoint: Point = verticalSegment.src.y == vertex.y ? verticalSegment.dest : verticalSegment.src;

  const intersections: [Segment,number][] = segments.map((s) => [s, s.computeY(vertex.x)]);
  let intersection: [Segment,number] = intersections[0];

  // line goes upwards from the vertex
  if (vertex.y < otherEndpoint.y) {
    // find the minimum intersection
    for (let i = 0; i < intersections.length; i++) {
      if (intersections[i][1] < intersection[1])
        intersection = intersections[i];
    }
  } else { // line goes downwards from the vertex
    // find the maximum intersection
    for (let i = 0; i < intersections.length; i++) {
      if (intersections[i][1] > intersection[1])
        intersection = intersections[i];
    }
  }

  // create new vertex that will be on the intersection
  let newVertex: Point = new Point(vertex.x, intersection[1]);

  // which endpoint of the intersecting segment is on the left and which one is on the right of the intersection
  let [left, right]: [Point, Point] = intersection[0].src.x < vertex.x ? [intersection[0].src, intersection[0].dest] : [intersection[0].dest, intersection[0].src];
  let iLeft: number = points.indexOf(left);
  let iRight: number = points.indexOf(right);

  // if right has a larger index than left
  if ((iLeft + 1) % points.length == iRight) {
    let pointsRight = [newVertex, ...wrapAroundSlice(points, iRight, iVertex)];
    let segmentsRight = [new Segment(newVertex, right), ...wrapAroundSlice(segments, iRight, iVertex-1), new Segment(vertex, newVertex)];

    let pointsLeft = [...wrapAroundSlice(points, iVertex, iLeft), newVertex];
    let segmentsLeft = [...wrapAroundSlice(segments, iVertex, iLeft-1), new Segment(left, newVertex), new Segment(newVertex, vertex)];

    return [new Polygon(pointsLeft, segmentsLeft), new Polygon(pointsRight, segmentsRight)];
  }

  // if left has a larger index than right
  let pointsLeft = [newVertex, ...wrapAroundSlice(points, iLeft, iVertex)];
  let segmentsLeft = [new Segment(newVertex, left), ...wrapAroundSlice(segments, iLeft, iVertex-1), new Segment(vertex, newVertex)];

  let pointsRight = [...wrapAroundSlice(points, iVertex, iRight), newVertex];
  let segmentsRight = [...wrapAroundSlice(segments, iVertex, iRight-1), new Segment(right, newVertex), new Segment(newVertex, vertex)];

  return [new Polygon(pointsLeft, segmentsLeft), new Polygon(pointsRight, segmentsRight)];
}

export {compareFn, wrapAroundSlice, getMin, pointEquality, isInsideTriangle, computeDet, binarySearch, eucl_distance, getIntersectionPoint, lessThan, manhattan_distance, triangulate, isEqualPoly, getHalfPoint, splitPolygon};