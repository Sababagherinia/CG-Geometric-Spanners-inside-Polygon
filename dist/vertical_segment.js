import { Point, Polygon, Segment, DualTree } from "./classes.js";
import { isInsideTriangle, compareFn, computeDet, triangulate } from "./utils.js";
function isEqual(p, q) {
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
function findCenterX(pointsInside) {
    pointsInside.sort(compareFn);
    let middle = floor(pointsInside.length / 2);
    let p = pointsInside[middle];
    let q = pointsInside[middle + 1];
    return (p.x + q.x) / 2;
}
function getInnerPoints(polygon, points) {
    let pointsInside = [];
    for (let i = points.length - 1; i >= 0; i--) {
        if (!isInsideTriangle(polygon.points[0], polygon.points[1], polygon.points[2], points[i]))
            continue;
        pointsInside.push(points[i]);
        points.slice(i, 1);
    }
    return pointsInside;
}
function getWeight(polygon, previous, dt, points) {
    let innerPoints = getInnerPoints(polygon, points);
    if (previous === null)
        previous = dt.root;
    let prev = previous;
    let nhs = dt.getNext(polygon, prev);
    if (nhs.length === 0)
        return innerPoints;
    if (nhs.length === 1) {
        let restPoints = getWeight(nhs[0], polygon, dt, points);
        return innerPoints.concat(restPoints);
    }
    if (nhs.length === 2) {
        let rest_inner_points = getWeight(nhs[0], polygon, dt, points);
        let other_rest_inner_points = getWeight(nhs[1], polygon, dt, points);
        let rest_points = rest_inner_points.concat(other_rest_inner_points);
        return innerPoints.concat(rest_points);
    }
    return [];
}
function computeSplittingSegment(dt, points) {
    // let dt: DualTree = new DualTree(triangles); // dual tree representing the triangulation
    let previous = null; // previously processed triangle
    let pointsCopy = points.slice(); // copy of the points triangle
    // let prevWeight: number = 0; // weight of the previous polygon
    let totalWeight = 0; // weight of all the thus-far visited triangles
    let current = dt.getNext(previous)[0];
    while (true) {
        // get the points inside the triangle
        let innerPoints = getInnerPoints(current, pointsCopy);
        let weight = innerPoints.length;
        totalWeight += weight;
        let nextOfCurrent = dt.peekNext(current, previous);
        if (nextOfCurrent.length === 2) { // current triangle has two children in the dual tree
            let next1 = nextOfCurrent[0];
            let next2 = nextOfCurrent[1];
            let next1InnerPoints = getWeight(next1, current, dt, pointsCopy);
            let next2InnerPoints = getWeight(next2, current, dt, pointsCopy);
            // get the segments of the current triangle with the next triangles in the dual tree
            let segs = dt.getNextSegment(current, previous);
            if (segs === null)
                return null;
            // return the next segment of current that corresponds to nh1
            if (next1InnerPoints.length >= points.length / 3 && next1InnerPoints.length <= 2 / 3 * points.length)
                return segs[0];
            // return the next segment of the current that corresponds to nh2
            if (next2InnerPoints.length >= points.length / 3 && next2InnerPoints.length <= 2 / 3 * points.length)
                return segs[1];
            //TODO - if a subpolygon has >2/3 of all the points that you have to process it
            if (next1InnerPoints.length > 2 / 3 * points.length) {
                previous = current;
                current = next1;
                continue;
            }
            if (next2InnerPoints.length > 2 / 3 * points.length) {
                previous = current;
                current = next2;
                continue;
            }
            // get the common point between the two segments of the next two triangles and the opposite segment from that common point
            let commonPoint = !isEqual(segs[0].src, segs[1].src) && !isEqual(segs[0].src, segs[1].dest) ? segs[0].src : segs[0].dest;
            let otherPointOne = isEqual(segs[0].src, commonPoint) ? segs[0].dest : segs[0].src;
            let otherPointTwo = isEqual(segs[1].src, commonPoint) ? segs[1].dest : segs[1].src;
            // let oppositeSegment: Segment = new Segment(otherPointOne, otherPointTwo);
            // find the segment that splits the current triangle such that one of the sub-polygons has 1/3 of all the points 
            // sort the points inside the root radially clockwise with respect to the commonPoint
            let innerPointsWithVertices = innerPoints.concat([otherPointOne, otherPointTwo]);
            innerPointsWithVertices.sort((p, q) => -computeDet(p, commonPoint, q));
            // going clockwise you are making next1 subpolygon fill up to 1/3 of the points
            let toThird = 0;
            if (isEqual(innerPointsWithVertices[0], otherPointOne)) {
                toThird = Math.ceil(points.length / 3 - next1InnerPoints.length);
            }
            else {
                toThird = Math.ceil(points.length / 3 - next2InnerPoints.length);
            }
            // get the middle point between the toThird vertex and the next one in the inner points and just draw a segment through it from the commonPoint
            let middleX = (innerPointsWithVertices[toThird].x + 0.001);
            let middleY = (innerPointsWithVertices[toThird].y + 0.001);
            let segment = new Segment(commonPoint, new Point(middleX, middleY));
            let longY = segment.computeY(-999);
            // let intersectionPoint: Point = getIntersectionPoint(oppositeSegment,segment);
            return new Segment(commonPoint, new Point(-999, longY));
        }
        // Condition 1 - Valid Diagonal Case
        if (totalWeight >= points.length / 3) {
            let segs = dt.getNextSegment(current, previous);
            // you only have one neighbour
            if (segs !== null && segs.length === 1)
                return segs[0];
        }
        // Condition 2 - heavy triangle case
        if (weight > 2 / 3 * points.length) {
            let x = findCenterX(innerPoints);
            return new Segment(new Point(x, -999), new Point(x, 999));
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
function unoptimizedRotation(splittingSegment, polygon, points) {
    const theta = Math.atan2(splittingSegment.dest.y - splittingSegment.src.y, splittingSegment.dest.x - splittingSegment.src.x);
    const M = {
        x: (splittingSegment.src.x + splittingSegment.dest.x) / 2,
        y: (splittingSegment.src.y + splittingSegment.dest.y) / 2
    };
    const alpha = Math.PI / 2 - theta;
    const cosA = Math.cos(alpha);
    const sinA = Math.sin(alpha);
    const rotatePoint = (P) => {
        const dx = P.x - M.x;
        const dy = P.y - M.y;
        return {
            x: M.x + dx * cosA - dy * sinA,
            y: M.x + dx * sinA + dy * cosA
        };
    };
    let newSS = new Segment(rotatePoint(splittingSegment.src), rotatePoint(splittingSegment.dest));
    let newPolyPoints = polygon.points.map(rotatePoint);
    let newPolySegments = polygon.segments.map((s) => new Segment(rotatePoint(s.src), rotatePoint(s.dest)));
    let newPolygon = new Polygon(newPolyPoints, newPolySegments);
    let newPoints = points.map(rotatePoint);
    return [newSS, newPolygon, newPoints];
}
/**
 *
 * @param polygon Polygon whose vertical line segment we need to compute
 * @param ps Points inside the polygon
 * @returns vertical line segment such that each subpolygon contains at most 2/3 points in ps
 */
function computeSplittingSegmentWrapper(polygon, points) {
    let triangles = triangulate(polygon.points);
    let dt = new DualTree(triangles);
    let splittingSegment = computeSplittingSegment(dt, points);
    return splittingSegment;
}
export { computeSplittingSegmentWrapper, computeSplittingSegment, unoptimizedRotation };
//# sourceMappingURL=vertical_segment.js.map