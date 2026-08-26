import https from 'https';

https.get('https://codeforces.com/profile/tourist', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const fills = new Set();
        const regex = /<rect[^>]*fill="([^"]+)"/ig;
        let match;
        while ((match = regex.exec(data)) !== null) {
            fills.add(match[1]);
        }
        console.log("Fills found:", Array.from(fills));
    });
});
