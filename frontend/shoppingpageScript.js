'use strict';

import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const backendUrl = "http://localhost:3000";
const getParts = async (url) => (await fetch(url)).json();

const container = document.getElementById('part-container');
let availableParts = [];
const shoppingCart = new Map();



window.addEventListener('load', () => {
    init();
});

async function init() {
    try {
        availableParts = await getAvailablePartsFromBackend();
        populateAvailableProductsCards(availableParts);
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

    // 3D-Viewer Container
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

    button.addEventListener('click', () => {

        addProductToShoppingCart(part, button); // hier check ob das product noch einmal in den cart geadded werden kann, check mit amountAvailable!

        button.classList.add('part-card__button--animating');
        setTimeout(() => {
            button.classList.remove('part-card__button--animating');
        }, 600);
    });

    content.appendChild(title);
    content.appendChild(location);
    content.appendChild(amountAvailable);

    card.appendChild(viewerContainer);
    card.appendChild(content);
    card.appendChild(button);

    const modelPath = part.modelPath || `models/${part.name.toLowerCase()}.stl`;
    //const modelPath = "models/3D_model_of_a_Cube.stl";

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
    controls.autoRotate = true;      // Standard: langsam drehen
    controls.autoRotateSpeed = 4;
    controls.enableZoom = true;

    const initialTarget = controls.target.clone();
    const initialPos = camera.position.clone();

    let isHovered = false;

    canvas.addEventListener('mouseenter', () => {
        isHovered = true;
        controls.autoRotate = false;

        controls.target.copy(initialTarget);
        camera.position.copy(initialPos);
        camera.lookAt(controls.target);
        controls.update();
    });

    canvas.addEventListener('mouseleave', () => {
        isHovered = false;
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
        // schon ausgeschöpft → Button sperren, nichts hinzufügen
        disableCartButton(button);
        return;
    }

    const newCount = currentCount + 1;
    shoppingCart.set(product.id, newCount);
    console.log('PRODUCTS in the cart:', Array.from(shoppingCart.entries()));

    if (newCount >= product.amountAvailable) {
        disableCartButton(button);
    }
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
