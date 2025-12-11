'use strict';

const backendUrl = "http://localhost:3000";

const locations = [
    { id: 0, x: 0, y: 185, xSize: 350, ySize: 165, availableParts: 0, collectedParts: 0 },
    { id: 1, x: 0, y: 515, xSize: 305, ySize: 90, availableParts: 0, collectedParts: 0 },
    { id: 2, x: 435, y: 0, xSize: 250, ySize: 110, availableParts: 0, collectedParts: 0 },
    { id: 3, x: 490, y: 365, xSize: 77, ySize: 95, availableParts: 0, collectedParts: 0 },
    { id: 4, x: 715, y: 175, xSize: 85, ySize: 215, availableParts: 0, collectedParts: 0 }
];

const getStatus = async (url) => ((await fetch(url)).json());
const getLocations = async (url) => ((await fetch(url)).json());
const getProducts = async (url) => ((await fetch(url)).json());

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const mapImage = new Image();
mapImage.src = "../frontend/img/map.png";

let currentStatus = 0;
let currentLocationHovering = 0;
let highlightedLocationId = null;
let allProducts = [];

const popup = document.getElementById('locationPopup');

getLocationsFromBackend();
displayOrderedParts();

mapImage.onload = () => {
    drawImageInCanvas();
};

function drawImageInCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
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

function drawLocationEmpty(location) {
    // Dark red/gray fill to indicate no parts available
    ctx.fillStyle = "rgba(80, 80, 80, 0.6)";
    ctx.fillRect(location.x, location.y, location.xSize, location.ySize);

    // Red diagonal stripes pattern
    ctx.strokeStyle = "rgba(191, 9, 47, 0.7)";
    ctx.lineWidth = 3;

    const spacing = 20;
    for (let i = -location.ySize; i < location.xSize; i += spacing) {
        ctx.beginPath();
        ctx.moveTo(location.x + i, location.y);
        ctx.lineTo(location.x + i + location.ySize, location.y + location.ySize);
        ctx.stroke();
    }

    // Red border
    ctx.strokeStyle = "rgba(191, 9, 47, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(location.x, location.y, location.xSize, location.ySize);
}

function drawLocationHighlight(location) {
    ctx.strokeStyle = "rgba(59, 151, 151, 1)";
    ctx.lineWidth = 5;
    ctx.strokeRect(location.x + 2.5, location.y + 2.5, location.xSize - 5, location.ySize - 5);

    ctx.strokeStyle = "rgba(59, 151, 151, 0.5)";
    ctx.lineWidth = 8;
    ctx.strokeRect(location.x, location.y, location.xSize, location.ySize);
}

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const xPos = (e.clientX - rect.left) * scaleX;
    const yPos = (e.clientY - rect.top) * scaleY;

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
    popup.style.left = `${e.clientX - wrapperRect.left}px`;
    popup.style.top = `${e.clientY - wrapperRect.top - 70}px`;

    const productsAtLocation = allProducts.filter(p => p.locationId === hit.id);

    let productsHTML = '';
    if (productsAtLocation.length > 0) {
        productsHTML = '<br><strong>Teile:</strong><br>' +
            productsAtLocation.map(p => `• ${p.name}`).join('<br>');
    }

    let statusText = '';
    if (hit.availableParts === 0) {
        statusText = '<br><span style="color: #BF092F; font-weight: bold;">⚠ Keine Teile verfügbar</span>';
    }

    popup.innerHTML = `
    <strong>Location ${hit.id}</strong><br>
    Verfügbare Teile: ${hit.availableParts}<br>
    Aufgehobene Teile: ${hit.collectedParts}
    ${productsHTML}
    ${statusText}
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

    updateLocationsDrawing();
    updatePartsInfo();
}

function updateLocationsDrawing() {
    drawImageInCanvas();

    locations.forEach(l => {
        // Check if location has no available parts (empty)
        if (l.availableParts === 0) {
            drawLocationEmpty(l);
        }
        // All parts collected
        else if (l.availableParts === l.collectedParts) {
            drawLocationDone(l);
        }
        // No parts collected yet
        else if (l.collectedParts === 0) {
            drawLocationAvailable(l);
        }
        // Partially collected
        else if (l.availableParts > l.collectedParts) {
            drawLocationNotDone(l);
        }
    });

    if (highlightedLocationId !== null) {
        const highlightedLocation = locations.find(l => l.id === highlightedLocationId);
        if (highlightedLocation) {
            drawLocationHighlight(highlightedLocation);
        }
    }
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

function getOrderedPartsTotals() {
    let orderedCollected = 0;
    let orderedTotal = 0;

    const cartData = sessionStorage.getItem('shoppingCart');

    if (!cartData) {
        return { orderedCollected: 0, orderedTotal: 0 };
    }

    try {
        const cart = JSON.parse(cartData);

        cart.forEach(([productId, count]) => {
            orderedTotal += count;

            const product = allProducts.find(p => p.id === productId);
            if (product) {
                const location = locations.find(l => l.id === product.locationId);
                if (location) {
                    const collectedAtLocation = Math.min(count, location.collectedParts);
                    orderedCollected += collectedAtLocation;
                }
            }
        });

        return { orderedCollected, orderedTotal };
    } catch (err) {
        console.error('Error calculating ordered parts totals:', err);
        return { orderedCollected: 0, orderedTotal: 0 };
    }
}

function getTotalProgress() {
    const { orderedCollected, orderedTotal } = getOrderedPartsTotals();

    if (orderedTotal === 0) return 0;

    return (orderedCollected / orderedTotal) * 100;
}

function updateProgressbar() {
    const progress = getTotalProgress();
    document.getElementById('ftsProgress').value = progress;

    const { orderedCollected, orderedTotal } = getOrderedPartsTotals();
    const label = document.querySelector('.status label');
    if (label && orderedTotal > 0) {
        label.textContent = `FTS Status: ${orderedCollected}/${orderedTotal} Teile aufgehoben`;
    }
}

function updatePartsInfo() {
    const { collected, available } = getTotals();
    document.getElementById('pAvailableParts').textContent =
        `Verfügbare Teile: ${available}`;
    document.getElementById('pCollectedParts').textContent =
        `Aufgehobene Teile: ${collected}`;
}

async function displayOrderedParts() {
    try {
        const cartData = sessionStorage.getItem('shoppingCart');

        if (!cartData) {
            document.getElementById('collectedParts').innerHTML =
                '<span style="color: #8b93a3; font-size: 0.85rem;">Keine Bestellung vorhanden</span>';
            return;
        }

        const cart = JSON.parse(cartData);
        const products = await getProducts(`${backendUrl}/products`);

        allProducts = products;

        const collectedPartsElement = document.getElementById('collectedParts');
        collectedPartsElement.innerHTML = '';

        const listElement = document.createElement('ul');
        listElement.style.listStyle = 'none';
        listElement.style.padding = '0';
        listElement.style.margin = '0';

        cart.forEach(([productId, count]) => {
            const product = products.find(p => p.id === productId);

            if (product) {
                const listItem = document.createElement('li');
                listItem.style.marginBottom = '8px';
                listItem.style.padding = '8px 10px';
                listItem.style.background = 'rgba(255, 255, 255, 0.05)';
                listItem.style.borderRadius = '6px';
                listItem.style.fontSize = '0.85rem';
                listItem.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                listItem.style.transition = 'background 0.2s ease, border-color 0.2s ease';

                listItem.innerHTML = `
                    <strong style="color: #ffffff; display: block; margin-bottom: 4px;">${product.name}</strong>
                    <span style="color: #a4acbd; font-size: 0.8rem;">Anzahl: ${count} | Location: ${product.locationId}</span>
                `;

                listItem.addEventListener('mouseenter', () => {
                    listItem.style.background = 'rgba(59, 151, 151, 0.15)';
                    listItem.style.borderColor = 'rgba(59, 151, 151, 0.5)';

                    highlightedLocationId = product.locationId;
                    updateLocationsDrawing();
                });

                listItem.addEventListener('mouseleave', () => {
                    listItem.style.background = 'rgba(255, 255, 255, 0.05)';
                    listItem.style.borderColor = 'rgba(255, 255, 255, 0.08)';

                    highlightedLocationId = null;
                    updateLocationsDrawing();
                });

                listElement.appendChild(listItem);
            }
        });

        if (listElement.children.length === 0) {
            collectedPartsElement.innerHTML =
                '<span style="color: #8b93a3; font-size: 0.85rem;">Keine Teile bestellt</span>';
        } else {
            collectedPartsElement.appendChild(listElement);
        }

    } catch (err) {
        console.error('Error displaying ordered parts:', err);
        document.getElementById('collectedParts').innerHTML =
            '<span style="color: #ff6b6b; font-size: 0.85rem;">Fehler beim Laden</span>';
    }
}
