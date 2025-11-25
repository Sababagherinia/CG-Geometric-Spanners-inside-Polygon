/// <reference types="p5/global" />
import { Point, Polygon, Segment } from "./classes.js";
import { computeDet } from "./utils.js";
import { computeSplittingSegmentWrapper } from "./vertical_segment.js";

var points: Point[] = [];
var segments: Segment[] = [];
var polygonDone: boolean = false;
var innerPoints: Point[] = [];
var button: any;
var buttonSL: any;
var splittingSegment: Segment | null = null;

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
    polygonDone = false;
    clear();
  });

  buttonSL = createButton("Splitting Line");
  buttonSL.position(90, 85);
  buttonSL.mousePressed(getSplittingLine);
}

function draw() {
  background(220);
  text("Click points to add", 30, 50);
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
    stroke('magenta');
    strokeWeight(5);
    line(splittingSegment.src.x,splittingSegment.src.y,splittingSegment.dest.x,splittingSegment.dest.y);
  }
}

function isMouseAround(x: number, y: number, margin: number): Boolean {
  return mouseX <= x + margin && mouseX >= x - margin && mouseY <= y + margin && mouseY >= y - margin;
}

function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height && !isMouseAround(30, 85, 30) && !isMouseAround(90, 85, 90)) {
    if (polygonDone)
      innerPoints.push(new Point(mouseX, mouseY));
    else {
      if (points.length >= 2 && mouseX <= points[0].x+30 && mouseX >= points[0].x-30 && mouseY <= points[0].y+30 && mouseY >= points[0].y-30) {
        polygonDone = true;
        segments.push(
          new Segment(points[points.length - 1], points[0])
        );
      } else {
        points.push(new Point(mouseX, mouseY));
        if (points.length >= 2) {
            segments.push(
              new Segment(points[points.length - 2], points[points.length - 1])
            );
        }
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function getSplittingLine() {
  points.sort((p,q) => computeDet(p,points[0],q));
  let polygon: Polygon = new Polygon(points);
  let ss: Segment | null = computeSplittingSegmentWrapper(polygon, innerPoints);
  if (ss === null)
    console.log("The splitting segment is null - check the code...");
  splittingSegment = ss;
}

// Expose functions globally so p5 can find them
(window as any).setup = setup;
(window as any).draw = draw;
(window as any).mousePressed = mousePressed;
(window as any).windowResized = windowResized;

