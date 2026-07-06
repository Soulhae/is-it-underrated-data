import 'dotenv/config';
import fs from 'fs';
import { AuthRefreshDiscardedError, createClient } from '@supabase/supabase-js';
import { sleep } from './util.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const steamApiKey = process.env.STEAM_WEBAPI_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getSteamGames() {
	let lastAppId = 0;
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
	const games = await getSteamGames();
	// console.log(data);
	fs.writeFileSync('steam_games_2025.json', JSON.stringify(games, null, 2));
}

main();