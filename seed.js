import 'dotenv/config';
import fs from 'fs';
import { AuthRefreshDiscardedError, createClient } from '@supabase/supabase-js';
import { sleep, gameCount } from './util.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const steamApiKey = process.env.STEAM_WEBAPI_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

let maxAppId = 0;

let rawGames = fs.readFileSync('steam_games_final.jsonl', 'utf-8'); // archivo _final para tener el último juego q se agregó (los coming_soon no se agregan aún, pero en un futuro cuando tengan release date sí se agregarán). desde aquí se sigue
let parsedGames = rawGames.split('\n').filter(line => line.trim() !== '').map(line => JSON.parse(line));
for (const game of parsedGames) {
	if (game.steam_appid > maxAppId) {
		maxAppId = game.steam_appid;
	}
}

let lastAppId = parsedGames[parsedGames.length - 1].steam_appid; // esta es la última appId que está en _final y por tanto el último juego q se ingresará a la bd
// maxAppId es la appId más alta que se ha encontrado en _final, y lastAppId es la última appId que se ingresó a _final. En teoría deberían ser iguales, pero por si acaso se hace esta distinción.


async function getSteamGames() {
	let haveMoreResults = true;
	let dataList = [];
	while (haveMoreResults) {
		try {    
			const response = await fetch(`https://api.steampowered.com/IStoreService/GetAppList/v1?key=${steamApiKey}&last_appid=${lastAppId}&if_modified_since=1735689600`);
			const data = await response.json();
			const games = data?.response?.apps || [];
			haveMoreResults = data?.response?.have_more_results || false;
			lastAppId = data?.response?.last_appid || 0;
			dataList.push(...games);
			await sleep(1000);
		} catch (error) {
			console.error(error);
			haveMoreResults = false;
		}
	}
	return dataList;
}

async function main() {
	// const games = await getSteamGames();
	// console.log(data);
	// fs.writeFileSync('steam_games_2025.json', JSON.stringify(games, null, 2));
	// console.log(lastAppId);
	// gameCount('steam_games.json');
	console.log(lastAppId);
	console.log(maxAppId);
}

main();