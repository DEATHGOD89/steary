const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '..')));

const server = app.listen(port, async () => {
    console.log(`Server listening on port ${port}`);

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        page.on('response', response => {
            if (response.status() === 404) {
                console.log('404 Not Found:', response.url());
            }
        });
        
        await page.goto(`http://localhost:${port}/admin.html`);
        
        await page.waitForSelector('#adminId');
        await page.type('#adminId', 'bhupendersingh123456789011@gmail.com');
        await page.type('#adminPass', 'zxabbhu#@$123890ASDnm$#@');
        
        console.log('Credentials typed, clicking login...');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('Navigation timeout:', e.message)),
            page.click('button[type="submit"]')
        ]);

        console.log('Current URL:', page.url());
        
        const loginError = await page.$('#loginError:not(.hidden)');
        if (loginError) {
            const errorText = await page.evaluate(el => el.textContent, loginError);
            console.log('Login Error Text:', errorText);
        } else {
            console.log('No visible login error found.');
        }

        await browser.close();
    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        server.close();
        process.exit(0);
    }
});