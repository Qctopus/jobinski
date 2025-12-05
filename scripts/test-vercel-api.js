// Test Vercel API endpoint
async function testApi() {
  try {
    console.log('Testing https://talentanalytics.vercel.app/api/sync-status...');
    const response = await fetch('https://talentanalytics.vercel.app/api/sync-status');
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testApi();




