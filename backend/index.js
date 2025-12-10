'use strict';

import express, {json} from 'express';
import cors from "cors"

const locations = [ {id: 0, availableItems: 3, collectedItems: 1},
                    {id: 1, availableItems: 2, collectedItems: 2},
                    {id: 2, availableItems: 1, collectedItems: 1},
                    {id: 3, availableItems: 1, collectedItems: 0},
                    {id: 4, availableItems: 2, collectedItems: 0} ]
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
}))

app.put('/locations/:id', json(), (req, res) => {
    const { id } = req.params;
    if (id != 0 && !id) {
        return res.status(400).json({error: "no id specified"});
    }

    if (!req.body) {
        return res.status(400).json({error: "empty body"});
    }

    const index = locations.findIndex(l => l.id === +id);

    if(index == 0 || index) {
        locations[index] = {id: id, ...req.body};
        return res.json(locations[index]);
    }
    res.status(404).json({error: `location with id ${id} not found!`})
});


app.get('/locations{/:id}', (req, res) => {
    const { id } = req.params;
    if (id) {
        return res.json(locations.find(l => l.id === +id));
    }
    return res.json(locations);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});