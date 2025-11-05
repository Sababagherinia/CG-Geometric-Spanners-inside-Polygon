import { TRIANGLES } from "p5";
import { Point, Polygon, Segment, DualNode} from "./classes";
import {wrapAroundSlice, isInsideTriangle, pointEquality, getMin, compareFn, binarySearch} from "./utils";

// PREPROCESSING CODE

/* 
 *Splits the Polygon into 2 sub-polygons depending on the src and dest vertex indices
 *polygon - polygon to be split

 *src - index of the src vertex
 *dest - index of the dest vertex
 */
function split(polygon: Polygon, src: number, dest: number): Polygon[] {
    let start: number = src;
    let end: number = dest;

    let right_points: Point[] = wrapAroundSlice(polygon.points, start, end);
    let right_segs: Segment[] = wrapAroundSlice(polygon.segments, start, end - 1);
    right_segs.push(new Segment(polygon.points[end], polygon.points[start]));

    let left_points = wrapAroundSlice(polygon.points, end, start);
    let left_segs: Segment[] = wrapAroundSlice(polygon.segments, end, start - 1);
    left_segs.push(new Segment(polygon.points[start], polygon.points[end]));

    return [
      new Polygon(left_points, left_segs),
      new Polygon(right_points, right_segs),
    ];
}

/*
 * Finds an ear of the polygon
 */
function findEar(polygon: Polygon): Polygon[] {
    let subpolygons = [];

    let min_idx = getMin(polygon.points);
    let succ = (min_idx + 1) % polygon.size();
    let pred = min_idx - 1;
    if (pred < 0) pred = polygon.size() - 1;
    let inside = [];

    // find all points within the triangle
    for (let i = 0; i < polygon.size(); i++) {
      if (i === min_idx || i === succ || i === pred) continue;
      if (isInsideTriangle(
          polygon.points[min_idx],
          polygon.points[succ],
          polygon.points[pred],
          polygon.points[i]
        )
      ) {
        inside.push(polygon.points[i]);
      }
    }

    // no points inside the ear
    if (inside.length === 0) {
      subpolygons = split(polygon, succ, pred);
    } else {
      // find the point farthest from the segment
      let min_inside = getMin(inside);
      let inside_min_idx = polygon.points.findIndex((element) =>
        pointEquality(element, inside[min_inside])
      );
      subpolygons = split(polygon, min_idx, inside_min_idx);
    }

    return subpolygons;
}

/**
 * 
 * @param polygon polygon to be triangulated
 * @returns root dual node describing the dual tree of the triangulation
 */
function triangulate(polygon: Polygon): DualNode {
  // if polygon is a triangle simply add it to the dual tree and terminate
  if (polygon.size() === 3) {
    let dn: DualNode = new DualNode(polygon);
    return dn;
  }

  let polys: Polygon[] = findEar(polygon);
  let leftPoly: Polygon = polys[0];
  let rightPoly: Polygon = polys[1];

  // guranteed since the coordinates of the polygon are given in a clockwise order
  if (leftPoly.size() === 3) {
    let dn: DualNode = new DualNode(leftPoly);
    let leftChild: DualNode = triangulate(rightPoly);
    dn.leftChild = leftChild;
    return leftChild;
  }

  // case when the 2 subpolygons are non-triangles
  let leftTree: DualNode = triangulate(leftPoly);
  let rightTree: DualNode = triangulate(rightPoly);
  leftTree.rightChild = rightTree;
  return leftTree;
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
 * @param node DualNode of the dual tree of the triangulation
 * @param acc Number of covered by so-far-seen triangles
 * @param ps Points in the polygonal domain
 * @param pointLocations Map mapping points to their respective triangles
 * @returns True if the node splits the polygon into 3 sub-polygons each containing number of points less than 1/3 of the total number of points
 */
function isThreeSplitter(node: DualNode, acc: number, ps: Points[], pointLocations: Map<Point,Polygon|null>): boolean {

  if (node.leftChild === null || node.rightChild === null)
    return false;

  let totalPoints: number = ps.length;
  if (acc >= totalPoints/3)
    return false;

  let trianglesLeft: Polygon[] = node.leftChild?.triangles();
  let trianglesRight: Polygon[] = node.rightChild?.triangles();
  let weightLeft: number = 0;
  let weightRight: number = 0;

  let restPoints: Point[] = ps.slice(acc);

  for (let i = 0; i < restPoints.length; i++) {
    let p: Point = ps[i];
    let t: Polygon | null | undefined = pointLocations.get(p);
    if (t === null || t === undefined) 
      continue;

    if (trianglesLeft.indexOf(t) !== -1) {
      weightLeft += 1;
      continue;
    }

    if (trianglesRight.indexOf(t) !== -1) {
      weightRight += 1;
      continue;
    }
  }

  return weightLeft < totalPoints/3 && weightRight < totalPoints/3;
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

/**
 * 
 * @param rootNode root dual node of the dual tree of the triangulation of the polygon
 * @param ps Points in the polygonal domain
 * @param pointLocations Map mapping points to their respective triangles
 * @returns X-coordinate of the vertical segment that would split the polygon into 2 sub-polygons each containing AT MOST 2/3 * total number of points
 */
function getSegmentXCoord(rootNode: DualNode | null, ps: Point[], pointLocations: Map<Point,Polygon|null>): number {

  if (rootNode === null)
    return -1;

  let nodeTriangle: Polygon = rootNode.poly; 
  let totalPoints: number = pointLocations.entries.length;
  let heavyCriteration: number = (2/3) * totalPoints;
  let acc: number = 0;

  let pointsInside: Point[] = [];
  for (let key of pointLocations.keys()) {
    let t: Polygon | null | undefined = pointLocations.get(key);
    if (t === null || t === undefined)
      continue;

    if (t !== nodeTriangle)
      continue;

    pointsInside.push(key);
  } 

  let weight: number = pointsInside.length;
  acc += weight;

  // Case 1: you found a heavy triangle
  if (weight > heavyCriteration)      
    return findCenterX(pointsInside);

  // Case 2: you found a valid triangle
  if (acc >= totalPoints/3) {
    let minX: Point = pointsInside[getMin(pointsInside)];
    function wrapperCompareFn(p: Point): boolean {
      return compareFn(p, minX) == -1;
    }

    pointsInside.sort(compareFn);
    let nextP: Point | null = binarySearch(ps, wrapperCompareFn);
    if (nextP === null) 
      return -1;

    return (minX.x + nextP.x) / 2;
  }

  // Case 3: you found a triangle that splits the polygon intro 3 pieces of weight < totalPoints/3
  if (isThreeSplitter(rootNode, acc, ps, pointLocations)) {
    pointsInside.sort(compareFn);
    let pointsToSep: number = totalPoints/3 - acc;
    
  }

  // if none of the above cases follow then recurse and return what others return
  let leftResult: number = getSegmentXCoord(rootNode.leftChild, ps, pointLocations);
  let rightResult: number = getSegmentXCoord(rootNode.rightChild, ps, pointLocations);

  return max(leftResult, rightResult)
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


export {triangulate};