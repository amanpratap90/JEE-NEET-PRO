const http = require('http');

const url = 'http://localhost:5000/api/v1/resources/chapters?exam=jee-mains&subject=physics';

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Body:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
