import fetch from 'node-fetch';

async function testGreenhouse(board: string) {
  try {
    const res = await fetch(`https://api.greenhouse.io/v1/boards/${board}/jobs`);
    const data: any = await res.json();
    console.log(`Greenhouse ${board}: ${data?.jobs?.length || 0} jobs`);
  } catch(e) {
    console.error(`Greenhouse ${board} error`);
  }
}

async function testLever(board: string) {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${board}?mode=json`);
    const data: any = await res.json();
    console.log(`Lever ${board}: ${data?.length || 0} jobs`);
  } catch (e) {
    console.error(`Lever ${board} error`);
  }
}

testGreenhouse('stripe');
testGreenhouse('discord');
testGreenhouse('figma');
testGreenhouse('twitch');

testLever('netflix');
testLever('atlassian');
testLever('lever');
