import { Point, Polygon, Segment, DualTree} from "./classes.js";
import {isInsideTriangle, compareFn, computeDet, triangulate, getIntersectionPoint} from "./utils.js";

function isEqual(p: Point, q: Point): Boolean {
  return p.x == q.x && p.y == q.y;
}

// function commonPoints(ps: Point[], qs: Point[]): Point[] {
//   let common: Point[] = [];

//   for (let i = 0; i < ps.length; i++) {
//     for (let j = 0; j < qs.length; j++) {
//       if (isEqual(ps[i],qs[j]))
//         common.push(ps[i]);
//     }
//   }

//   return common;
// }

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
    for (let i = points.length-1; i >= 0; i--) {
      if (!isInsideTriangle(polygon.points[0], polygon.points[1], polygon.points[2], points[i]))
        continue;

      pointsInside.push(points[i]);
      points.slice(i,1);
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
    let restPoints = getWeight(nhs[0], polygon, dt, points);
    return innerPoints.concat(restPoints);
  }

  if (nhs.length === 2) {
    let rest_inner_points: Point[] = getWeight(nhs[0], polygon, dt, points);
    let other_rest_inner_points: Point[] = getWeight(nhs[1], polygon, dt, points);
    let rest_points = rest_inner_points.concat(other_rest_inner_points);
    return innerPoints.concat(rest_points);
  }

  return [];
}

function computeSplittingSegment(dt: DualTree, points: Point[]): Segment | null {

  // let dt: DualTree = new DualTree(triangles); // dual tree representing the triangulation
  let previous: Polygon | null = null; // previously processed triangle
  let pointsCopy: Point[] = points.slice(); // copy of the points triangle
  // let prevWeight: number = 0; // weight of the previous polygon
  let totalWeight = 0; // weight of all the thus-far visited triangles
  let current: Polygon = dt.getNext(previous)[0];

  while(true) {

    // get the points inside the triangle
    let innerPoints: Point[] = getInnerPoints(current, pointsCopy);
    let weight: number = innerPoints.length;
    totalWeight += weight;

    let nextOfCurrent = dt.peekNext(current, previous);
    if (nextOfCurrent.length === 2) { // current triangle has two children in the dual tree
      let next1: Polygon = nextOfCurrent[0];
      let next2: Polygon = nextOfCurrent[1];

      let next1InnerPoints = getWeight(next1, current, dt, pointsCopy);
      let next2InnerPoints = getWeight(next2, current, dt, pointsCopy);

      // get the segments of the current triangle with the next triangles in the dual tree
      let segs: Segment[] | null = dt.getNextSegment(current, previous);
      if (segs === null)
        return null;

      // return the next segment of current that corresponds to nh1
      if (next1InnerPoints.length >= points.length/3 && next1InnerPoints.length <= 2/3*points.length) 
        return segs[0];

      // return the next segment of the current that corresponds to nh2
      if (next2InnerPoints.length >= points.length/3 && next2InnerPoints.length <= 2/3*points.length)
        return segs[1];

      // if a subpolygon has >2/3 of all the points that you have to process it
      if (next1InnerPoints.length > 2/3*points.length) {
        previous = current;
        current = next1;
        continue;
      }

      if (next2InnerPoints.length > 2/3*points.length) {
        previous = current;
        current = next2;
        continue;
      }

      // get the common point between the two segments of the next two triangles and the opposite segment from that common point
      let commonPoint: Point = !isEqual(segs[0].src, segs[1].src) && !isEqual(segs[0].src, segs[1].dest) ? segs[0].src : segs[0].dest;
      let otherPointOne: Point = isEqual(segs[0].src, commonPoint) ? segs[0].dest : segs[0].src;
      let otherPointTwo: Point = isEqual(segs[1].src, commonPoint) ? segs[1].dest : segs[1].src;
      // let oppositeSegment: Segment = new Segment(otherPointOne, otherPointTwo);

      // find the segment that splits the current triangle such that one of the sub-polygons has 1/3 of all the points 
      // sort the points inside the root radially clockwise with respect to the commonPoint
      let innerPointsWithVertices: Point[] = innerPoints.concat([otherPointOne,otherPointTwo]);
      innerPointsWithVertices.sort((p,q) => -computeDet(p, commonPoint, q));

      // going clockwise you are making next1 subpolygon fill up to 1/3 of the points
      let toThird: number = 0;
      if (isEqual(innerPointsWithVertices[0], otherPointOne)) {
        toThird = Math.ceil(points.length/3 - next1InnerPoints.length);
      } else {
        toThird = Math.ceil(points.length/3 - next2InnerPoints.length);
      }

      // get the middle point between the toThird vertex and the next one in the inner points and just draw a segment through it from the commonPoint
      let middleX: number = (innerPointsWithVertices[toThird].x + 0.001);
      let middleY: number = (innerPointsWithVertices[toThird].y + 0.001);
      let segment: Segment = new Segment(commonPoint, new Point(middleX,middleY));
      let intersection: Point = segment.dest;
      for (let poly of dt.polygons) {
        for (let seg of poly.segments) {
          intersection = getIntersectionPoint(segment,seg);
          if (intersection.y !== Infinity)
            break;
        }
      }

      // let intersectionPoint: Point = getIntersectionPoint(oppositeSegment,segment);
      return new Segment(commonPoint, intersection);
    }

    // Condition 1 - Valid Diagonal Case
    if (totalWeight >= points.length/3) {
      let segs: Segment[] | null = dt.getNextSegment(current,previous);

      // you only have one neighbour
      if (segs !== null && segs.length === 1)
        return segs[0];
    }

    // Condition 2 - heavy triangle case
    if (weight > 2/3*points.length) {
      let x: number = findCenterX(innerPoints);
      let vert: Segment = new Segment(new Point(x,-999), new Point(x,999));

      let intersections: Point[] = [];
      for (let poly of dt.polygons) {
        for (let seg of poly.segments) {
          intersections.push(getIntersectionPoint(seg,vert));
        }
      }

      let min = intersections[0];
      let max = intersections[0];
      for (let p of intersections) {
        if (p.y === Infinity)
          continue;

        if (p.y < min.y) {
          min = p;
          continue;
        }

        if (p.y > min.y) {
          max = p;
          continue;
        }
      }

      return new Segment(min, max);
    }

    previous = current;
    current = nextOfCurrent[0];
    continue;
  }
}

/**
 * Simplest point location algorithm (O(n) where n is the number of triangles)
 * @param p point whose location we are trying to compute
 * @param polygons list of triangles from the triangulation
 * @returns a triangle in the list which contains the point p
 */
// function pointLocation(p: Point, triangles: Polygon[]): Polygon | null {
//   for (let i = 0; i < triangles.length; i++) {
//     let triangle: Polygon = triangles[i];
//     if (isInsideTriangle(triangle.points[0],triangle.points[1],triangle.points[2],p)) {
//       return triangle;
//     }    
//   }

//   return null;
// }

/**
 * 
 * @param ps Points for which locations will be computed
 * @param triangles triangles in the triangulation
 * @returns hash map mapping points to their respective locations
 */
// function getLocations(ps: Point[], triangles: Polygon[]): Map<Point,Polygon|null> {
//   const pointLocations: Map<Point,Polygon|null> = new Map();

//   for (let i = 0; i < ps.length; i++) {
//     let p: Point = ps[i];
//     let location: Polygon | null = pointLocation(p, triangles); 
//     pointLocations.set(p, location);
//   }
//   return pointLocations;
// }

function rotatePoint(point: Point, theta: number, origin: Point) {
  // translatied Point
  let diffX: number = point.x - origin.x;
  let diffY: number = point.y - origin.y;

  // rotated translated point around the origin
  let rotDiffX: number = (cos(theta) * diffX) - (sin(theta) * diffY);
  let rotDiffY: number = (cos(theta) * diffY) + (sin(theta) * diffX);
  
  // translate back
  return new Point(origin.x + rotDiffX, origin.y + rotDiffY);
}

function unoptimizedRotation(splittingSegment: Segment, polygon: Polygon, points: Point[]): [Segment, Polygon, Point[]] {
  // computing the centroid of the polygon
  let sumX: number = 0;
  let sumY: number = 0;
  for (let i = 0; i < polygon.points.length; i++) {
    sumX += polygon.points[i].x;
    sumY += polygon.points[i].y;
  }
  let pointOfRotation: Point = new Point(sumX/polygon.points.length, sumY/polygon.points.length);

  // angle of rotation
  let height: number = splittingSegment.dest.y - splittingSegment.src.y;
  let width: number = splittingSegment.dest.x - splittingSegment.src.x;
  let theta: number = PI/2 - atan(height/width);

  // rotating the points
  let rotPolyPoints: Point[] = polygon.points.map((p) => rotatePoint(p,theta,pointOfRotation));
  let rotPolygon: Polygon = new Polygon(rotPolyPoints);
  let rotInnerPoints: Point[] = points.map((p) => rotatePoint(p,theta,pointOfRotation));
  let rotSegment: Segment = new Segment(rotatePoint(splittingSegment.src, theta, pointOfRotation), rotatePoint(splittingSegment.dest, theta, pointOfRotation));

  return [rotSegment, rotPolygon, rotInnerPoints];
}

/**
 * 
 * @param polygon Polygon whose vertical line segment we need to compute
 * @param ps Points inside the polygon
 * @returns vertical line segment such that each subpolygon contains at most 2/3 points in ps
 */
function computeSplittingSegmentWrapper(polygon: Polygon, points: Point[]): Segment | null {
  let triangles: Point[][] = triangulate(polygon.points);
  let dt: DualTree = new DualTree(triangles);
  let splittingSegment: Segment | null = computeSplittingSegment(dt, points);
  return splittingSegment;
}

export {computeSplittingSegmentWrapper, computeSplittingSegment, unoptimizedRotation};