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
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait longer to ensure everything is resolved
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const trendingHtml = await page.evaluate(() => {
        const el = document.getElementById('trendingList');
        return el ? el.innerHTML : 'No element found';
    });

    console.log('--- TRENDING LIST INNER HTML ---');
    console.log(trendingHtml.trim());

    await browser.close();
    server.close();
}

main().catch(err => console.error(err));
