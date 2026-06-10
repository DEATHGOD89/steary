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
    console.log('Local server started on port 3000');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    console.log('Waiting for .trending-item-card to render...');
    try {
        await page.waitForSelector('.trending-item-card', { timeout: 15000 });
        console.log('Trending items rendered successfully!');
    } catch (e) {
        console.log('Timeout waiting for trending items to render.');
    }
    
    // Small extra delay to let animations stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));

    const measurements = await page.evaluate(() => {
        const panels = Array.from(document.querySelectorAll('.panel-section'));
        return panels.map(p => {
            const h2 = p.querySelector('h2');
            const title = h2 ? h2.textContent : 'Unknown';
            const rect = p.getBoundingClientRect();
            return {
                title,
                width: rect.width,
                height: rect.height,
                childCount: p.querySelectorAll('.trending-item-card, .best-tool-card, .project-item-card').length
            };
        });
    });

    console.log('--- DASHBOARD CARD MEASUREMENTS ---');
    measurements.forEach(m => {
        console.log(`Card: ${m.title} -> Width: ${m.width.toFixed(1)}px, Height: ${m.height.toFixed(1)}px (Children: ${m.childCount})`);
    });

    const grid = await page.$('.main-content-grid');
    if (grid) {
        const screenshotPath = 'C:\\Users\\hubsh\\.gemini\\antigravity\\brain\\69004dfd-096e-4eea-a7d7-9b330d4fea8e\\dashboard_grid_heights.png';
        await grid.screenshot({ path: screenshotPath });
        console.log(`Saved dashboard grid screenshot to ${screenshotPath}`);
    }

    await browser.close();
    server.close();
    console.log('Verification finished.');
}

main().catch(err => console.error(err));
