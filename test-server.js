const http = require('http');
const crypto = require('crypto');
const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      let rawProblem = '';
      req.on('data', (chunk) => {
        rawProblem += chunk;
      });

      req.on('end', () => {
        try {
          if (!rawProblem) return;
          const problem = JSON.parse(rawProblem);
          const batchId = crypto.randomUUID();
          console.log('Received problem:', problem.name);
        } catch (e) {
          console.error('Error parsing companion data', e);
        }
        res.writeHead(200);
        res.end();
      });
});
server.listen(27121, () => console.log('Listening on 27121'));
