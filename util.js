import fs from 'fs';

const rawData = fs.readFileSync('steam_games.json');
const rawData2025 = fs.readFileSync('steam_games_2025.json');
const games = JSON.parse(rawData);
const games2025 = JSON.parse(rawData2025);

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function gameCount(){
    console.log(`número de juegos: ${games.length}`);
    console.log(`número de juegos (ult act. desde 01/01/2025): ${games2025.length}`);
}