'use strict';

const backendUrl = "http://10.230.18.22:3000";

const locations = [
    { id: 0, x: 0, y: 185, xSize: 350, ySize: 165 },
    { id: 1, x: 0, y: 515, xSize: 305, ySize: 90 },
    { id: 2, x: 435, y: 0, xSize: 250, ySize: 110 },
    { id: 3, x: 490, y: 365, xSize: 77, ySize: 95 },
    { id: 4, x: 715, y: 175, xSize: 85, ySize: 215 }
]

const getStatus = async (backendUrl) => ((await fetch(`${backendUrl}/status`)).json());
const getCollectedParts = async (backendUrl) => ((await fetch(`${backendUrl}/parts`)).json());

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const mapImage = new Image();
mapImage.src = "map.png";

let currentStatus = [];
let collectedParts = [];


mapImage.onload = () => {
    drawImageInCanvas();
    //testDoneLocations();
}

function drawImageInCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
    console.log('drawImageInCanvas');
}

function drawDoneLocation(location) {
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.fillRect(location.x, location.y, location.xSize, location.ySize);
    console.log(`location done and drawn at x=${location.x}, y=${location.y}, id=${location.id}`);
}


function testDoneLocations() {
    locations.forEach(location => drawDoneLocation(location));
}



