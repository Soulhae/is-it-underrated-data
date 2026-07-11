import fs from 'fs';

let gameList = null;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const randomSleep = (min, max) => new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

export function gameCount(fileName){
    // console.log(fileName);
    if(fileName.includes('.jsonl')){
        gameList = fs.readFileSync(fileName, 'utf-8').split('\n').filter(line => line.trim() !== '').map(line => JSON.parse(line));
    }else{
        gameList = JSON.parse(fs.readFileSync(fileName, 'utf-8'));
    }
    console.log(`número de juegos de ${fileName}: ${gameList.length}`);
}