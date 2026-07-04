async function testGreenhouse(board) {
  try {
    const res = await fetch(`https://api.greenhouse.io/v1/boards/${board}/jobs`);
    const data = await res.json();
    console.log(`Greenhouse ${board}: ${data?.jobs?.length || 0} jobs`);
  } catch(e) {
    console.error(`Greenhouse ${board} error`);
  }
}

async function testLever(board) {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${board}?mode=json`);
    const data = await res.json();
    console.log(`Lever ${board}: ${data?.length || 0} jobs`);
  } catch (e) {
    console.error(`Lever ${board} error`);
  }
}

async function run() {
  await testGreenhouse('stripe');
  await testGreenhouse('discord');
  await testGreenhouse('figma');
  await testGreenhouse('twitch');

  await testLever('netflix');
  await testLever('atlassian');
  await testLever('lever');
}

run();
