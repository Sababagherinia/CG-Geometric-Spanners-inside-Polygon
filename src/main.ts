import { DualTree, Point, Polygon, Segment } from "./classes.js";
import { splitPolygon, triangulate } from "./utils.js";
import { computeSplittingSegment, unoptimizedRotation } from "./vertical_segment.js";
import { geodesic_distance } from "./geo_distance.js";
import { computeSSPD, Pair } from "./sspd.js";
import { enclosingDiscRadius } from "./enclosing_disc.js";

function projectPointToVerticalLineGeodesic(p: Point, xL: number, polygon: Polygon, yMin: number, yMax: number): [Point,number] {
    const gr = (Math.sqrt(5) - 1) / 2; // golden ratio constant

    let a = yMin;
    let b = yMax;

    // Initial interior points
    let c = yMax - gr * (yMax - yMin);
    let d = yMin + gr * (yMax - yMin);

    // Evaluate function at c and d
    let f_c = geodesic_distance(polygon, p, new Point(xL, c));
    let f_d = geodesic_distance(polygon, p, new Point(xL, d));

    // Optimization loop
    while (Math.abs(b - a) > 1e-6) {
        if (f_c < f_d) {
            b = d;  
            d = c;
            f_d = f_c;
            c = b - gr * (b - a);
            f_c = geodesic_distance(polygon, p, new Point(xL, c));
        } else {
            a = c;
            c = d;
            f_c = f_d;
            d = a + gr * (b - a);
            f_d = geodesic_distance(polygon, p, new Point(xL, d));
        }
    }

    const finalGeodesic = Math.min(f_c,f_d);
    const yStar = (a + b) / 2;
    return [new Point(xL, yStar),finalGeodesic];
}

function projectionIn(A: Point[], inverseProjectionsMap: Map<Point,[Point,number]>): Point[] {
    let projectionsOf: Point[] = [];
    for (let i = 0; i < A.length; i++) {
        let pl: Point = A[i];
        let p: [Point,number] | undefined = inverseProjectionsMap.get(pl);
        if (p === undefined)
            continue;
        projectionsOf.push(p[0])
    }

    return projectionsOf;
}

function smallestGeodesicDistance(points: Point[], projectionsMap: Map<Point,[Point,number]>): Point {
    let minDist = Number.MAX_VALUE;
    let minIdx = 0;
    for (let i = 0; i < points.length; i++) {
        let p: Point = points[i];
        let pl: [Point,number] | undefined = projectionsMap.get(p);
        if (pl === undefined)
            continue;

        if (pl[1] < minDist) {
            minDist = pl[1];
            minIdx = i;
        }
    }

    return points[minIdx];
}

function unionOfProjections(inverseProjectionMap: Map<Point,[Point,number]>, A: Point[], B: Point[]): Point[] {
    let union: Point[] = [];
    let pls = A.concat(B);
    for (let i = 0; i < pls.length; i++) {
        let p: [Point,number] | undefined = inverseProjectionMap.get(pls[i]);
        if (p === undefined)
            continue;

        union.push(p[0]);
    }

    return union;
}

function constructSpanner(polygon: Polygon, points: Point[], epsilon: number): Segment[] {

    if (epsilon < 0) {
        console.log("Epsilon cannot be less than 0...");
        return [];
    }

    let edges: Segment[] = [];
    if (polygon.points.length < 4)
        return edges;

    // computing the splitting line segment
    let triangles: Point[][] = triangulate(polygon.points);
    let dt: DualTree = new DualTree(triangles);
    let ss: Segment | null = computeSplittingSegment(dt,points);
    if (ss === null)
        return [];

    // computing the rotation so that ss becomes vertical
    let [newSS, newPoly, newPoints] = unoptimizedRotation(ss, polygon, points);
    // let newPoly: Polygon = new Polygon(newPolyPoints);

    // geodesic distance
    let projectionsMap: Map<Point,[Point,number]> = new Map<Point,[Point,number]>();
    let inverseProjectionsMap: Map<Point,[Point,number]> = new Map<Point,[Point,number]>();
    let projections: Point[] = [];
    for (let i = 0; i < newPoints.length; i++) {
        let p: Point = newPoints[i];
        let [yMin,yMax]: [number,number] = newSS.src.y < newSS.dest.y ? [newSS.src.y, newSS.dest.y] : [newSS.dest.y, newSS.src.y];
        let [pl,distance]: [Point,number] = projectPointToVerticalLineGeodesic(p, newSS.src.x, newPoly, yMin, yMax);
        projectionsMap.set(p, [pl,distance]);
        inverseProjectionsMap.set(pl, [p,distance]);
        projections.push(p);
    }

    // compute s-SSPD
    let sspd: Pair[] = computeSSPD(projections, epsilon, undefined, false);

    // form edges
    for (let i = 0; i < sspd.length; i++) {
        let pair: Pair = sspd[i];
        const A: Point[] = pair[0];
        const B: Point[] = pair[1];
        if (enclosingDiscRadius(A) > enclosingDiscRadius(B))
            continue;

        // p - all points whose projection is in borth A and B
        let union: Point[] = unionOfProjections(projectionsMap, A, B);
        let inverseProjections: Point[] = projectionIn(A, inverseProjectionsMap);
        let minimumGeodesic: Point = smallestGeodesicDistance(inverseProjections,projectionsMap);
        for (let i = 0; i < union.length; i++) {
            edges.push(new Segment(union[i], minimumGeodesic));
        }
    }

    // split the polygon according your your splitting segment
    // let polygons: Polygon[] = splitPolygon(newPoly, newSS); 
    // let edgesOne: Segment[] = constructSpanner(polygons[0], points, epsilon);
    // let edgesTwo: Segment[] = constructSpanner(polygons[1], points, epsilon);
    // let edgesOneConcat: Segment[] = edgesOne.concat(edgesTwo);
    // let edgesConcat: Segment[] = edges.concat(edgesOneConcat);

    return edges;
}

export {constructSpanner};