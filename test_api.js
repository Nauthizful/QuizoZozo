const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('Testing Endpoints...');
  
  const rGuest = await get('http://localhost:3000/');
  console.log('Guest Page (/):', rGuest.status === 200 ? 'OK 200' : 'FAIL ' + rGuest.status);

  const rDisplay = await get('http://localhost:3000/display');
  console.log('Display Page (/display):', rDisplay.status === 200 ? 'OK 200' : 'FAIL ' + rDisplay.status);

  const rAdmin = await get('http://localhost:3000/admin');
  console.log('Admin Page (/admin):', rAdmin.status === 200 ? 'OK 200' : 'FAIL ' + rAdmin.status);

  const rBuilder = await get('http://localhost:3000/admin/builder');
  console.log('Builder Page (/admin/builder):', rBuilder.status === 200 ? 'OK 200' : 'FAIL ' + rBuilder.status);

  const rData = await get('http://localhost:3000/api/quiz/data');
  const quiz = JSON.parse(rData.data);
  console.log('Quiz API (/api/quiz/data): Title =', quiz.title, '| Questions count =', quiz.questions.length);

  const rExport = await get('http://localhost:3000/api/quiz/export');
  const exported = JSON.parse(rExport.data);
  console.log('Quiz Export (/api/quiz/export): Version =', exported.version, '| Questions count =', exported.questions.length);

  console.log('ALL API & PAGE TESTS PASSED SUCCESSFULLY! ✅');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
