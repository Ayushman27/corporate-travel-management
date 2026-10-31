const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: './.env' });

async function testSerp() {
  try {
    const apiKey = process.env.SERP_API_KEY;
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_hotels',
        q: `hotels in Mumbai`,
        api_key: apiKey
      }
    });
    fs.writeFileSync('serp_test.json', JSON.stringify(response.data, null, 2));
    console.log("Saved to serp_test.json");
  } catch (error) {
    console.error(error.message);
  }
}
testSerp();
