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
    
    constructor(src: Point, dest: Point) {
        this.src = src;
        this.dest = dest;
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

class Queue<T> {
    buffer: T[] = [];

    enqueue(elem: T) {
        this.buffer.push(elem);
    }

    dequeue(): T | undefined {
        return this.buffer.shift();
    }

    size(): number {
        return this.buffer.length;
    }
}

class DualNode {
    poly: Polygon;
    parent: DualNode | null;
    leftChild: DualNode | null;
    rightChild: DualNode | null;
    constructor(poly: Polygon) {
        this.poly = poly;
        this.parent = null;
        this.leftChild = null;
        this.rightChild = null;
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

export { Point, Segment, Graph, Polygon, DualNode, Queue};