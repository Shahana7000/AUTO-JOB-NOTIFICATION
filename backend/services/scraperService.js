const { chromium } = require('playwright-chromium');

/**
 * Discovery Logic using Google Dorking
 * This bypasses authwalls on LinkedIn/Indeed by scraping public indices from Google.
 */

async function searchGoogleForTalent(keywords, location, site, io, minExperience) {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        // Normalize keywords: "React, Python" -> ["React", "Python"]
        const skillList = keywords.split(',').map(s => s.trim()).filter(s => s);
        const skillQuery = skillList.map(s => `"${s}"`).join(' ');

        const platformName = site.split('.')[0].charAt(0).toUpperCase() + site.split('.')[0].slice(1);

        if (io) io.emit('log', { message: `[${platformName}] Scanning web index for '${skillList.join(', ')}' in ${location}...`, type: 'info' });

        // Search query: site:linkedin.com/in/ "React" "Python" "America" "3 years experience"
        let query = `site:${site} ${skillQuery} "${location}"`;
        if (minExperience && parseInt(minExperience) > 0) {
            query += ` "${minExperience} years experience"`;
        }

        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Check if Google showed "No results found for..."
        const noResults = await page.evaluate(() => {
            return document.body.innerText.includes('did not match any documents') ||
                document.body.innerText.includes('No results found for');
        });

        if (noResults) {
            await browser.close();
            return [];
        }

        const candidates = await page.evaluate((platform) => {
            const results = Array.from(document.querySelectorAll('div.g'));
            return results.map(res => {
                const titleEl = res.querySelector('h3');
                const linkEl = res.querySelector('a');
                const snippetEl = res.querySelector('.VwiC3b');

                if (!titleEl || !linkEl) return null;

                const namePart = titleEl.innerText.split('|')[0].split('-')[0].split(':').pop().trim();

                return {
                    name: namePart,
                    title: titleEl.innerText.trim(),
                    location: 'Found on ' + platform,
                    link: linkEl.getAttribute('href'),
                    platform: platform,
                    snippet: snippetEl ? snippetEl.innerText : 'Profile details in link...'
                };
            }).filter(c => c && c.link.includes(platform.toLowerCase()));
        }, platformName);

        await browser.close();
        return candidates;
    } catch (error) {
        console.error(`Discovery Error for ${site}:`, error);
        await browser.close();
        return [];
    }
}

async function searchGlobalCandidates(keywords, location, io, minExperience) {
    if (io) io.emit('log', { message: `🚀 Initializing Resilient Web Discovery...`, type: 'info' });

    // Sequential search to save memory on free hosting tiers
    const platforms = [
        { name: 'LinkedIn', site: 'linkedin.com/in/' },
        { name: 'Indeed', site: 'indeed.com/r/' },
        { name: 'Naukri', site: 'naukri.com/profile/' }
    ];

    let all = [];
    for (const p of platforms) {
        const results = await searchGoogleForTalent(keywords, location, p.site, io, minExperience);
        all = [...all, ...results];
        // Short pause between platform scans
        await new Promise(r => setTimeout(r, 2000));
    }

    // Fallback: If no results with strict skills, try a broader search without direct skill wrapping
    if (all.length === 0) {
        if (io) io.emit('log', { message: `🔍 Broadening search parameters...`, type: 'info' });
        const broadResults = await searchGoogleForTalent(keywords.replace(/,/g, ' '), location, 'linkedin.com/in/', io, minExperience);
        all = broadResults;
    }

    if (io) {
        if (all.length > 0) io.emit('log', { message: `✅ Discovery complete. Found ${all.length} total profiles.`, type: 'success' });
        else io.emit('log', { message: `⚠️ Zero public profiles found. Please reduce the number of required skills.`, type: 'warning' });
    }

    return all;
}

// Keep job search functions for job seekers
async function scrapeLinkedIn(keywords, location) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        const searchUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&f_TPR=r604800`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        const jobs = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.jobs-search__results-list li'));
            return cards.map(card => ({
                title: card.querySelector('.base-search-card__title')?.innerText.trim(),
                company: card.querySelector('.base-search-card__subtitle')?.innerText.trim(),
                location: card.querySelector('.job-search-card__location')?.innerText.trim(),
                link: card.querySelector('.base-card__full-link')?.getAttribute('href'),
                platform: 'LinkedIn'
            })).filter(j => j.title && j.link);
        });
        await browser.close();
        return jobs;
    } catch (e) { await browser.close(); return []; }
}

async function scrapeIndeed(keywords, location) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}&fromage=7`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        const jobs = await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.job_seen_beacon'));
            return cards.map(card => ({
                title: card.querySelector('h2.jobTitle span')?.innerText.trim(),
                company: card.querySelector('[data-testid="company-name"]')?.innerText.trim(),
                location: card.querySelector('[data-testid="text-location"]')?.innerText.trim(),
                link: 'https://www.indeed.com' + card.querySelector('h2.jobTitle a')?.getAttribute('href'),
                platform: 'Indeed'
            })).filter(j => j.title);
        });
        await browser.close();
        return jobs;
    } catch (e) { await browser.close(); return []; }
}

async function searchAllPlatforms(keywords, location) {
    const linkedin = await scrapeLinkedIn(keywords, location);
    await new Promise(r => setTimeout(r, 1000));
    const indeed = await scrapeIndeed(keywords, location);
    await new Promise(r => setTimeout(r, 1000));
    const naukri = await scrapeNaukri(keywords, location);

    return [...linkedin, ...indeed, ...naukri];
}

module.exports = { searchAllPlatforms, searchGlobalCandidates };
