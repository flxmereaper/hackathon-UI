'use strict';

import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const backendUrl = "http://192.168.4.4:3000"; // http://localhost:3000 http://10.230.18.55:3000 http://192.168.4.2:3000
const getParts = async (url) => (await fetch(url)).json();

const container = document.getElementById('part-container');
const cartButton = document.getElementById('btnShoppingCart');
const cartCount = document.getElementById('cartCount');
const cartButtonText = document.querySelector('.cart-button-text');

let orderHasToBeComplete = true; // true = alle 4 Teile nötig, false = beliebig

let availableParts = [];
const shoppingCart = new Map();

window.addEventListener('load', () => {
    init();
});

async function init() {
    try {
        availableParts = await getAvailablePartsFromBackend();
        populateAvailableProductsCards(availableParts);
        updateCartCount();
    } catch (err) {
        console.error("Error loading parts:", err);
    }
}

async function getAvailablePartsFromBackend() {
    return getParts(`${backendUrl}/products`);
}

function populateAvailableProductsCards(parts) {
    parts.forEach(part => {
        const card = createPartCard(part);
        container.appendChild(card);
    });
}

function createPartCard(part) {
    const card = document.createElement('article');
    card.classList.add('part-card');

    const viewerContainer = document.createElement('div');
    viewerContainer.classList.add('part-card__viewer');

    const canvas = document.createElement('canvas');
    viewerContainer.appendChild(canvas);

    const content = document.createElement('div');
    content.classList.add('part-card__content');

    const title = document.createElement('h3');
    title.classList.add('part-card__title');
    title.textContent = part.name;

    const location = document.createElement('p');
    location.classList.add('part-card__location');
    location.textContent = `Standort: ${part.locationName || part.locationId}`;

    const amountAvailable = document.createElement('p');
    amountAvailable.classList.add('part-card__location');
    amountAvailable.textContent = `Verfügbare Teile: ${part.amountAvailable}`;

    const button = document.createElement('button');
    button.classList.add('part-card__button');
    button.type = 'button';

    const icon = document.createElement('img');
    icon.classList.add('part-card__button-icon');
    icon.src = '/frontend/img/shopping-cart.png';
    icon.alt = 'Zum Warenkorb';

    const text = document.createElement('span');
    text.classList.add('part-card__button-text');
    text.textContent = 'In den Einkaufswagen';

    button.appendChild(icon);
    button.appendChild(text);

    if (part.amountAvailable <= 0) {
        disableCartButton(button);
    } else {
        button.addEventListener('click', () => {
            addProductToShoppingCart(part, button);

            button.classList.add('part-card__button--animating');
            setTimeout(() => {
                button.classList.remove('part-card__button--animating');
            }, 600);
        });
    }

    content.appendChild(title);
    content.appendChild(location);
    content.appendChild(amountAvailable);

    card.appendChild(viewerContainer);
    card.appendChild(content);
    card.appendChild(button);

    const modelPath = part.modelPath || `models/${part.name.toLowerCase()}.stl`;

    initViewer(canvas, modelPath);

    return card;
}

function initViewer(canvas, stlPath) {
    let width = canvas.parentElement.offsetWidth;
    const height = 220;

    if (!width || width === 0) {
        width = 380;
    }

    canvas.width = width;
    canvas.height = height;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    const light = new THREE.DirectionalLight(0xffffff, 5);
    light.position.set(0, 0, 100);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 4;
    controls.enableZoom = true;

    const initialTarget = controls.target.clone();
    const initialPos = camera.position.clone();

    canvas.addEventListener('mouseenter', () => {
        controls.autoRotate = false;

        controls.target.copy(initialTarget);
        camera.position.copy(initialPos);
        camera.lookAt(controls.target);
        controls.update();
    });

    canvas.addEventListener('mouseleave', () => {
        controls.autoRotate = true;
    });

    const loader = new STLLoader();
    loader.load(
        stlPath,
        (geometry) => {
            geometry.computeBoundingBox();

            const bbox = geometry.boundingBox;
            const center = bbox.getCenter(new THREE.Vector3());
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            const material = new THREE.MeshStandardMaterial({
                color: 0xa10828,
                metalness: 0.4,
                roughness: 0.6,
                side: THREE.FrontSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.sub(center);
            mesh.frustumCulled = false;
            scene.add(mesh);

            const fov = camera.fov * (Math.PI / 180);
            const distance = (maxDim / 2) / Math.tan(fov / 2);
            const offset = 1.2;
            const finalDistance = distance * offset;

            camera.position.set(0, 0, finalDistance);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();

            initialTarget.copy(controls.target);
            initialPos.copy(camera.position);

            console.log('🎯 maxDim:', maxDim, 'distance:', distance);
        }
    );

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

function addProductToShoppingCart(product, button) {
    const currentCount = shoppingCart.get(product.id) || 0;

    if (currentCount >= product.amountAvailable) {
        disableCartButton(button);
        return;
    }

    const newCount = currentCount + 1;
    shoppingCart.set(product.id, newCount);

    console.log('Shopping cart:', Array.from(shoppingCart.entries()));

    updateCartCount();
    animateCartButton();
    checkIfAllProductsAdded();

    if (newCount >= product.amountAvailable) {
        disableCartButton(button);
    }
}

function updateCartCount() {
    let totalCount = 0;
    shoppingCart.forEach(count => {
        totalCount += count;
    });

    cartCount.textContent = totalCount;

    if (totalCount > 0) {
        cartCount.classList.add('visible');
    } else {
        cartCount.classList.remove('visible');
    }
}

function animateCartButton() {
    cartButton.classList.add('pulse');
    setTimeout(() => {
        cartButton.classList.remove('pulse');
    }, 500);
}

function checkIfAllProductsAdded() {
    const uniqueProductCount = shoppingCart.size;

    if (uniqueProductCount === 4) {
        showReadyToOrderMessage();
    }
}

function showReadyToOrderMessage() {
    const originalText = cartButtonText.textContent;

    cartButtonText.textContent = 'Fertig zum Bestellen';
    cartButton.classList.add('show-text');

    setTimeout(() => {
        cartButtonText.textContent = originalText;
        cartButton.classList.remove('show-text');
    }, 2000);
}

function disableCartButton(button) {
    button.classList.add('part-card__button--disabled');
    button.disabled = true;
    const textSpan = button.querySelector('.part-card__button-text');
    if (textSpan) {
        textSpan.textContent = 'Nicht mehr verfügbar';
    }
    const icon = button.querySelector('.part-card__button-icon');
    if (icon) {
        icon.style.opacity = '0';
    }
}

cartButton.addEventListener('click', async () => {
    if (shoppingCart.size === 0) {
        alert('Warenkorb ist leer!');
        return;
    }

    // Validierung: Sind alle 4 Teile im Warenkorb?
    if (orderHasToBeComplete && shoppingCart.size < 4) {
        alert('Bitte füge alle 4 Teile zum Warenkorb hinzu, um die Bestellung abzuschließen.');
        return;
    }

    const orderArray = [];
    shoppingCart.forEach((count, productId) => {
        for (let i = 0; i < count; i++) {
            orderArray.push({ id: productId, purchased: "false" });
        }
    });

    try {
        const response = await fetch(`${backendUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderArray)
        });

        if (!response.ok) {
            throw new Error('Fehler beim Absenden der Bestellung');
        }

        const result = await response.json();

        const cartData = Array.from(shoppingCart.entries());
        sessionStorage.setItem('shoppingCart', JSON.stringify(cartData));

        window.location.href = 'overview.html';

    } catch (err) {
        console.error('❌ Error submitting order:', err);
        alert('Fehler beim Absenden der Bestellung. Bitte versuche es erneut.');
    }
});
