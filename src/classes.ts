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

    constructor(points: Point[]) {
        this.points = points;

        for (let i = 0; i < points.length; i++) {
            let src = points[i % points.length];
            let dest = points[(i+1) % points.length];
            this.segments.push(new Segment(src, dest));
        }
    }
}

export { Point, Segment, Graph, Polygon };