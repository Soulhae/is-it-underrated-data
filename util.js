import fs from 'fs';

const rawData = fs.readFileSync('steam_games.json');
const rawData2025 = fs.readFileSync('steam_games_2025.json');
const rawDataFiltered = fs.readFileSync('steam_games_2025_filtered.json');
const games = JSON.parse(rawData);
const games2025 = JSON.parse(rawData2025);
const gamesFiltered = JSON.parse(rawDataFiltered);

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const randomSleep = (min, max) => new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

export function gameCount(){
    console.log(`número de juegos: ${games.length}`);
    console.log(`número de juegos (ult act. desde 01/01/2025): ${games2025.length}`);
    console.log(`número de juegos (ult act. desde 01/01/2025) filtrados: ${gamesFiltered.length}`);
}