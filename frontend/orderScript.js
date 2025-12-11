'use strict';

const backendUrl = "http://10.230.18.55:3000";
const getParts = async (url) => (await fetch(url)).json();

const container = document.getElementById('part-container');
let availableParts = [];

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

    const img = document.createElement('img');
    img.classList.add('part-card__image');
    img.src = part.imageUrl || 'img/place_holder.png';
    img.alt = part.name || 'Produktbild';

    const content = document.createElement('div');
    content.classList.add('part-card__content');

    const title = document.createElement('h3');
    title.classList.add('part-card__title');
    title.textContent = part.name;

    const location = document.createElement('p');
    location.classList.add('part-card__location');
    location.textContent = `Standort: ${part.locationName || part.locationId}`;

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
        // Animation starten
        button.classList.add('part-card__button--animating');

        // TODO: hier dein „in den Warenkorb“‑Handling

        // Klasse nach der Animation entfernen, damit sie erneut abläuft
        setTimeout(() => {
            button.classList.remove('part-card__button--animating');
        }, 500);
    });

    content.appendChild(title);
    content.appendChild(location);

    card.appendChild(img);
    card.appendChild(content);
    card.appendChild(button);

    return card;
}
