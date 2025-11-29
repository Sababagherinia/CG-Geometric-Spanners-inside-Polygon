import { DualTree, Point, Polygon, Segment } from "./classes.js";
import { triangulate } from "./utils.js";
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

function constructSpanner(polygon: Polygon, points: Point[], epsilon: number):{
    edges: Segment[],
    splittingSegment: Segment | null,
    projections: Point[],
    sspd: Pair[],
    rotatedPolygon: Polygon,
    rotatedPoints: Point[],
    representativePoints: Point[]
} {

    if (epsilon < 0) {
        console.log("Epsilon cannot be less than 0...");
        return { edges: [], splittingSegment: null, projections: [], sspd: [], rotatedPolygon: polygon, rotatedPoints: points, representativePoints: [] };
    }

    let edges: Segment[] = [];
    if (polygon.points.length < 4)
        return { edges: [], splittingSegment: null, projections: [], sspd: [], rotatedPolygon: polygon, rotatedPoints: points, representativePoints: [] };

    // computing the splitting line segment
    let triangles: Point[][] = triangulate(polygon.points);
    let dt: DualTree = new DualTree(triangles);
    let ss: Segment | null = computeSplittingSegment(dt,points);
    if (ss === null)
        return { edges: [], splittingSegment: null, projections: [], sspd: [], rotatedPolygon: polygon, rotatedPoints: points, representativePoints: [] };

    // computing the rotation so that ss becomes vertical
    let [newSS, newPoly, newPoints] = unoptimizedRotation(ss, polygon, points);
    // let newPoly: Polygon = new Polygon(newPolyPoints);

    // geodesic distance
    let projectionsMap: Map<Point,[Point,number]> = new Map<Point,[Point,number]>();
    // let inverseProjectionsMap: Map<Point,[Point,number]> = new Map<Point,[Point,number]>();
    // projected point -> all original points that project to it
    let inverseProjectionsMap: Map<Point, Point[]> = new Map();
    let projections: Point[] = [];
    for (let i = 0; i < newPoints.length; i++) {
        let p: Point = newPoints[i];
        let [yMin,yMax]: [number,number] = newSS.src.y < newSS.dest.y ? [newSS.src.y, newSS.dest.y] : [newSS.dest.y, newSS.src.y];
        let [pl,distance]: [Point,number] = projectPointToVerticalLineGeodesic(p, newSS.src.x, newPoly, yMin, yMax);
        projectionsMap.set(p, [pl,distance]);
        if (!inverseProjectionsMap.has(pl)) {
            inverseProjectionsMap.set(pl, []);
        }
        inverseProjectionsMap.get(pl)!.push(p);
        projections.push(pl);
    }

    // compute s-SSPD
    let sspd: Pair[] = computeSSPD(projections, epsilon, 1, false);
    console.log("the projections:");
    console.log(projections);
    console.log(`Number of s-semi-separated pairs: ${sspd.length}`);
    console.log(`Epsilon value: ${epsilon}`);

    // form edges
    let representatives: Point[] = [];
    for (let i = 0; i < sspd.length; i++) {
        let pair: Pair = sspd[i];
        const A: Point[] = pair[0];
        const B: Point[] = pair[1];
        let smallProj = A;

        if (enclosingDiscRadius(A) > enclosingDiscRadius(B)) {
            smallProj = B;
        }
        // p - all points whose projection is in both A and B
        // let union: Point[] = unionOfProjections(projectionsMap, A, B);
        // let inverseProjections: Point[] = projectionIn(A, inverseProjectionsMap);
        // let minimumGeodesic: Point = smallestGeodesicDistance(inverseProjections,projectionsMap);
        //(projection p' -> original p)
        const PA: Point[] = [];
        for (const pPrime of smallProj) {
            const originals = inverseProjectionsMap.get(pPrime);
            if (originals) {
                // add ALL original points that map to the same projection
                for (const p of originals) {
                    PA.push(p);
                }
            }
        }
        // for (let j = 0; j < union.length; j++) {
        //     edges.push(new Segment(union[j], minimumGeodesic));
        // }
        // choose representative C'(P(A)) as point closest to MED center of P(A)              
        if (PA.length === 0) {
            console.log("No representative can be chosen, skip this iteration");
            continue;
        }

        // Calculate C_l(A)
        // const disc = minimumEnclosingDisc(PA); 
        let representative: Point = PA[0];                   
        let bestDist = Infinity;                             
        for (const p of PA) {                                
            // const d = eucl_distance(p, disc.center);         
            let d_out: [Point,number] | undefined = projectionsMap.get(p);
            if (d_out === undefined)
                continue;

            let d: number = d_out[1];

            if (d < bestDist) {                             
                bestDist = d;                                
                representative = p;                          
            }                                                
        }

        representatives.push(representative);

        // union = all original points whose projection lies in A ∪ B
        const union: Point[] = [];                          
        for (const pPrime of [...A, ...B]) {         
            const original = inverseProjectionsMap.get(pPrime);;
            if (original !== undefined) {
                union.push(...original);
            }
        }

        for (const p of union) {             
            edges.push(new Segment(p, representative));
        }
}

    // split the polygon according to your splitting segment
    // let polygons: Polygon[] = splitPolygon(newPoly, newSS); 
    // let edgesOne: Segment[] = constructSpanner(polygons[0], points, epsilon);
    // let edgesTwo: Segment[] = constructSpanner(polygons[1], points, epsilon);
    // let edgesOneConcat: Segment[] = edgesOne.concat(edgesTwo);
    // let edgesConcat: Segment[] = edges.concat(edgesOneConcat);

    return {
        edges: edges,
        splittingSegment: newSS,
        projections: projections,
        sspd: sspd,
        rotatedPolygon: newPoly,
        rotatedPoints: newPoints,
        representativePoints: representatives
    };
}

export {constructSpanner};