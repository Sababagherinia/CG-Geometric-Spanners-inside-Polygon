/// <reference types="p5/global" />

import { Polygon, Segment } from "./classes";
import { computeSplittingSegmentWrapper } from "./vertical_segment";

class Points{
  x: number;
  y: number;
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

var points: Points[] = [];
var polygonDone: boolean = false;
var innerPoints: Points[] = [];
var button: any;
var buttonSL: any;
var buttonInnerPoints: any;
var splittingSegment: Segment | null = null;

function setup() {
  createCanvas(400, 400);
  fill(0);
  textSize(32);
  button = createButton('Clear');
  button.position(30, 85);
  button.mousePressed(() => {
    points = [];
    clear();
  });

  buttonSL = createButton("Splitting Line");
  buttonSL.position(90, 85);
  buttonSL.mousePressed(getSplittingLine);

  buttonInnerPoints = createButton("Specify Extra Points");
  buttonInnerPoints.position(300, 85);
  buttonInnerPoints.mousePressed(() => polygonDone = true);
}

function draw() {
  background(220);
  text("Click points to add", 30, 50);
  for (let p of points) {
    ellipse(p.x, p.y, 10, 10);
  }

  if (splittingSegment !== null) {
    stroke('magenta');
    strokeWeight(5);
    line(splittingSegment.src.x,splittingSegment.src.y,splittingSegment.dest.x,splittingSegment.dest.y);
  }
}

function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    if (polygonDone)
      innerPoints.push(new Points(mouseX, mouseY));
    else 
      points.push(new Points(mouseX, mouseY));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function getSplittingLine() {
  let polygon: Polygon = new Polygon(points);
  let ss: Segment | null = computeSplittingSegmentWrapper(polygon, innerPoints);
  if (ss === null)
    console.log("The splitting segment is null - check the code...");
  splittingSegment = ss;
}

