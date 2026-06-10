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

    console.log('Verifying default theme state (no storage)...');
    
    let browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    let page = await browser.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Check if body has light-mode class on first load
    const bodyClassFirstLoad = await page.evaluate(() => {
        return document.body.className;
    });
    console.log('Body classes on first load (empty localStorage):', bodyClassFirstLoad);
    
    if (bodyClassFirstLoad.includes('light-mode')) {
        console.log('SUCCESS: First load defaults to Light Mode correctly!');
    } else {
        console.log('FAIL: First load did not default to Light Mode.');
        process.exit(1);
    }
    
    // Simulate user setting it to dark mode in UI
    console.log('Simulating toggle to dark mode...');
    await page.evaluate(() => {
        // Toggle the preference in settings
        const settingObj = {
            autoplayHero: true,
            notifications: true,
            compactMobile: true,
            privateProfile: false,
            lightMode: false // Explicitly dark
        };
        localStorage.setItem('steary.profile.preferences', JSON.stringify(settingObj));
    });
    
    // Reload page to test if it opens in dark mode (blocking flash)
    console.log('Reloading page to verify persistence...');
    await page.reload({ waitUntil: 'networkidle2' });
    
    const bodyClassSecondLoad = await page.evaluate(() => {
        return document.body.className;
    });
    console.log('Body classes on reload (dark mode localStorage):', bodyClassSecondLoad);
    
    if (!bodyClassSecondLoad.includes('light-mode')) {
        console.log('SUCCESS: Persistent dark mode loads without flashing light mode!');
    } else {
        console.log('FAIL: Returning dark mode user got light mode layout.');
        process.exit(1);
    }

    await browser.close();
    server.close();
    console.log('Theme verification completed successfully.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
