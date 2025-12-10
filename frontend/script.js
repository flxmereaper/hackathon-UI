'use strict';

const backendUrl = "http://http://10.230.18.22:3000";

const getStatus = async (backendUrl) => ((await fetch(`${backendUrl}/status`)).json());
const getCollectedParts = async (backendUrl) => ((await fetch(`${backendUrl}/parts`)).json());

let currentStatus = [];
let collectedParts = [];
