import { Point, Polygon, Segment, DualTree, DualNode, Queue } from "./classes";
import {wrapAroundSlice, isInsideTriangle, pointEquality, getMin, compareFn} from "./utils";

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
 *  TODO look into doing this with an accumulator
 * @param polygon polygon to be triangulated
 * @param triangles accumulator polygon array
 * @returns list of triangles that encompass the triangulation
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
 * @param polygon Polygon whose vertical line segment we need to compute
 * @param ps Points inside the polygon
 * @returns vertical line segment such that each subpolygon contains at most 2/3 points in ps
 */
function findLineSegment(polygon: Polygon, ps: Point[]): Segment | null {

  let rootNode: DualNode = triangulate(polygon);
  let triangles: Polygon[] = rootNode.triangles();
  let point_locations: Map<Point,Polygon|null> = getLocations(ps, triangles);

  return null;
}


export {triangulate};