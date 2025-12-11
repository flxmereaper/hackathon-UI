'use strict';

const backendUrl = "http://localhost:3000"; // "http://10.230.18.55:3000" // "http://192.168.4.4:3000"

const locations = [
    { id: 0, x: 0, y: 185, xSize: 350, ySize: 165, availableParts: 0, collectedParts: 0 },
    { id: 1, x: 0, y: 515, xSize: 305, ySize: 90, availableParts: 0, collectedParts: 0 },
    { id: 2, x: 435, y: 0, xSize: 250, ySize: 110, availableParts: 0, collectedParts: 0 },
    { id: 3, x: 490, y: 365, xSize: 77, ySize: 95, availableParts: 0, collectedParts: 0 },
    { id: 4, x: 715, y: 175, xSize: 85, ySize: 215, availableParts: 0, collectedParts: 0 }
];

const getStatus = async (url) => ((await fetch(url)).json());
const getLocations = async (url) => ((await fetch(url)).json());

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const mapImage = new Image();
mapImage.src = "../frontend/img/map.png";

let currentStatus = 0;
let currentLocationHovering = 0;

const popup = document.getElementById('locationPopup');

getLocationsFromBackend();

mapImage.onload = () => {
    drawImageInCanvas();
};

function drawImageInCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
    console.log('drawImageInCanvas');
}

function drawLocationDone(location) {
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.fillRect(location.x, location.y, location.xSize, location.ySize);
}

function drawLocationNotDone(location) {
    ctx.fillStyle = "rgba(245, 189, 7, 0.5)";
    ctx.fillRect(location.x, location.y, location.xSize, location.ySize);
}

function drawLocationAvailable(location) {
    ctx.fillStyle = "rgba(133, 133, 133, 0.5)";
    ctx.fillRect(location.x, location.y, location.xSize, location.ySize);
}

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const yPos = e.clientY - rect.top;

    const hit = locations.find(
        location =>
            xPos >= location.x && xPos <= location.x + location.xSize &&
            yPos >= location.y && yPos <= location.y + location.ySize
    );

    if (!hit) {
        popup.style.display = "none";
        return;
    }

    currentLocationHovering = hit.id;

    const wrapperRect = canvas.parentElement.getBoundingClientRect();
    popup.style.left = `${e.clientX - wrapperRect.left + 360}px`;
    popup.style.top = `${e.clientY - wrapperRect.top - 40}px`;

    popup.innerHTML = `
    <strong>Location ${hit.id}</strong><br>
    Verfügbare Teile: ${hit.availableParts}<br>
    Aufgehobene Teile: ${hit.collectedParts}
  `;

    popup.style.display = "block";
});

document.addEventListener("click", (e) => {
    if (!canvas.contains(e.target) && !popup.contains(e.target)) {
        popup.style.display = "none";
    }
});

async function getLocationsFromBackend() {
    const locationsBackend = await getLocations(`${backendUrl}/locations`);
    updateLocations(locationsBackend);
    updateProgressbar();
}

function updateLocations(locationsBackend) {
    locationsBackend.forEach(locationB => {
        const local = locations.find(l => l.id == locationB.id);
        if (local) {
            local.availableParts = locationB.availableItems;
            local.collectedParts = locationB.collectedItems;
        }
    });

    //console.log('UPDATED THE LOCATION');

    updateLocationsDrawing();
    updatePartsInfo();
}

function updateLocationsDrawing() {
    drawImageInCanvas();

    locations.forEach(l => {
        if (l.availableParts === l.collectedParts)
            drawLocationDone(l);
        else if (l.collectedParts === 0)
            drawLocationAvailable(l);
        else if (l.availableParts > l.collectedParts)
            drawLocationNotDone(l);
    });
}

window.addEventListener('load', function () {
    const fetchInterval = 1000;
    setInterval(getLocationsFromBackend, fetchInterval);
});

function getTotals() {
    let collected = 0;
    let available = 0;

    locations.forEach(l => {
        collected += l.collectedParts;
        available += l.availableParts;
    });

    return { collected, available };
}

function getTotalProgress() {
    const { collected, available } = getTotals();

    if (available === 0) return 0;

    return (collected / available) * 100;
}

function updateProgressbar() {
    document.getElementById('ftsProgress').value = getTotalProgress();
}

function updatePartsInfo() {
    const { collected, available } = getTotals();
    document.getElementById('pAvailableParts').textContent =
        `Verfügbare Teile: ${available}`;
    document.getElementById('pCollectedParts').textContent =
        `Aufgehobene Teile: ${collected}`;
}

// function startButtonClickedEvent() {
//     // inform the backend of the start!!!

//     console.log('START BTN clicked!');
// }

// document.getElementById('btnStart').addEventListener('click', () => startButtonClickedEvent());