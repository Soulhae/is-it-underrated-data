import fs from 'fs';
import { sleep } from './util.js';

const testAppIds = [2429640, 1026680, 2986450, 1903340, 774361, 439660];

async function getSteamGamesDetails(){
    let dataList = [];
    for (const appId of testAppIds) {
        try {
            const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
            const data = await response.json();
            // console.log(data);
            // if(data[appId].success && data[appId].data.type === 'game' && data[appId].data.release_date.coming_soon === false && data[appId].data?.release_date?.date > 2025){ {
            // }    hay q pasar a unix timestamp la fecha de release date para poder comparar con 2025 (1735689600)
            if(data[appId].success){
                dataList.push(data[appId].data);
            }
            await sleep(1000);
        } catch (error) {
            console.error(error);
        }
    }
    return dataList;
}

async function main() {
    // acá hay q limpiar los juegos q tengan por ej dedicated server, dlc, ost, soundtrack, y esas cosillas por el estilo chaval.

    const gameDetails = await getSteamGamesDetails();
    fs.writeFileSync('steam_games_details.json', JSON.stringify(gameDetails, null, 2));
    const rawData = fs.readFileSync('steam_games_details.json');
    const gameDetailsParse = JSON.parse(rawData);
    for (const game in gameDetailsParse) {
        console.log(gameDetailsParse[game].name);
        console.log(gameDetailsParse[game].release_date.date);
        console.log(gameDetailsParse[game].type);
    }
}

main();