const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const http = require('http');

async function main() {
    const app = express();
    const port = 3000;
    app.use(express.static(path.resolve(__dirname, '..')));
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(port, resolve));

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait a brief moment for page load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get text at time 1
    const text1 = await page.evaluate(() => {
        const el = document.querySelector('#aiEfficiencySection .mock-terminal code');
        return el ? el.innerText : null;
    });
    console.log('Text state 1:', JSON.stringify(text1));

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get text at time 2
    const text2 = await page.evaluate(() => {
        const el = document.querySelector('#aiEfficiencySection .mock-terminal code');
        return el ? el.innerText : null;
    });
    console.log('Text state 2:', JSON.stringify(text2));

    await browser.close();
    server.close();

    if (!text1 || !text2) {
        console.error('FAIL: Terminal code element not found!');
        process.exit(1);
    }

    if (text1 === text2) {
        console.error('FAIL: Text content did not change. Typing loop inactive!');
        process.exit(1);
    }

    console.log('SUCCESS: Text content changed! Live typing loop is active.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
