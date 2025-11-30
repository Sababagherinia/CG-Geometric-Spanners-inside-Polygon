import { isEqualPoly } from "./utils.js";
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Segment {
    constructor(src, dest) {
        this.src = src;
        this.dest = dest;
        // infinity slope - add a small offset
        if (this.src.x === this.dest.x) {
            this.dest.x += 0.00001;
        }
        this.slope = (this.dest.y - this.src.y) / (this.dest.x - this.src.x);
        this.intercept = this.src.y - (this.slope * this.src.x);
    }
    isOnSegment(p) {
        let lineY = this.slope * p.x + this.intercept;
        return lineY === p.y;
    }
    computeY(x) {
        if ((x >= this.src.x && x <= this.dest.x) || (x >= this.dest.x && x <= this.src.x))
            return this.slope * x + this.intercept;
        return Infinity;
    }
}
class Graph {
    constructor(points, edges) {
        this.points = points;
        this.edges = edges;
    }
}
// vertices have to be given in clockwise order
class Polygon {
    constructor(points, segments) {
        this.segments = [];
        this.points = points;
        if (segments !== null && segments !== undefined)
            this.segments = segments;
        else {
            for (let i = 0; i < points.length; i++) {
                let src = points[i % points.length];
                let dest = points[(i + 1) % points.length];
                this.segments.push(new Segment(src, dest));
            }
        }
    }
    size() {
        return this.points.length;
    }
}
class DualTree {
    constructor(triangles) {
        var _a;
        this.adjList = new Map();
        this.polygons = [];
        this.prevPoly = null;
        if (triangles.length === 1) {
            this.polygons = [new Polygon(triangles[0])];
            this.adjList = new Map([[this.polygons[0], []]]);
            this.root = this.polygons[0];
        }
        else {
            let minx = Number.MAX_VALUE;
            let minIdx = 0;
            for (let i = 0; i < triangles.length; i++) {
                let x_coords = triangles[i].map((p) => p.x);
                let x_coords_min = Math.min(...x_coords);
                if (x_coords_min < minx) {
                    minx = x_coords_min;
                    minIdx = i;
                }
                let pl = new Polygon(triangles[i]);
                this.polygons.push(pl);
                this.adjList.set(pl, []);
            }
            this.root = this.polygons[minIdx];
            for (let i = 0; i < this.polygons.length; i++) {
                for (let j = 0; j < this.polygons.length; j++) {
                    if (i === j)
                        continue;
                    if (!this.isNeighbour(this.polygons[i], this.polygons[j]))
                        continue;
                    (_a = this.adjList.get(this.polygons[i])) === null || _a === void 0 ? void 0 : _a.push(this.polygons[j]);
                }
            }
        }
    }
    isEqual(p, q) {
        return p.x == q.x && p.y == q.y;
    }
    isNeighbour(tr1, tr2) {
        let counter = 0;
        for (let i = 0; i < tr1.size(); i++) {
            for (let j = 0; j < tr2.size(); j++) {
                if (this.isEqual(tr1.points[i], tr2.points[j]))
                    counter += 1;
            }
        }
        return counter == 2;
    }
    getNeighbours(current, except) {
        if (except === undefined)
            except = [];
        let neighbours = this.adjList.get(current);
        if (neighbours === undefined)
            return [];
        return neighbours.filter((pl) => !except.some((ql) => isEqualPoly(pl, ql)));
    }
    getNext(current, previous) {
        if (current === null)
            return [this.root];
        if (previous === undefined) {
            previous = this.prevPoly;
        }
        let neighbours = this.adjList.get(current);
        if (neighbours === undefined)
            return [];
        let next_neighbours = neighbours.filter((pl) => pl != previous);
        this.prevPoly = current;
        return next_neighbours;
    }
    peekNext(current, previous) {
        let neighbours = this.adjList.get(current);
        if (neighbours === undefined)
            return [];
        if (previous === undefined)
            previous = this.prevPoly;
        if (previous === null)
            return neighbours;
        let next_neighbours = neighbours.filter((pl) => pl != previous);
        return next_neighbours;
    }
    findCommonPoints(polygon1, polygon2) {
        let common = [];
        for (let i = 0; i < polygon1.points.length; i++) {
            for (let j = 0; j < polygon2.points.length; j++) {
                if (this.isEqual(polygon1.points[i], polygon2.points[j]))
                    common.push(polygon1.points[i]);
            }
        }
        return common;
    }
    getNextSegment(current, previous) {
        let nextNhs = this.peekNext(current, previous);
        // last polygon of the tree
        if (nextNhs.length === 0) {
            return null;
        }
        // single neighbour case
        if (nextNhs.length === 1) {
            let nh = nextNhs[0];
            let common = this.findCommonPoints(current, nh);
            return [new Segment(common[0], common[1])];
        }
        // multiple neighbours case - intersections
        let segments = [];
        let commonOne = this.findCommonPoints(current, nextNhs[0]);
        let commonTwo = this.findCommonPoints(current, nextNhs[1]);
        segments.push(new Segment(commonOne[0], commonOne[1]));
        segments.push(new Segment(commonTwo[0], commonTwo[1]));
        return segments;
    }
}
export { Point, Segment, Graph, Polygon, DualTree };
//# sourceMappingURL=classes.js.map