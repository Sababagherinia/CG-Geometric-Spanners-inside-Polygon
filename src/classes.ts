import { isEqualPoly } from "./utils.js";

class Point {
  x: number;
  y: number;
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class Segment {
    src: Point;
    dest: Point;
    slope: number;
    intercept: number;
    
    constructor(src: Point, dest: Point) {
        this.src = src;
        this.dest = dest;

        this.slope = (this.dest.y - this.src.y) / (this.dest.x - this.dest.x);
        this.intercept = this.src.y - (this.slope * this.src.x);
    }

    isOnSegment(p: Point): boolean {
        let lineY: number = this.slope * p.x + this.intercept;

        return lineY == p.y;
    }

    computeY(x: number): number {
        return this.slope * x + this.intercept;
    }
}

class Graph {
    points: Point[];
    edges: Segment[];

    constructor(points: Point[], edges: Segment[]) {
        this.points = points;
        this.edges = edges;
    }
}

// vertices have to be given in clockwise order
class Polygon {
    points: Point[];
    segments: Segment[] = [];

    constructor(points: Point[]);
    constructor(points: Point[], segments: Segment[]);
    constructor(points: Point[], segments?: Segment[])
    {
        this.points = points;
        if (segments !== null && segments !== undefined)
            this.segments = segments;
        else {
            for (let i = 0; i < points.length; i++) {
                let src = points[i % points.length];
                let dest = points[(i+1) % points.length];
                this.segments.push(new Segment(src, dest));
            }
        }
    }

    size() {
        return this.points.length;
    }
}

class DualTree {
    adjList: Map<Polygon,Polygon[]> = new Map<Polygon,Polygon[]>();
    polygons: Polygon[] = [];
    prevPoly: Polygon | null = null;
    root: Polygon;
    constructor(triangles: Point[][]) {
        if (triangles.length === 1) {
            this.polygons = [new Polygon(triangles[0])];
            this.adjList = new Map<Polygon,Polygon[]>([[this.polygons[0],[]]]);
            this.root = this.polygons[0];
        } else {
            let minx: number = Number.MAX_VALUE;
            let minIdx: number = 0;
            for (let i = 0; i < triangles.length; i++) {

                let x_coords = triangles[i].map((p) => p.x);
                let x_coords_min = Math.min(...x_coords);
                if (x_coords_min < minx) {
                    minx = x_coords_min;
                    minIdx = i;
                }

                let pl: Polygon = new Polygon(triangles[i]);
                this.polygons.push(pl);
                this.adjList.set(pl,[]);
            }
            this.root = this.polygons[minIdx];
    
            for (let i = 0; i < this.polygons.length; i++) {
                for (let j = 0; j < this.polygons.length; j++) {
                    if (i === j) continue;
                    if (!this.isNeighbour(this.polygons[i],this.polygons[j])) continue;
                    this.adjList.get(this.polygons[i])?.push(this.polygons[j]);
                }
            }
        }
    }

    isEqual(p: Point, q: Point): Boolean {
        return p.x == q.x && p.y == q.y;
    }

    isNeighbour(tr1: Polygon, tr2: Polygon): Boolean {
        let counter: number = 0;
        for (let i = 0; i < tr1.size(); i++) {
            for (let j = 0; j < tr2.size(); j++) {
                if (this.isEqual(tr1.points[i],tr2.points[j])) counter += 1;
            }
        }

        return counter == 2;
    }

    getNeighbours(current: Polygon, except?: Polygon[]): Polygon[] {
        if (except === undefined)
            except = [];

        let neighbours: Polygon[] | undefined = this.adjList.get(current);
        if (neighbours === undefined)
            return [];

        return neighbours.filter((pl) => !except.some((ql) => isEqualPoly(pl, ql)));
    }

    getNext(current: Polygon | null, previous?: Polygon | null): Polygon[] {
        if (current === null)
            return [this.root];

        if (previous === undefined) {
            previous = this.prevPoly;
        }

        let neighbours: Polygon[] | undefined = this.adjList.get(current);
        if (neighbours === undefined)
            return [];

        let next_neighbours = neighbours.filter((pl) => pl != previous);
        this.prevPoly = current;
        return next_neighbours;
    }

    peekNext(current: Polygon, previous?: Polygon | null): Polygon[] {
        let neighbours: Polygon[] | undefined = this.adjList.get(current);
        if (neighbours === undefined)
            return [];

        if (previous === undefined)
            previous = this.prevPoly;

        if (previous === null)
            return neighbours;

        let next_neighbours = neighbours.filter((pl) => pl != previous);
        return next_neighbours;
    }

    findCommonPoints(polygon1: Polygon, polygon2: Polygon): Point[] {
        let common: Point[] = [];
        for (let i = 0; i < polygon1.points.length; i++) {
            for (let j = 0; j < polygon2.points.length; j++) {
                if (this.isEqual(polygon1.points[i],polygon2.points[j]))
                    common.push(polygon1.points[i]);
            }
        }

        return common;
    }

    getNextSegment(current: Polygon, previous: Polygon | null): Segment[] | null {
        let nextNhs: Polygon[] = this.peekNext(current, previous);

        // last polygon of the tree
        if (nextNhs.length === 0) {
            return null;
        }

        // single neighbour case
        if (nextNhs.length === 1) {
            let nh: Polygon = nextNhs[0];
            let common: Point[] = this.findCommonPoints(current,nh);
            return [new Segment(common[0],common[1])];
        }

        // multiple neighbours case - intersections
        let segments: Segment[] = [];
        let commonOne: Point[] = this.findCommonPoints(current,nextNhs[0]);
        let commonTwo: Point[] = this.findCommonPoints(current,nextNhs[1]);

        segments.push(new Segment(commonOne[0],commonOne[1]));
        segments.push(new Segment(commonTwo[0],commonTwo[1]));

        return segments;
    }
}

export { Point, Segment, Graph, Polygon, DualTree};