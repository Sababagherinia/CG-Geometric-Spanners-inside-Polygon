/// <reference types="p5/global" />
import { DualTree, Point, Polygon, Segment } from "./classes.js";
import { constructSpanner } from "./main.js";
import { triangulate } from "./utils.js";
import { computeSplittingSegment, unoptimizedRotation } from "./vertical_segment.js";
var points = [];
var segments = [];
var polygonDone = false;
var innerPoints = [];
var button;
var buttonSL;
var buttonSpanner;
var splittingSegment = null;
var trs = [];
var spannerSegments = [];
var spannerConstructed = false;
function setup() {
    createCanvas(400, 400);
    fill(0);
    textSize(32);
    button = createButton('Clear');
    button.position(30, 85);
    button.mousePressed(() => {
        points = [];
        segments = [];
        innerPoints = [];
        splittingSegment = null;
        polygonDone = false;
        trs = [];
        spannerSegments = [];
        spannerConstructed = false;
        clear();
    });
    buttonSL = createButton("Split");
    buttonSL.position(90, 85);
    buttonSL.mousePressed(getSplittingLine);
    buttonSpanner = createButton("Spanner");
    buttonSpanner.position(150, 85);
    buttonSpanner.mousePressed(createSpannerWrapper);
}
function draw() {
    background(220);
    text("Click points to add", 30, 50);
    if (!spannerConstructed) {
        for (let p of points) {
            ellipse(p.x, p.y, 10, 10);
        }
        for (let i in segments) {
            let seg = segments[i];
            strokeWeight(5);
            line(seg.src.x, seg.src.y, seg.dest.x, seg.dest.y);
        }
        for (let q of innerPoints) {
            ellipse(q.x, q.y, 5, 5);
        }
        if (splittingSegment !== null) {
            trs = [];
            strokeWeight(5);
            line(splittingSegment.src.x, splittingSegment.src.y, splittingSegment.dest.x, splittingSegment.dest.y);
        }
        if (trs.length !== 0) {
            for (let i = 0; i < trs.length; i++) {
                let tr = trs[i];
                stroke(2);
                line(tr[0].x, tr[0].y, tr[1].x, tr[1].y);
                line(tr[1].x, tr[1].y, tr[2].x, tr[2].y);
                line(tr[2].x, tr[2].y, tr[0].x, tr[0].y);
                stroke(5);
            }
        }
    }
    else {
        for (let i in spannerSegments) {
            let seg = segments[i];
            strokeWeight(5);
            line(seg.src.x, seg.src.y, seg.dest.x, seg.dest.y);
        }
    }
}
function isMouseAround(x, y, margin) {
    return mouseX <= x + margin && mouseX >= x - margin && mouseY <= y + margin && mouseY >= y - margin;
}
function mousePressed() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height && !isMouseAround(30, 85, 30) && !isMouseAround(90, 85, 90) && !isMouseAround(150, 85, 100)) {
        if (polygonDone) {
            innerPoints.push(new Point(mouseX, mouseY));
            // testGeodesic();
        }
        else {
            if (points.length >= 2 && mouseX <= points[0].x + 30 && mouseX >= points[0].x - 30 && mouseY <= points[0].y + 30 && mouseY >= points[0].y - 30) {
                polygonDone = true;
                segments.push(new Segment(points[points.length - 1], points[0]));
            }
            else {
                points.push(new Point(mouseX, mouseY));
                if (points.length >= 2) {
                    segments.push(new Segment(points[points.length - 2], points[points.length - 1]));
                }
            }
        }
    }
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
function connectPoints(points) {
    for (let i = 0; i <= points.length; i++) {
        segments.push(new Segment(points[i], points[(i + 1) % points.length]));
    }
}
function getSplittingLine() {
    // points.sort((p,q) => computeDet(p,points[0],q));
    let triangles = triangulate(points);
    trs = triangles;
    console.log("Creating the Dual Tree...");
    let dt = new DualTree(triangles);
    console.log("Computing the splitting line segment...");
    let ss = computeSplittingSegment(dt, innerPoints);
    console.log("Done...");
    if (ss === null) {
        console.log("The splitting segment is null - check the code...");
        return;
    }
    let polygon = new Polygon(points);
    let [newSS, newPoly, newInnerPoints] = unoptimizedRotation(ss, polygon, innerPoints);
    points = newPoly.points;
    innerPoints = newInnerPoints;
    splittingSegment = newSS;
    segments = [];
    connectPoints(points);
}
function createSpannerWrapper() {
    let polygon = new Polygon(points);
    let segments = constructSpanner(polygon, innerPoints, 10);
    spannerSegments = segments;
    console.log("Spanner length is 0");
    spannerConstructed = true && spannerSegments.length > 0;
}
// function testGeodesic() {
//   if (innerPoints.length < 2)
//     return;
//   let polygon: Polygon = new Polygon(points);
//   let ip1 = innerPoints[innerPoints.length-2];
//   let ip2 = innerPoints[innerPoints.length-1];
//   console.log(geodesic_distance(polygon,ip1,ip2));
//   return;
// }
// Expose functions globally so p5 can find them
window.setup = setup;
window.draw = draw;
window.mousePressed = mousePressed;
window.windowResized = windowResized;
//# sourceMappingURL=sketch.js.map