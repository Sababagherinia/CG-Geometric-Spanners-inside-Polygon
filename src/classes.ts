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
    // diag: Segment;
    parent?: DualNode;
    childen: DualNode[];
    constructor(poly: Polygon, children: DualNode[], parent?: DualNode) {
        this.poly = poly;
        // this.diag = diag;
        this.parent = parent;
        this.childen = children;
    }
}

class DualTree {
    root: DualNode | undefined;
    curr: DualNode | undefined;
    triangles: Polygon[] | undefined;
    constructor(root?: DualNode) {
        this.root = root;
        this.curr = root;
        this.triangles = undefined;
    }

    insert(n: DualNode) {
        if (this.root === undefined || this.root === null) {
            this.root = n;
            this.curr = n;
            this.triangles?.push(n.poly);
            return;
        }

        this.curr?.childen.push(n);
    }

    join(dt: DualTree) {
        let ts: Polygon[] | undefined = dt.getTriangles;
        if (ts === undefined)
            return;
        this.triangles = this.triangles?.concat(ts);

        if (dt.root === undefined)
            return;
        this.curr?.childen.push(dt.root);
    }

    delete(n: DualNode) {
        return;
    }

    get getTriangles(): Polygon[] | undefined {
        return this.triangles;
    }
}

export { Point, Segment, Graph, Polygon, DualTree, DualNode, Queue};