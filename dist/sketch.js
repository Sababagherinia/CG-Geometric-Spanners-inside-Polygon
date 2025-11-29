/// <reference types="p5/global" />
import { Point, Polygon, Segment } from "./classes.js";
import { constructSpanner } from "./main.js";
var points = [];
var segments = [];
var polygonDone = false;
var innerPoints = [];
var button;
var buttonSL;
var buttonProj;
var buttonCluster;
var buttonSpanner;
var splittingSegment = null;
var trs = [];
var spannerSegments = [];
var spannerConstructed = false;
var projectedPoints = [];
var rotatedInnerPoints = [];
var showProjections = false;
var showClusters = false;
var representatives = [];
var spannerResult = null;
function setup() {
    createCanvas(windowWidth, windowHeight);
    fill(0);
    textSize(16);
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
        projectedPoints = [];
        rotatedInnerPoints = [];
        showProjections = false;
        showClusters = false;
        representatives = [];
        spannerResult = null;
        clear();
    });
    buttonSL = createButton("1.Split");
    buttonSL.position(90, 85);
    buttonSL.mousePressed(getSplittingLine);
    buttonProj = createButton("2.Projection");
    buttonProj.position(150, 85);
    buttonProj.mousePressed(showProjectionsOnLine);
    buttonCluster = createButton("3.Cluster");
    buttonCluster.position(230, 85);
    buttonCluster.mousePressed(showClustersOnScreen);
    buttonSpanner = createButton("4.Spanner");
    buttonSpanner.position(310, 85);
    buttonSpanner.mousePressed(createSpannerWrapper);
}
function draw() {
    background(220);
    text("Click points to add", 30, 50);
    if (!spannerConstructed) {
        // Draw polygon vertices
        fill(0);
        stroke(0);
        strokeWeight(5);
        for (let p of points) {
            ellipse(p.x, p.y, 10, 10);
        }
        // Draw polygon edges
        for (let i in segments) {
            let seg = segments[i];
            line(seg.src.x, seg.src.y, seg.dest.x, seg.dest.y);
        }
        // Draw inner points
        fill(0, 0, 255);
        stroke(0, 0, 255);
        for (let q of innerPoints) {
            ellipse(q.x, q.y, 5, 5);
        }
        if (splittingSegment !== null) {
            trs = [];
            stroke(255, 0, 0);
            strokeWeight(3);
            line(splittingSegment.src.x, splittingSegment.src.y, splittingSegment.dest.x, splittingSegment.dest.y);
        }
        if (showProjections && projectedPoints.length > 0) {
            // Draw projection lines
            stroke(150, 150, 255);
            strokeWeight(1);
            for (let i = 0; i < rotatedInnerPoints.length; i++) {
                line(rotatedInnerPoints[i].x, rotatedInnerPoints[i].y, projectedPoints[i].x, projectedPoints[i].y);
            }
            // Draw projected points
            fill(255, 0, 255);
            stroke(255, 0, 255);
            strokeWeight(6);
            for (let proj of projectedPoints) {
                ellipse(proj.x, proj.y, 8, 8);
            }
        }
        if (showClusters && representatives.length > 0) {
            // Show projections first
            if (projectedPoints.length > 0) {
                stroke(150, 150, 255);
                strokeWeight(1);
                for (let i = 0; i < rotatedInnerPoints.length; i++) {
                    line(rotatedInnerPoints[i].x, rotatedInnerPoints[i].y, projectedPoints[i].x, projectedPoints[i].y);
                }
            }
            // Draw representative points with distinct color
            fill(0, 255, 0);
            stroke(0, 200, 0);
            strokeWeight(3);
            for (let rep of representatives) {
                ellipse(rep.x, rep.y, 20, 20);
            }
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
            let seg = spannerSegments[i];
            strokeWeight(5);
            line(seg.src.x, seg.src.y, seg.dest.x, seg.dest.y);
        }
    }
}
function isMouseAround(x, y, margin) {
    return mouseX <= x + margin && mouseX >= x - margin && mouseY <= y + margin && mouseY >= y - margin;
}
function mousePressed() {
    // Check if click is not on any button
    let onButton = isMouseAround(30, 85, 50) || isMouseAround(90, 85, 50) ||
        isMouseAround(150, 85, 80) || isMouseAround(230, 85, 50) ||
        isMouseAround(310, 85, 50);
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height && !onButton) {
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
    for (let i = 0; i < points.length; i++) {
        segments.push(new Segment(points[i], points[(i + 1) % points.length]));
    }
}
function getSplittingLine() {
    // Compute spanner result
    let polygon = new Polygon(points);
    spannerResult = constructSpanner(polygon, innerPoints, 2);
    if (spannerResult.splittingSegment === null) {
        console.log("The splitting segment is null - check the code...");
        return;
    }
    // Update the polygon and points with rotated versions
    points = spannerResult.rotatedPolygon.points;
    innerPoints = spannerResult.rotatedPoints;
    splittingSegment = spannerResult.splittingSegment;
    segments = [];
    connectPoints(points);
    console.log("Splitting segment computed and polygon rotated");
}
function showProjectionsOnLine() {
    if (splittingSegment === null) {
        console.log("Please compute the splitting line first");
        return;
    }
    // Compute once and store result
    if (spannerResult === null) {
        let polygon = new Polygon(points);
        spannerResult = constructSpanner(polygon, innerPoints, 2);
    }
    projectedPoints = spannerResult.projections;
    rotatedInnerPoints = spannerResult.rotatedPoints;
    showProjections = true;
    showClusters = false;
    console.log("Projections computed: " + projectedPoints.length);
}
function showClustersOnScreen() {
    if (innerPoints.length === 0) {
        console.log("No points to cluster");
        return;
    }
    // Compute once if not already done
    if (spannerResult === null) {
        let polygon = new Polygon(points);
        spannerResult = constructSpanner(polygon, innerPoints, 2);
    }
    representatives = spannerResult.representativePoints;
    projectedPoints = spannerResult.projections;
    rotatedInnerPoints = spannerResult.rotatedPoints;
    showProjections = false;
    showClusters = true;
    console.log("Representative points to display: " + representatives.length);
}
function createSpannerWrapper() {
    if (innerPoints.length === 0) {
        console.log("No points to create spanner");
        return;
    }
    if (spannerResult === null) {
        let polygon = new Polygon(points);
        spannerResult = constructSpanner(polygon, innerPoints, 2);
    }
    spannerSegments = spannerResult.edges;
    spannerConstructed = true;
    console.log("Spanner constructed with " + spannerSegments.length + " edges");
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