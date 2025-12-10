'use strict';

import express, {json} from 'express';

const stationDict = { 0: {availableItems: 2, collectedItems: 1},
                    1: {availableItems: 2, collectedItems: 2},
                    2: {availableItems: 1, collectedItems: 1},
                    3: {availableItems: 1, collectedItems: 0},
                    4: {availableItems: 2, collectedItems: 0}}
const app = express();
const PORT = process.env.PORT || 3000;

app.put('/locations/:id', json(), (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({error: "no id specified"});
    }

    if (!(id in stationDict)) {
        return res.status(404).json({error: "location not found!"});
    }

    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({error: "empty body"});
    }

    stationDict[id] = {id: id, ...req.body};
    return res.json(stationDict[id]);
});


app.get('/locations{/:id}', (req, res) => {
    const { id } = req.params;
    if (id) {
        return res.json(stationDict[id]);
    }
    return res.json(stationDict);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});