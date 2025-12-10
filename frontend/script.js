'use strict';

const backendUrl = "http://10.230.18.22:3000";

const locations = [
    { id: 0, x: 0, y: 185, xSize: 350, ySize: 165, availableParts: 0, collectedParts: 0 },
    { id: 1, x: 0, y: 515, xSize: 305, ySize: 90, availableParts: 0, collectedParts: 0 },
    { id: 2, x: 435, y: 0, xSize: 250, ySize: 110, availableParts: 0, collectedParts: 0 },
    { id: 3, x: 490, y: 365, xSize: 77, ySize: 95, availableParts: 0, collectedParts: 0 },
    { id: 4, x: 715, y: 175, xSize: 85, ySize: 215, availableParts: 0, collectedParts: 0 }
];

const getStatus = async (backendUrl) => ((await fetch(`${backendUrl}`)).json());
const getLocations = async (backendUrl) => ((await fetch(`${backendUrl}`)).json());

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const mapImage = new Image();
mapImage.src = "../frontend/img/map.png";

let currentStatus = [];
let collectedParts = [];

let currentLocationHovering = 0;

getLocationsFromBackend();


mapImage.onload = () => {
    drawImageInCanvas();
    //testNotDoneLocations();
    //testDoneLocations();
    testAvailableLocations();
}

function drawImageInCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
    console.log('drawImageInCanvas');
}

function drawLocationDone(location) {
    //ctx.clearRect(location.x, location.y, location.xSize, location.ySize);
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.fillRect(location.x, location.y, location.xSize, location.ySize);
    console.log(`location done and drawn at x = ${location.x}, y = ${location.y}, id = ${location.id}`);
}

function drawLocationNotDone(location) {
    //ctx.clearRect(location.x, location.y, location.xSize, location.ySize);
    ctx.fillStyle = "rgba(245, 189, 7, 0.5)";
    ctx.fillRect(location.x, location.y, location.xSize, location.ySize);
    //console.log(`location done and drawn at x = ${ location.x }, y = ${ location.y }, id = ${ location.id }`);
}

function drawLocationAvailable(location) {
    //ctx.clearRect(location.x, location.y, location.xSize, location.ySize);
    ctx.fillStyle = "rgba(133, 133, 133, 0.5)";
    ctx.fillRect(location.x, location.y, location.xSize, location.ySize);
    //console.log(`location done and drawn at x = ${ location.x }, y = ${ location.y }, id = ${ location.id }`);
}

// function drawNextLocation(location) {
//     ctx.fillStyle = "rgba(0, 150, 255, 0.3)";
// }


function testDoneLocations() {
    locations.forEach(location => drawLocationDone(location));
}

function testNotDoneLocations() {
    locations.forEach(location => drawLocationNotDone(location));
}

function testAvailableLocations() {
    locations.forEach(location => {
        if (location.collectedParts == 0)
            drawLocationAvailable(location);
    })
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const yPos = e.clientY - rect.top;

    const hit = locations.find(
        location => xPos >= location.x && xPos <= location.x + location.xSize &&
            yPos >= location.y && yPos <= location.y + location.ySize
    );

    if (hit) {
        currentLocationHovering = hit.id;
        //console.log(`location with id: ${ currentLocationHovering } `);
    }
    else {
        currentLocationHovering = -1;
    }

    //console.log(`last hovered location id: ${ currentLocationHovering } `);    
});


async function getLocationsFromBackend() {
    let locationsBackend = await getLocations(`${backendUrl}/locations`);
    // console.log(locationsBackend);

    updateLocations(locationsBackend);
}

function updateLocations(locationsBackend) {
    locationsBackend.forEach(locationB => {
        const local = locations.find(l => l.id == locationB.id);
        if (local) {
            local.availableParts = locationB.availableItems;
            local.collectedParts = locationB.collectedItems;
        }
    });

    // console.log(locations);
}
