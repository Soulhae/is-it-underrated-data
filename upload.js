import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const steamGames = fs.readFileSync('steam_games_final.jsonl', 'utf-8').split('\n').filter(line => line.trim() !== '').map(line => JSON.parse(line));
const dbRecords = steamGames.map(game => ({
    app_id: game.steam_appid,
    name: game.name,
    short_description: game.short_description,
    header_image: game.header_image,
    release_date: game.release_date.date
}));

const batchSize = 1000;

async function uploadGames() {
    for (let i = 0; i < dbRecords.length; i += batchSize) {
        const batch = dbRecords.slice(i, i + batchSize);
        const { data, error } = await supabase.from('steam_game').upsert(batch).select();
        if (error) {
            console.error(`Database error upserting batch starting at index ${i}:`, error.message);
            return;
        }
        console.log(`Upserted batch starting at index ${i}:`, data.length, 'records');
    }
}

// async function uploadGames() {
//     for (const game of steamGames) {
//         const { data, error } = await supabase.from('steam_game').upsert({ app_id: game.steam_appid, name: game.name, short_description: game.short_description, header_image: game.header_image, release_date: game.release_date.date }).select();
//         if (error) {
//             console.error(`Database error upserting game: ${game.name}`, error.message);
//             return;
//         }
//         console.log('Upserted game:', data);
//     }
// }

uploadGames();