'use strict';

import express, { json, response } from 'express';
import cors from "cors";

const locations = [
    { id: 0, availableItems: 2, collectedItems: 0 },
    { id: 1, availableItems: 0, collectedItems: 0 },
    { id: 2, availableItems: 1, collectedItems: 0 },
    { id: 3, availableItems: 1, collectedItems: 0 },
    { id: 4, availableItems: 1, collectedItems: 0 }
];

const app = express();
const PORT = process.env.PORT || 3000;
let orders = [];

const products = [
    { id: 0, name: 'Oberkoerper', locationId: 0, amountAvailable: 1 },
    { id: 1, name: 'Kopf', locationId: 2, amountAvailable: 1 },
    { id: 2, name: 'Linker Arm', locationId: 3, amountAvailable: 1 },
    { id: 3, name: 'Rechter Arm', locationId: 4, amountAvailable: 1 }
];

app.use(cors({
    origin: '*',
}))

app.put('/locations/:id', json(), (req, res) => {
    const { id } = req.params;
    if (id != 0 && !id) {
        return res.status(400).json({ error: "no id specified" });
    }

    if (!req.body) {
        return res.status(400).json({ error: "empty body" });
    }

    const index = locations.findIndex(l => l.id === +id);

    if (index == 0 || index) {
        locations[index] = { id: +id, ...req.body };
        return res.json(locations[index]);
    }
    res.status(404).json({ error: `location with id ${id} not found!` })
});

app.get('/locations{/:id}', (req, res) => {
    const { id } = req.params;
    if (id) {
        return res.json(locations.find(l => l.id === +id));
    }
    return res.json(locations);
});

app.post('/orders', json(), (req, res) => {
    orders.push(req.body);

    reduceAvailableFieldInProducts();

    res.json(orders[orders.length - 1]);
});

function reduceAvailableFieldInProducts() {
    const latestOrder = orders[orders.length - 1];

    latestOrder.forEach(orderItem => {
        const product = products.find(p => p.id === orderItem.id);

        if (product) {
            if (product.amountAvailable > 0) {
                product.amountAvailable -= 1;
                //console.log(`✅ ${product.name}: ${product.amountAvailable + 1} → ${product.amountAvailable}`);
            } else {
                //console.error(`❌ ${product.name} nicht verfügbar!`);
            }
        }
    });
}



app.get('/orders', (req, res) => {
    if(orders.length == 0) {
        return res.status(404).json({error: "No orders found"});
    }
    const response = orders[orders.length - 1].reduce((acc, curr) => {
        console.log({ ...curr, locationId: products.find(p => p.id == curr.id).locationId })
        return acc.concat(JSON.stringify(
            { ...curr, locationId: products.find(p => p.id == curr.id).locationId }
        ) + ', ');
    }, '[').slice(0, -2).concat(']');
    console.log(response);
    res.json(JSON.parse(response));
});

app.get('/enabled', (req, res) => {
    if (orders.length > 0) {
        return res.json(true);
    }
    return res.json(false);
})

app.get('/products', (req, res) => {
    res.json(products);
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});