"use strict";
/// <reference types="p5/global" />
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
var points = [];
var button;
function setup() {
    createCanvas(400, 400);
    fill(0);
    textSize(32);
    button = createButton('Clear');
    button.position(10, 10);
    button.mousePressed(() => {
        points = [];
        clear();
    });
}
function draw() {
    background(220);
    text("Click points to add", 30, 50);
    for (let p of points) {
        ellipse(p.x, p.y, 10, 10);
    }
}
function mousePressed() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        points.push(new Point(mouseX, mouseY));
    }
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
//# sourceMappingURL=sketch.js.map