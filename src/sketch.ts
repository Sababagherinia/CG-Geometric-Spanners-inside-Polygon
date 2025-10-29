/// <reference types="p5/global" />
class Points{
  x: number;
  y: number;
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

var points: Points[] = [];
var button: any;

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
    points.push(new Points(mouseX, mouseY));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

