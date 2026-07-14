import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { sleep, randomSleep } from './util.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const steamApiKey = process.env.STEAM_WEBAPI_KEY;

async function getMetrics(appId) {  
    try{
        const reviewsResponse = await fetch(`https://store.steampowered.com/appreviews/${appId}?json=1&num_per_page=1&purchase_type=all&language=all`)
        const currentPlayersResponse = await fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?key=${steamApiKey}&appid=${appId}`);
        const reviewsContentType = reviewsResponse.headers.get('content-type');
        const currentPlayersContentType = currentPlayersResponse.headers.get('content-type');

        if(reviewsResponse.status === 429 || currentPlayersResponse.status === 429){
            console.error(`Too many requests at App ID: ${appId}. Sleeping for 5 minutes.`);
            await sleep(300000);
            return null;
        }

        if(!reviewsContentType || !reviewsContentType.includes('application/json') || !currentPlayersContentType || !currentPlayersContentType.includes('application/json')) {
            console.error(`Expected JSON response for App ID: ${appId}, but got content types: ${reviewsContentType}, ${currentPlayersContentType}`);
            console.error(`Reviews Response Status: ${reviewsResponse.status}, Current Players Response Status: ${currentPlayersResponse.status}`);
            return null;
        }

        const metrics = await reviewsResponse.json().catch(() => null);
        const players = await currentPlayersResponse.json().catch(() => null);
        if(!metrics || metrics.success !== 1 || !players || players.response?.result !== 1){
            console.error(`Some data (metrics or players) is missing for App ID: ${appId} , replacing missing metrics with 0s`);
            const emptyMetrics = {
                total_reviews: metrics?.query_summary?.total_reviews || 0,
                positive_reviews: metrics?.query_summary?.total_positive || 0,
                current_players: players?.response?.player_count || 0
            };
            return emptyMetrics;
        }

        console.log(`Fetched metrics for App ID: ${appId} - Total Reviews: ${metrics.query_summary.total_reviews}, Positive Reviews: ${metrics.query_summary.total_positive}`);
        console.log(`Fetched current players for App ID: ${appId} - Current Players: ${players.response.player_count}`);
        return {
            total_reviews: metrics.query_summary.total_reviews,
            positive_reviews: metrics.query_summary.total_positive,
            current_players: players.response.player_count
        };

    }catch (error) {
        console.error(`Error fetching metrics for App ID: ${appId}`, error);
        return null;
    }
}

async function main() {
    const today = new Date().toISOString().split('T')[0];
    // console.log(today);
    // let test = 0;

    while (true) {
        const { data: games, error } = await supabase
            .from('steam_game')
            .select('app_id, name, release_date')
            .lte('release_date', today)
            .is('metrics_updated_at',null)
            .limit(100);

        if (error) {
            console.error('Error fetching games:', error);
            break;
        }

        if (games.length === 0) {
            console.log('No more games to update. Exiting.');
            break;
        }

        for (const game of games) {
            try{
                // console.log(`${game.name} (App ID: ${game.app_id}) - Release Date: ${game.release_date}`);
                // console.log(`${game.release_date} <= ${today} ?: ${game.release_date <= today}`);
                const gameMetrics = await getMetrics(game.app_id);
                if (gameMetrics) {
                    const { error: updateError } = await supabase
                        .from('steam_game')
                        .update({
                            total_reviews: gameMetrics.total_reviews,
                            positive_reviews: gameMetrics.positive_reviews,
                            current_players: gameMetrics.current_players,
                            metrics_updated_at: new Date().toISOString()
                        })
                        .eq('app_id', game.app_id);

                    if (updateError) {
                        console.error(`Error updating metrics for ${game.name} (App ID: ${game.app_id}):`, updateError);
                    }
                }
                await randomSleep(1750, 2500);
            } catch (error) {
                console.error(`Error fetching metrics for ${game.name} (App ID: ${game.app_id}):`, error);
            }
        }
        // test++;
    }
}

main();