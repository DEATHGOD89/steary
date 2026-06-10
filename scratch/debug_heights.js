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
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for Supabase/LocalStorage loads
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const info = await page.evaluate(() => {
        const panel = document.getElementById('heroPanel');
        const container = document.querySelector('.hero-carousel-container');
        const slide = document.querySelector('.hero-slide.active');
        
        const getDetails = (el, name) => {
            if (!el) return { name, error: 'Not found' };
            const r = el.getBoundingClientRect();
            const computed = window.getComputedStyle(el);
            return {
                name,
                html: el.outerHTML.substring(0, 150),
                rect: { x: r.x, y: r.y, w: r.width, h: r.height },
                display: computed.display,
                position: computed.position,
                height: computed.height,
                minHeight: computed.minHeight,
                maxHeight: computed.maxHeight,
                flex: computed.flex,
                overflow: computed.overflow
            };
        };
        
        return {
            panel: getDetails(panel, 'heroPanel'),
            container: getDetails(container, 'container'),
            slide: getDetails(slide, 'slide')
        };
    });
    
    console.log('HEIGHT DETAILS:', JSON.stringify(info, null, 2));
    
    await browser.close();
    server.close();
}

main().catch(err => console.error(err));
