'use strict';

const parts = [1, 2, 3, 4, 5];
let selectedParts = [];

document.querySelectorAll(".part-card").forEach(card => {
    card.addEventListener("click", () => {
        card.classList.toggle("selected");
        let selectedId = card.id.split('_')[2];
        console.log(`selected Index: ${selectedId}`);
    });
});