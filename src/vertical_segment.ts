import p5, { TRIANGLES } from "p5";
import { Point, Polygon, Segment, DualNode, DualTree} from "./classes";
import {wrapAroundSlice, isInsideTriangle, pointEquality, getMin, compareFn, binarySearch, isEqualPoly, computeDet, getHalfPoint, getIntersectionPoint} from "./utils";

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

  let dt: DualTree = new DualTree(triangles); // dual tree representing the triangulation
  let previous: Polygon | null = null; // previously processed triangle
  let pointsCopy: Point[] = points.slice(); // copy of the points triangle
  let prevWeight: number = 0; // weight of the previous polygon
  let totalWeight = 0; // weight of all the thus-far visited triangles

  while(true) {
    // get the next triangle in the dual tree
    let current: Polygon[] = dt.getNext(previous);
    if (current.length === 0) {
      return null;
    }

    // if there is one child triangle
    if (current.length === 1) {
      // get the points inside the triangle
      let innerPoints: Point[] = getInnerPoints(current[0], pointsCopy);
      let weight: number = innerPoints.length;
      totalWeight += weight;

      let nextOfCurrent = dt.peekNext(current[0], previous);
      if (nextOfCurrent.length === 2) { // current triangle has two children in the dual tree
        let next1: Polygon = nextOfCurrent[0];
        let next2: Polygon = nextOfCurrent[1];

        let next1InnerPoints = getWeight(next1, previous, dt, pointsCopy);
        let next2InnerPoints = getWeight(next2, previous, dt, pointsCopy);

        // get the segments of the current triangle with the next triangles in the dual tree
        let segs: Segment[] | null = dt.getNextSegment(current[0]);
        if (segs === null)
          return null;

        // return the next segment of current that corresponds to nh1
        if (next1InnerPoints.length >= points.length/3 && next1InnerPoints.length <= 2/3*points.length) 
          return segs[0];

        // return the next segment of the current that corresponds to nh2
        if (next2InnerPoints.length >= points.length/3 && next2InnerPoints.length <= 2/3*points.length)
          return segs[1];

        // get the common point between the two segments of the next two triangles
        let commonPoint: Point = !isEqual(segs[0].src, segs[1].src) && !isEqual(segs[0].src, segs[1].dest) ? segs[0].src : segs[0].dest;

        // the root of the dual tree is an intersection point - it must have >1/3 of all the points in the polygon
        if (current[0] == dt.root) {
          // find the segment that splits the root triangle such that one of the sub-polygons has 1/3 of all the points 
          let otherPointOne: Point = isEqual(segs[0].src, commonPoint) ? segs[0].dest : segs[0].src;
          let otherPointTwo: Point = isEqual(segs[1].src, commonPoint) ? segs[1].dest : segs[1].src;
          let oppositeSegment: Segment = new Segment(otherPointOne, otherPointTwo);

          // sort the points inside the root radially clockwise with respect to the commonPoint
          let innerPointsWithVertices: Point[] = innerPoints.concat([otherPointOne,otherPointTwo]);
          innerPointsWithVertices.sort((p,q) => computeDet(p, q, commonPoint));

          // going clockwise you are making next1 subpolygon fill up to 1/3 of the points
          if (isEqual(innerPointsWithVertices[0], otherPointOne)) {
            let toThird: number = points.length/3 - next1InnerPoints.length;
            let middleX: number = (innerPointsWithVertices[toThird].x + innerPointsWithVertices[toThird+1].x)/2;
            let middleY: number = (innerPointsWithVertices[toThird].y + innerPointsWithVertices[toThird+1].y)/2;
            let segment: Segment = new Segment(commonPoint, new Point(middleX,middleY));
            let intersectionPoint: Point = getIntersectionPoint(oppositeSegment,segment);
            return new Segment(commonPoint, intersectionPoint);
          }
          
          // determine 
        }

        // Condition 3 - Triangle Splits the Polygon into 3 sub-polygons of weight < 1/3
        let totalPointsVisited = totalWeight - prevWeight;
        let pointsNeeded = points.length/3 - totalPointsVisited;

        let halfPoint: Point = getHalfPoint(segs[1]);
        let splittingSegment: Segment = new Segment(commonPoint, halfPoint);

        // calculate the direction that the other points need to be in
        let previousOfPrevious: Polygon[] = dt.getNeighbours(previous, current);
        let comparisonPoint: Point;
        if (previousOfPrevious.length === 0) {

        }

      }

      // Condition 1 - Valid Diagonal Case
      if (totalWeight >= points.length/3) {
        let segs: Segment[] | null = dt.getNextSegment(current[0]);

        // you only have one neighbour
        if (segs !== null && segs.length === 1)
          return segs[0];
      }

      // Condition 2 - heavy triangle case
      if (weight > 2/3*points.length) {
        let x: number = findCenterX(innerPoints);
        return new Segment(new Point(x,-999), new Point(x,999));
      }

      previous = current[0];
      continue;
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