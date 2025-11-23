/// <reference types="p5/global" />

import { lessThan } from "./utils";

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


class AVLNode {
    seg: Segment;
    left: AVLNode | null;
    right: AVLNode | null;
    height: number;
    constructor(seg: Segment) {
        this.seg = seg;
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}

/**
 * Obtained from:
 * https://www.geeksforgeeks.org/dsa/deletion-in-an-avl-tree/
 * https://www.geeksforgeeks.org/dsa/insertion-in-an-avl-tree/
 */
class SegAVLTree {
    static height(node: AVLNode | null): number {
        if (node === null) {
            return 0;
        }
        return node.height;
    }

    static rightRotate(y: AVLNode) {
        const x: AVLNode | null = y.left;
        if (x === null)
            return y;

        const T2: AVLNode | null = x.right;
        if (T2 === null) {
            x.right = y;
            y.left = null
            return x;
        }

        x.right = y;
        y.left = T2;

        y.height = 1 + Math.max(this.height(y.left), this.height(y.right));
        x.height = 1 + Math.max(this.height(x.left), this.height(x.right));

        return x;
    }

    static leftRotate(x: AVLNode) {
        const y: AVLNode | null = x.right;
        if (y === null)
            return x;

        const T2: AVLNode | null = y.left;
        if (T2 === null) {
            y.left = x;
            x.right = null;
            return y;
        }

        y.left = x;
        x.right = T2;

        x.height = 1 + Math.max(this.height(x.left), this.height(x.right));
        y.height = 1 + Math.max(this.height(y.left), this.height(y.right));

        return y;
    }

    // Get balance factor of node
    static getBalance(node: AVLNode | null) {
        if (node === null) {
            return 0;
        }
        return this.height(node.left) - this.height(node.right);
    }

    static insert(node: AVLNode | null, key: Segment, x:number) {
        if (node === null) {
            return new AVLNode(key);
        }

        if (key < node.seg) {
            node.left = this.insert(node.left, key, x);
        } else if (key > node.seg) {
            node.right = this.insert(node.right, key, x);
        } else {
            return node;
        }

        node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
        const balance = this.getBalance(node);

        // Left Left Case
        if (balance > 1 && node.left !== null && lessThan(key, node.left.seg, x)) {
            return this.rightRotate(node);
        }

        // Right Right Case
        if (balance < -1 && node.right !== null && lessThan(node.right.seg, key, x)) {
            return this.leftRotate(node);
        }

        // Left Right Case
        if (balance > 1 && node.left !== null && lessThan(node.left.seg, key, x)) {
            node.left = this.leftRotate(node.left);
            return this.rightRotate(node);
        }

        // Right Left Case
        if (balance < -1 && node.right !== null && lessThan(key, node.right.seg, x)) {
            node.right = this.rightRotate(node.right);
            return this.leftRotate(node);
        }

        // Return the (unchanged) node pointer
        return node;
    }

    static preOrder(root: AVLNode | null) {
        if (root !== null) {
            console.log(root.seg + " ");
            this.preOrder(root.left);
            this.preOrder(root.right);
        }
    }

    static minValueNode(node: AVLNode) {
        let current = node;
        while (current.left !== null) {
            current = current.left;
        }
        return current;
    }

    static deleteNode(root: AVLNode | null, key: Segment, x:number) {
        if (root === null) return root;

        if (lessThan(key, root.seg, x)) {
            root.left = this.deleteNode(root.left, key, x);
        } else if (lessThan(root.seg, key, x)) {
            root.right = this.deleteNode(root.right, key, x);
        } else {
            if (root.left === null || root.right === null) {
                const temp = root.left ? root.left : root.right;

                if (temp === null) {
                    root = null;
                } else { 
                    root = temp; 
                }
            } else {
                const temp = this.minValueNode(root.right);
                root.seg = temp.seg;
                root.right = this.deleteNode(root.right, temp.seg, x);
            }
        }

        // If the tree had only one node then return
        if (root === null) return root;
        root.height = Math.max(this.height(root.left), this.height(root.right)) + 1;
        const balance = this.getBalance(root);

        // Left Left Case
        if (balance > 1 && this.getBalance(root.left) >= 0) {
            return this.rightRotate(root);
        }

        // Left Right Case
        if (balance > 1 && root.left !== null && this.getBalance(root.left) < 0) {
            root.left = this.leftRotate(root.left);
            return this.rightRotate(root);
        }

        // Right Right Case
        if (balance < -1 && this.getBalance(root.right) <= 0) {
            return this.leftRotate(root);
        }

        // Right Left Case
        if (balance < -1 && root.right !== null && this.getBalance(root.right) > 0) {
            root.right = this.rightRotate(root.right);
            return this.leftRotate(root);
        }

        return root;
    }
}

export { Point, Segment, Graph, Polygon, DualNode, AVLNode, SegAVLTree};