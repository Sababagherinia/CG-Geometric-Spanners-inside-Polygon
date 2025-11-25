import p5, { TRIANGLES } from "p5";
import { Point, Polygon, Segment, DualNode, DualTree} from "./classes";
import {wrapAroundSlice, isInsideTriangle, pointEquality, getMin, compareFn, binarySearch, isEqualPoly} from "./utils";

// PREPROCESSING CODE

function isEqual(p: Point, q: Point): Boolean {
  return p.x == q.x && p.y == q.y;
}

function commonPoints(ps: Point[], qs: Point[]): Point[] {
  let common: Point[] = [];

  for (let i = 0; i < ps.length; i++) {
    for (let j = 0; j < qs.length; j++) {
      if (isEqual(ps[i],qs[j]))
        common.push(ps[i]);
    }
  }

  return common;
}

/**
 * 
 * @param pointsInside Points inside of a triangle
 * @returns Retunrs the x-coordinate that splits the points into 2 roughly equal sets
 */
function findCenterX(pointsInside: Point[]): number {
  pointsInside.sort(compareFn);
  let middle: number = floor(pointsInside.length / 2);
  let p: Point = pointsInside[middle];
  let q: Point = pointsInside[middle+1];
  return (p.x+q.x)/2;
}

function getInnerPoints(polygon: Polygon, points: Point[]) {
    let pointsInside: Point[] = [];
    for (let i = 0; i < points.length; i++) {
      if (!isInsideTriangle(polygon.points[0], polygon.points[1], polygon.points[2], points[i]))
        continue;

      pointsInside.push(points[i]);
      points.slice(i,1);
      i--;
    }

    return pointsInside;
}

function getWeight(polygon: Polygon, previous: Polygon | null, dt: DualTree, points: Point[]): Point[] {
  let innerPoints: Point[] = getInnerPoints(polygon,points);
  if (previous === null) 
    previous = dt.root;

  let prev: Polygon = previous;

  let nhs: Polygon[] = dt.getNext(polygon, prev);
  if (nhs.length === 0)
    return innerPoints;

  if (nhs.length === 1) {
    return innerPoints.concat(getWeight(nhs[0], polygon, dt, points));
  }

  if (nhs.length === 2) {
    let new_inner_points: Point[] = innerPoints.concat(getWeight(nhs[0], polygon, dt, points));
    return new_inner_points.concat(getWeight(nhs[0], polygon, dt, points));
  }

  return [];
}

function computeVerticalLine(triangles: Point[][], points: Point[]): Segment | null {

  let dt: DualTree = new DualTree(triangles);
  let previous: Polygon | null = null;
  let pointsCopy: Point[] = points.slice();
  let prevWeight: number = 0;
  let totalWeight = 0;

  while(true) {
    let nhs: Polygon[] = dt.getNext(previous);
    if (nhs.length === 0) {
      return null;
    }

    if (nhs.length === 1) {
      let innerPoints: Point[] = getInnerPoints(nhs[0], pointsCopy);
      let weight: number = innerPoints.length;
      totalWeight += weight;

      // Condition 1 - Valid Diagonal Case
      if (totalWeight >= points.length/3) {
        let segs: Segment[] | null = dt.getNextSegment(nhs[0]);

        // you only have one neighbour
        if (segs !== null && segs.length === 1)
          return segs[0];
      }

      // Condition 2 - heavy triangle case
      if (weight > 2/3*points.length) {
        let x: number = findCenterX(innerPoints);
        return new Segment(new Point(x,-999), new Point(x,999));
      }

      previous = nhs[0];
      continue;
    }

    // the triangle is at a point of intersection
    if (nhs.length === 2) {
      let nh1: Polygon = nhs[0];
      let nh2: Polygon = nhs[1];

      let nh1InnerPoints = getWeight(nh1, previous, dt, pointsCopy);
      let nh2InnerPoints = getWeight(nh2, previous, dt, pointsCopy);

      if (previous === null)
        return null;

      let segs: Segment[] | null = dt.getNextSegment(previous);
      if (segs === null)
        return null;

      // return the next segment of current that corresponds to nh1
      if (nh1InnerPoints.length >= points.length/3) 
        return segs[0];

      // return the next segment of the current that corresponds to nh2
      if (nh2InnerPoints.length >= points.length/3)
        return segs[1];

      // Condition 3 - Triangle Splits the Polygon into 3 sub-polygons of weight < 1/3
      let totalPointsVisited = totalWeight - prevWeight;
      let pointsNeeded = points.length/3 - totalPointsVisited;
      let commonPoint = !isEqual(segs[0].src, segs[1].src) && !isEqual(segs[0].src, segs[1].dest) ? segs[0].src : segs[0].dest;
    }
  }
}

/**
 * Simplest point location algorithm (O(n) where n is the number of triangles)
 * @param p point whose location we are trying to compute
 * @param polygons list of triangles from the triangulation
 * @returns a triangle in the list which contains the point p
 */
function pointLocation(p: Point, triangles: Polygon[]): Polygon | null {
  for (let i = 0; i < triangles.length; i++) {
    let triangle: Polygon = triangles[i];
    if (isInsideTriangle(triangle.points[0],triangle.points[1],triangle.points[2],p)) {
      return triangle;
    }    
  }

  return null;
}

/**
 * 
 * @param ps Points for which locations will be computed
 * @param triangles triangles in the triangulation
 * @returns hash map mapping points to their respective locations
 */
function getLocations(ps: Point[], triangles: Polygon[]): Map<Point,Polygon|null> {
  const pointLocations: Map<Point,Polygon|null> = new Map();

  for (let i = 0; i < ps.length; i++) {
    let p: Point = ps[i];
    let location: Polygon | null = pointLocation(p, triangles); 
    pointLocations.set(p, location);
  }
  return pointLocations;
}

/**
 * 
 * @param polygon Polygon whose vertical line segment we need to compute
 * @param ps Points inside the polygon
 * @returns vertical line segment such that each subpolygon contains at most 2/3 points in ps
 */
function findLineSegment(polygon: Polygon, ps: Point[]): Segment | null {
  let rootNode: DualNode = triangulate(polygon);
  rootNode.isRoot = true;
  let triangles: Polygon[] = rootNode.triangles();
  let point_locations: Map<Point,Polygon|null> = getLocations(ps, triangles);

  return null;
}