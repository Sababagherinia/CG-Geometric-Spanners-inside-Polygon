import { Point, Polygon, Segment, DualTree, DualNode } from "./classes";

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

    return (
      (det1 > 0 && det2 > 0 && det3 > 0) || (det1 < 0 && det2 < 0 && det3 < 0)
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

export {compareFn, wrapAroundSlice, getMin, pointEquality, isInsideTriangle, computeDet, binarySearch};