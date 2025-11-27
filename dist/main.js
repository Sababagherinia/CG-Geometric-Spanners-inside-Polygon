import { DualTree, Point, Segment } from "./classes.js";
import { triangulate, eucl_distance } from "./utils.js";
import { computeSplittingSegment, unoptimizedRotation } from "./vertical_segment.js";
import { geodesic_distance } from "./geo_distance.js";
import { computeSSPD } from "./sspd.js";
import { enclosingDiscRadius, minimumEnclosingDisc } from "./enclosing_disc.js";
function projectPointToVerticalLineGeodesic(p, xL, polygon, yMin, yMax) {
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
        }
        else {
            a = c;
            c = d;
            f_c = f_d;
            d = a + gr * (b - a);
            f_d = geodesic_distance(polygon, p, new Point(xL, d));
        }
    }
    const finalGeodesic = Math.min(f_c, f_d);
    const yStar = (a + b) / 2;
    return [new Point(xL, yStar), finalGeodesic];
}
function projectionIn(A, inverseProjectionsMap) {
    let projectionsOf = [];
    for (let i = 0; i < A.length; i++) {
        let pl = A[i];
        let p = inverseProjectionsMap.get(pl);
        if (p === undefined)
            continue;
        projectionsOf.push(p[0]);
    }
    return projectionsOf;
}
function smallestGeodesicDistance(points, projectionsMap) {
    let minDist = Number.MAX_VALUE;
    let minIdx = 0;
    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        let pl = projectionsMap.get(p);
        if (pl === undefined)
            continue;
        if (pl[1] < minDist) {
            minDist = pl[1];
            minIdx = i;
        }
    }
    return points[minIdx];
}
function unionOfProjections(inverseProjectionMap, A, B) {
    let union = [];
    let pls = A.concat(B);
    for (let i = 0; i < pls.length; i++) {
        let p = inverseProjectionMap.get(pls[i]);
        if (p === undefined)
            continue;
        union.push(p[0]);
    }
    return union;
}
function constructSpanner(polygon, points, epsilon) {
    if (epsilon < 0) {
        console.log("Epsilon cannot be less than 0...");
        return [];
    }
    let edges = [];
    if (polygon.points.length < 4)
        return edges;
    // computing the splitting line segment
    let triangles = triangulate(polygon.points);
    let dt = new DualTree(triangles);
    let ss = computeSplittingSegment(dt, points);
    if (ss === null)
        return [];
    // computing the rotation so that ss becomes vertical
    let [newSS, newPoly, newPoints] = unoptimizedRotation(ss, polygon, points);
    // let newPoly: Polygon = new Polygon(newPolyPoints);
    // geodesic distance
    let projectionsMap = new Map();
    // let inverseProjectionsMap: Map<Point,[Point,number]> = new Map<Point,[Point,number]>();
    // projected point -> all original points that project to it
    let inverseProjectionsMap = new Map();
    let projections = [];
    for (let i = 0; i < newPoints.length; i++) {
        let p = newPoints[i];
        let [yMin, yMax] = newSS.src.y < newSS.dest.y ? [newSS.src.y, newSS.dest.y] : [newSS.dest.y, newSS.src.y];
        let [pl, distance] = projectPointToVerticalLineGeodesic(p, newSS.src.x, newPoly, yMin, yMax);
        projectionsMap.set(p, [pl, distance]);
        if (!inverseProjectionsMap.has(pl)) {
            inverseProjectionsMap.set(pl, []);
        }
        inverseProjectionsMap.get(pl).push(p);
        projections.push(pl);
    }
    // compute s-SSPD
    let sspd = computeSSPD(projections, epsilon, 3, false);
    console.log(`Number of s-semi-separated pairs: ${sspd.length}`);
    console.log(`Epsilon value: ${epsilon}`);
    // form edges
    for (let i = 0; i < sspd.length; i++) {
        let pair = sspd[i];
        const A = pair[0];
        const B = pair[1];
        let smallProj = A;
        if (enclosingDiscRadius(A) > enclosingDiscRadius(B)) {
            smallProj = B;
        }
        // p - all points whose projection is in both A and B
        // let union: Point[] = unionOfProjections(projectionsMap, A, B);
        // let inverseProjections: Point[] = projectionIn(A, inverseProjectionsMap);
        // let minimumGeodesic: Point = smallestGeodesicDistance(inverseProjections,projectionsMap);
        //(projection p' -> original p)
        const PA = [];
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
        const disc = minimumEnclosingDisc(PA);
        let representative = PA[0];
        let bestDist = Infinity;
        for (const p of PA) {
            const d = eucl_distance(p, disc.center);
            if (d < bestDist) {
                bestDist = d;
                representative = p;
            }
        }
        // union = all original points whose projection lies in A ∪ B
        const union = [];
        for (const pPrime of [...A, ...B]) {
            const original = inverseProjectionsMap.get(pPrime);
            ;
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
    return edges;
}
export { constructSpanner };
//# sourceMappingURL=main.js.map