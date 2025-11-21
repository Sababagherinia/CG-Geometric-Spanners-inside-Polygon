/// <reference types="p5/global" />
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

class DualNode {
    poly: Polygon;
    parent: DualNode | null;
    leftChild: DualNode | null;
    rightChild: DualNode | null;
    isRoot: boolean;
    constructor(poly: Polygon) {
        this.poly = poly;
        this.parent = null;
        this.leftChild = null;
        this.rightChild = null;
        this.isRoot = false;
    }

    triangles(): Polygon[] {
        let triangles: Polygon[] = [];
        triangles.push(this.poly);
        if (this.leftChild !== null) {
            let leftTriangles: Polygon[] = this.leftChild.triangles();
            triangles = triangles.concat(leftTriangles);
        }

        if (this.rightChild !== null) {
            let rightTriangles: Polygon[] = this.rightChild.triangles();
            triangles = triangles.concat(rightTriangles);
        }

        return triangles;
    }
}

export { Point, Segment, Graph, Polygon, DualNode};