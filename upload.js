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
const uniqueRecords = Array.from(new Map(dbRecords.map(item => [item.app_id, item])).values());

const batchSize = 5000;

async function uploadGames() {
    for (let i = 0; i < uniqueRecords.length; i += batchSize) {
        const batch = uniqueRecords.slice(i, i + batchSize);

        const { data, error } = await supabase.from('steam_game').upsert(batch).select();

        if (error) {
            console.error(`Database error upserting batch starting at index ${i}:`, error.message);
            return;
        }
        console.log(`Upserted batch starting at index ${i}:`, data.length, 'records');
    }
}

uploadGames();