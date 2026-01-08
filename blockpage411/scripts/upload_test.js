const fs = require('fs');
const http = require('http');
const path = require('path');

const filePath = path.join(__dirname, '..', 'tmp', 'test-avatar.png');
const stat = fs.statSync(filePath);
const fileData = fs.readFileSync(filePath);

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const payloadParts = [];
payloadParts.push(Buffer.from(`--${boundary}\r\n`));
payloadParts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="test-avatar.png"\r\n`));
payloadParts.push(Buffer.from(`Content-Type: image/png\r\n\r\n`));
payloadParts.push(fileData);
payloadParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

const payload = Buffer.concat(payloadParts);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/avatar/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': payload.length,
  },
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers));
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('BODY:', body);
    process.exit(0);
  });
  
});

req.on('error', (e) => {
  console.error('problem with request:', e.message);
  process.exit(1);
});

req.write(payload);
req.end();
