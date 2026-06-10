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
    await page.setViewport({ width: 1280, height: 1000 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for animations and dynamic data to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Capture screenshots in Dark Mode
    const sliderSec = await page.$('#sliderDescription');
    if (sliderSec) {
        await sliderSec.screenshot({
            path: path.resolve('C:\\Users\\hubsh\\.gemini\\antigravity\\brain\\69004dfd-096e-4eea-a7d7-9b330d4fea8e\\slider_desc_section_dark.png')
        });
        console.log('Saved dark mode sliderDescription screenshot.');
    }

    const aiSec = await page.$('#aiEfficiencySection');
    if (aiSec) {
        await aiSec.screenshot({
            path: path.resolve('C:\\Users\\hubsh\\.gemini\\antigravity\\brain\\69004dfd-096e-4eea-a7d7-9b330d4fea8e\\ai_efficiency_section_dark.png')
        });
        console.log('Saved dark mode aiEfficiencySection screenshot.');
    }

    // Toggle light-mode to capture light-mode layouts
    await page.evaluate(() => {
        document.body.classList.add('light-mode');
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (sliderSec) {
        await sliderSec.screenshot({
            path: path.resolve('C:\\Users\\hubsh\\.gemini\\antigravity\\brain\\69004dfd-096e-4eea-a7d7-9b330d4fea8e\\slider_desc_section_light.png')
        });
        console.log('Saved light mode sliderDescription screenshot.');
    }

    if (aiSec) {
        await aiSec.screenshot({
            path: path.resolve('C:\\Users\\hubsh\\.gemini\\antigravity\\brain\\69004dfd-096e-4eea-a7d7-9b330d4fea8e\\ai_efficiency_section_light.png')
        });
        console.log('Saved light mode aiEfficiencySection screenshot.');
    }

    await browser.close();
    server.close();
    console.log('Verification finished and server closed.');
}

main().catch(err => console.error(err));
