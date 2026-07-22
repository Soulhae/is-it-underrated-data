import fs from 'fs';
import { sleep, randomSleep } from './util.js';

// const testAppIds = [2429640, 1026680, 2986450, 1903340, 774361, 439660];

async function getSteamGamesDetails(appIds){
    let dataList = [];
    let contador = 0;
    const destFile = 'steam_games_final.jsonl';
    const stateFile = 'steam_games_state.json';

    if(fs.existsSync(stateFile)){
        const stateData = fs.readFileSync(stateFile);
        const state = JSON.parse(stateData);
        const lastAppId = state.lastAppId;
        const lastIndex = appIds.indexOf(lastAppId);

        if(lastIndex !== -1 && lastIndex < appIds.length - 1){
            appIds = appIds.slice(lastIndex + 1);
        }
    }

    for (let i=0; i<appIds.length; i++) {
        const appId = appIds[i];
        let parsedYear = 0;
        // console.log(`processing appId: ${appId} and index ${appIds.indexOf(appId)}`);
        try {
            const response = await fetch(`https://store.steampowered.com/api/appdetails?filters=basic,release_date&appids=${appId}`); // esta api no está documentada oficialmente, troste
            const contentType = response.headers.get('content-type');
            // console.log(response.status, `processing appId: ${appId} and index ${appIds.indexOf(appId)}`);

            if(response.status === 429){
                console.error(`too many requests, sleep de 5 min`); // rate limit según la comunidad (200 req / 5 min), no hay documentación oficial
                await sleep(300000);
                i--;
                continue;
            }

            if(!contentType || !contentType.includes('application/json')) {
                console.error(`Expected JSON response for appId ${appId} and index ${appIds.indexOf(appId)}, but got content type: ${contentType}`);
                await randomSleep(1750, 2500);
                continue;
            }

            const data = await response.json();
            if(!data || !data[appId] || !data[appId].success){
                // console.log('no hay data para este appId o success es false, saltando...');
                continue;
            }
            // console.log(data);

            if(data[appId].data?.release_date?.coming_soon === true || !data[appId].data?.release_date?.date){
                // console.log(`appId ${appId} is coming soon or has no release date, skipping...`);
                await randomSleep(1750, 2500);
                continue;
            }

            const dateText = data[appId].data?.release_date?.date;
            const date = new Date(dateText);

            if(!isNaN(date.getTime())){
                parsedYear = date.getFullYear();
            }else{
                parsedYear = dateText.match(/\d{4}/);
                if(parsedYear){
                    parsedYear = parseInt(parsedYear[0]);
                }else{
                    parsedYear = 0;
                }
            }

            if(data[appId].success && data[appId].data.type === 'game' && parsedYear >= 2025){
                dataList.push(data[appId].data);
            }
            
            contador++;
            if (contador % 100 === 0) {
                if(dataList.length > 0){
                    const jsonlData = dataList.map(item => JSON.stringify(item)).join('\n') + '\n';
                    fs.appendFileSync(destFile, jsonlData);
                    dataList = [];
                }
                const state = { lastAppId: appId };
                fs.writeFileSync(stateFile, JSON.stringify(state));
                console.log(`last processed appId: ${appId}`);
            }

            await randomSleep(1750, 2500);
        } catch (error) {
            console.error(error);
        }
    }

    if(dataList.length > 0){
        const jsonlData = dataList.map(item => JSON.stringify(item)).join('\n') + '\n';
        fs.appendFileSync(destFile, jsonlData);
        dataList = [];
    }
}

async function main() {
    const newerGames = fs.readFileSync('steam_games_2025.json');
    const newerGamesParse = JSON.parse(newerGames);

    const forbiddenWords = ['dlc', 'sdk', 'soundtrack', 'demo', 'playtest', 'beta', 'dedicated server', 'ost'];
    const forbiddenRegex = new RegExp(`\\b(${forbiddenWords.join('|')})\\b`, 'i');
    const filteredGames = newerGamesParse.filter(game => {
        return !forbiddenRegex.test(game.name);
    });

    fs.writeFileSync('steam_games_2025_filtered.json', JSON.stringify(filteredGames, null, 2));

    await getSteamGamesDetails(filteredGames.map(game => game.appid));
    // fs.writeFileSync('steam_games_details.json', JSON.stringify(gameDetails, null, 2));

    // const rawData = fs.readFileSync('steam_games_details.json');
    // const gameDetailsParse = JSON.parse(rawData);
    // for (const game in gameDetailsParse) {
    //     console.log(gameDetailsParse[game].steam_appid);
    //     console.log(gameDetailsParse[game].name);
    //     console.log(gameDetailsParse[game].release_date.date);
    //     console.log(gameDetailsParse[game].type);
    // }
}

main();