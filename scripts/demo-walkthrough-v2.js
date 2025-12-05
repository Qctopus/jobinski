/**
 * UN Jobs Dashboard Demo Walkthrough - V2
 * 
 * This version can ATTACH to an existing Chrome browser!
 * 
 * USAGE (Two Options):
 * 
 * OPTION 1 - Attach to existing browser (RECOMMENDED for demo):
 *   1. Close all Chrome windows
 *   2. Start Chrome with debugging:
 *      Windows: "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
 *      Mac: /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
 *   3. Manually navigate to http://localhost:3000 in that Chrome
 *   4. Resize/position the window how you want for recording
 *   5. Run: node scripts/demo-walkthrough-v2.js --attach
 * 
 * OPTION 2 - Launch new browser (original behavior):
 *   node scripts/demo-walkthrough-v2.js
 * 
 * FLAGS:
 *   --attach    Connect to existing Chrome (port 9222)
 *   --fast      Run at 2x speed
 *   --port=XX   Custom app port (default: 3000)
 */

const { chromium } = require('playwright');

// Parse args
const args = process.argv.slice(2);
const ATTACH_MODE = args.includes('--attach');
const FAST_MODE = args.includes('--fast');
const PORT_ARG = args.find(a => a.startsWith('--port='));
const APP_PORT = PORT_ARG ? PORT_ARG.split('=')[1] : '3000';

// Config
const CONFIG = {
  url: `http://localhost:${APP_PORT}`,
  cdpUrl: 'http://127.0.0.1:9222',  // Use IPv4 explicitly
  viewport: { width: 1920, height: 1080 },
  speedMultiplier: FAST_MODE ? 0.5 : 1,
};

// Timing helper
const wait = (ms) => ms * CONFIG.speedMultiplier;

// Easing function
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Smooth scroll
async function smoothScrollTo(page, targetY, duration = 1500) {
  const startY = await page.evaluate(() => window.scrollY);
  const distance = targetY - startY;
  const steps = Math.ceil(duration / 16);
  
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const easedProgress = easeInOutCubic(progress);
    const currentY = startY + (distance * easedProgress);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'auto' }), currentY);
    await page.waitForTimeout(16);
  }
}

async function smoothScrollDown(page, amount, duration = 1500) {
  const currentY = await page.evaluate(() => window.scrollY);
  await smoothScrollTo(page, currentY + amount, wait(duration));
}

async function scrollToTop(page, duration = 1000) {
  await smoothScrollTo(page, 0, wait(duration));
}

async function scrollToElement(page, selector, offset = -100, duration = 1500) {
  const element = await page.$(selector);
  if (element) {
    const box = await element.boundingBox();
    if (box) {
      const targetY = box.y + await page.evaluate(() => window.scrollY) + offset;
      await smoothScrollTo(page, Math.max(0, targetY), wait(duration));
    }
  }
}

// Mouse movement
async function moveMouse(page, toX, toY, duration = 800) {
  const steps = Math.ceil(duration / 20);
  const startX = await page.evaluate(() => window.innerWidth / 2);
  const startY = await page.evaluate(() => window.innerHeight / 2);
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const eased = easeInOutCubic(t);
    const x = startX + (toX - startX) * eased;
    const y = startY + (toY - startY) * eased;
    await page.mouse.move(x, y);
    await page.waitForTimeout(20);
  }
}

// Click element
async function clickElement(page, selector, description = '') {
  const element = await page.$(selector);
  if (!element) {
    console.log(`   ⚠️ Not found: ${selector}`);
    return false;
  }
  const box = await element.boundingBox();
  if (box) {
    if (description) console.log(`   → ${description}`);
    await moveMouse(page, box.x + box.width / 2, box.y + box.height / 2, wait(500));
    await page.waitForTimeout(wait(150));
    await element.click();
    await page.waitForTimeout(wait(400));
    return true;
  }
  return false;
}

// Click tab
async function clickTab(page, tabText) {
  console.log(`   📌 Tab: ${tabText}`);
  const success = await clickElement(page, `nav[aria-label="Tabs"] button:has-text("${tabText}")`, '');
  if (!success) {
    // Fallback
    await clickElement(page, `button:has-text("${tabText}")`, '');
  }
  await page.waitForTimeout(wait(1000));
}

// Hover element
async function hoverElement(page, selector, duration = 1000) {
  const element = await page.$(selector);
  if (element) {
    const box = await element.boundingBox();
    if (box) {
      await moveMouse(page, box.x + box.width / 2, box.y + box.height / 2, wait(400));
      await page.waitForTimeout(wait(duration));
    }
  }
}

// Select agency
async function selectAgency(page, agencyName) {
  console.log(`   → Selecting: ${agencyName}`);
  const dropdownBtn = await page.$('button:has-text("Market View"), button:has-text("🌍"), button:has-text("🏢")');
  if (dropdownBtn) {
    await dropdownBtn.click();
    await page.waitForTimeout(wait(400));
    const option = await page.$(`button:has-text("${agencyName}")`);
    if (option) {
      await option.click();
      await page.waitForTimeout(wait(1500));
    }
  }
}

// Log segment
function logSegment(num, title) {
  console.log('');
  console.log('═'.repeat(55));
  console.log(`📹 SEGMENT ${num}: ${title}`);
  console.log('═'.repeat(55));
}

// Main demo
async function runDemo() {
  console.log('');
  console.log('╔' + '═'.repeat(53) + '╗');
  console.log('║   UN Jobs Dashboard - Demo Walkthrough V2' + ' '.repeat(10) + '║');
  if (ATTACH_MODE) {
    console.log('║   Mode: ATTACH to existing Chrome' + ' '.repeat(18) + '║');
  } else {
    console.log('║   Mode: Launch new browser' + ' '.repeat(26) + '║');
  }
  if (FAST_MODE) console.log('║   Speed: 2x (fast mode)' + ' '.repeat(29) + '║');
  console.log('╚' + '═'.repeat(53) + '╝');
  console.log('');
  
  let browser;
  let page;
  
  try {
    if (ATTACH_MODE) {
      // Connect to existing Chrome
      console.log(`🔗 Connecting to Chrome at ${CONFIG.cdpUrl}...`);
      browser = await chromium.connectOverCDP(CONFIG.cdpUrl);
      
      // Get existing pages
      const contexts = browser.contexts();
      if (contexts.length === 0) {
        throw new Error('No browser contexts found. Make sure Chrome is open with a tab.');
      }
      
      const pages = contexts[0].pages();
      if (pages.length === 0) {
        throw new Error('No pages found. Open a tab first.');
      }
      
      // Find the page with our app, or use first page
      page = pages.find(p => p.url().includes('localhost:' + APP_PORT)) || pages[0];
      
      // Navigate if not already on our app
      if (!page.url().includes('localhost:' + APP_PORT)) {
        console.log('📍 Navigating to app...');
        await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: 30000 });
      }
      
      console.log('✅ Connected to existing browser!');
    } else {
      // Launch new browser - with NO viewport constraints (use full window)
      console.log('🚀 Launching browser...');
      browser = await chromium.launch({
        headless: false,
        args: [
          '--start-maximized',
          '--disable-infobars',
          '--no-first-run',
        ],
      });
      
      // Create context with NO viewport (null = use full browser window)
      const context = await browser.newContext({
        viewport: null,  // This is key - don't constrain viewport!
      });
      
      page = await context.newPage();
      await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: 60000 });
    }
    
    // Wait for dashboard to load
    await page.waitForSelector('.tab-content', { timeout: 30000 });
    console.log('✅ Dashboard ready!');
    console.log('');
    console.log('⏱️  Starting in 3 seconds... (Start recording!)');
    await page.waitForTimeout(3000);
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(1, 'OPENING - Intelligence Overview');
    // ═══════════════════════════════════════════════════════════════
    
    await page.waitForTimeout(wait(2000));
    await hoverElement(page, 'section', 2000);
    await smoothScrollDown(page, 300, 2000);
    await page.waitForTimeout(wait(3000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(2, 'WORKFORCE - Agency Fingerprints');
    // ═══════════════════════════════════════════════════════════════
    
    await scrollToTop(page, 800);
    await clickTab(page, 'Workforce');
    await page.waitForTimeout(wait(1500));
    
    // Scroll to Agency Fingerprints
    console.log('   Finding Agency Fingerprints...');
    await scrollToElement(page, 'h3:has-text("Agency Workforce Fingerprints")', -80, 1500);
    await page.waitForTimeout(wait(1500));
    
    // Sort by Highest Staff %
    console.log('   Sorting by Highest Staff %...');
    await page.selectOption('select', { label: 'Highest Staff %' }).catch(() => {});
    await page.waitForTimeout(wait(2000));
    
    // Hover over agency cards
    await hoverElement(page, '[class*="cursor-pointer"]', 1500);
    
    // Sort by Highest HQ %
    console.log('   Sorting by Highest HQ %...');
    await page.selectOption('select', { label: 'Highest HQ %' }).catch(() => {});
    await page.waitForTimeout(wait(2000));
    
    await hoverElement(page, '[class*="cursor-pointer"]', 1500);
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(3, 'WORKFORCE - Staff vs Non-Staff');
    // ═══════════════════════════════════════════════════════════════
    
    console.log('   Scrolling to Staff vs Non-Staff...');
    await scrollToElement(page, 'h3:has-text("Staff vs Non-Staff")', -80, 1500);
    await page.waitForTimeout(wait(2000));
    await hoverElement(page, '.recharts-wrapper', 2000);
    await page.waitForTimeout(wait(2000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(4, 'GEOGRAPHY - Choropleth Map');
    // ═══════════════════════════════════════════════════════════════
    
    await scrollToTop(page, 800);
    await clickTab(page, 'Geography');
    await page.waitForTimeout(wait(2000));
    
    console.log('   Viewing country shading...');
    // Map should show choropleth by default
    await page.waitForTimeout(wait(2500));
    
    // Hover over map
    await hoverElement(page, 'svg.rsm-svg', 2000);
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(5, 'GEOGRAPHY - Agency Comparison');
    // ═══════════════════════════════════════════════════════════════
    
    // Switch to Bubbles
    console.log('   Switching to Bubbles...');
    await clickElement(page, 'button:has-text("Bubbles")', 'Bubbles view');
    await page.waitForTimeout(wait(1000));
    
    // Click Compare
    console.log('   Enabling Compare mode...');
    await clickElement(page, 'button:has-text("Compare")', 'Compare mode');
    await page.waitForTimeout(wait(800));
    
    // Add agencies using quick-add buttons
    console.log('   Adding UNDP, UNICEF, UNEP...');
    await clickElement(page, 'button:has-text("+ UNDP")', 'Add UNDP');
    await page.waitForTimeout(wait(500));
    await clickElement(page, 'button:has-text("+ UNICEF")', 'Add UNICEF');
    await page.waitForTimeout(wait(500));
    await clickElement(page, 'button:has-text("+ UNEP")', 'Add UNEP');
    await page.waitForTimeout(wait(2000));
    
    // Hover over map to show comparison
    await hoverElement(page, 'svg.rsm-svg', 3000);
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(6, 'GEOGRAPHY - Hardship E Only');
    // ═══════════════════════════════════════════════════════════════
    
    // Reset
    console.log('   Resetting view...');
    await clickElement(page, 'button:has-text("Reset")', 'Reset');
    await page.waitForTimeout(wait(800));
    
    // Ensure bubbles mode
    await clickElement(page, 'button:has-text("Bubbles")', '');
    await page.waitForTimeout(wait(600));
    
    // Filter to only Hardship E - click A,B,C,D to toggle them off
    console.log('   Filtering to Hardship E...');
    const hardshipButtons = await page.$$('button');
    for (const btn of hardshipButtons) {
      const text = await btn.textContent();
      if (text && ['A', 'B', 'C', 'D'].includes(text.trim()) && text.trim().length === 1) {
        const parent = await btn.evaluate(el => el.parentElement?.textContent || '');
        // Make sure it's a hardship button (in the hardship filter area)
        if (parent.includes('Hardship') || !parent.includes('Agency')) {
          await btn.click();
          await page.waitForTimeout(wait(200));
        }
      }
    }
    await page.waitForTimeout(wait(2000));
    
    // Hover over E hardship locations
    await hoverElement(page, 'svg.rsm-svg', 2500);
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(7, 'GEOGRAPHY - Click Ukraine');
    // ═══════════════════════════════════════════════════════════════
    
    // Reset to show all
    await clickElement(page, 'button:has-text("Reset")', 'Reset');
    await page.waitForTimeout(wait(800));
    
    // Click on Ukraine in the map (approximate coordinates for Ukraine)
    console.log('   Clicking on Ukraine...');
    const mapSvg = await page.$('svg.rsm-svg');
    if (mapSvg) {
      const box = await mapSvg.boundingBox();
      if (box) {
        // Ukraine is roughly in the center-east of the map (Europe area)
        // Map center is roughly [0, 20], Ukraine is around [32, 49]
        // In a world projection, that's roughly:
        const ukraineX = box.x + box.width * 0.57;  // Eastern Europe
        const ukraineY = box.y + box.height * 0.28; // Northern hemisphere
        
        await moveMouse(page, ukraineX, ukraineY, wait(600));
        await page.waitForTimeout(wait(300));
        await page.mouse.click(ukraineX, ukraineY);
        await page.waitForTimeout(wait(2500));
      }
    }
    
    // Close detail panel if it opened
    const closeBtn = await page.$('button:has-text("×"), [class*="close"]');
    if (closeBtn) {
      await page.waitForTimeout(wait(2000));
      await closeBtn.click();
      await page.waitForTimeout(wait(500));
    }
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(8, 'GEOGRAPHY - Hardship Profiles');
    // ═══════════════════════════════════════════════════════════════
    
    console.log('   Scrolling to Hardship Profile...');
    await scrollToElement(page, 'h3:has-text("Hardship Profile")', -80, 1500);
    await page.waitForTimeout(wait(2500));
    await hoverElement(page, '[class*="rounded-full"][class*="h-"]', 1500);
    await page.waitForTimeout(wait(2000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(9, 'CATEGORIES - Agency Dominance');
    // ═══════════════════════════════════════════════════════════════
    
    await scrollToTop(page, 800);
    await clickTab(page, 'Categories');
    await page.waitForTimeout(wait(1500));
    
    console.log('   Finding Agency Category Dominance...');
    await scrollToElement(page, 'h3:has-text("Agency Category Dominance")', -80, 1500);
    await page.waitForTimeout(wait(1500));
    
    // Click to expand a category
    const catRow = await page.$('[class*="cursor-pointer"]:has([class*="rounded-full"])');
    if (catRow) {
      await catRow.click();
      await page.waitForTimeout(wait(2000));
    }
    
    // Switch to By Agency view
    console.log('   Switching to By Agency view...');
    await clickElement(page, 'button:has-text("By Agency")', 'By Agency');
    await page.waitForTimeout(wait(2500));
    
    await hoverElement(page, '.recharts-wrapper', 2000);
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(10, 'INTELLIGENCE - UN Secretariat');
    // ═══════════════════════════════════════════════════════════════
    
    await scrollToTop(page, 800);
    
    // Select UN Secretariat
    await selectAgency(page, 'UN Secretariat');
    await page.waitForTimeout(wait(1500));
    
    await clickTab(page, 'Intelligence');
    await page.waitForTimeout(wait(2000));
    
    // Scroll through intelligence content
    await smoothScrollDown(page, 350, 2000);
    await page.waitForTimeout(wait(2000));
    
    await hoverElement(page, 'section', 1500);
    
    await smoothScrollDown(page, 350, 2000);
    await page.waitForTimeout(wait(2000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(11, 'CLOSING - Return to Market View');
    // ═══════════════════════════════════════════════════════════════
    
    await scrollToTop(page, 800);
    await selectAgency(page, 'Market View');
    await page.waitForTimeout(wait(3000));
    
    // ═══════════════════════════════════════════════════════════════
    console.log('');
    console.log('╔' + '═'.repeat(53) + '╗');
    console.log('║' + ' '.repeat(15) + '🎬 DEMO COMPLETE!' + ' '.repeat(21) + '║');
    console.log('║   You can stop recording now.' + ' '.repeat(23) + '║');
    console.log('╚' + '═'.repeat(53) + '╝');
    
    if (!ATTACH_MODE) {
      await page.waitForTimeout(3000);
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    if (ATTACH_MODE) {
      console.error('For --attach mode, make sure to:');
      console.error('  1. Close all Chrome windows');
      console.error('  2. Start Chrome with: chrome --remote-debugging-port=9222');
      console.error('  3. Navigate to http://localhost:3000');
      console.error('  4. Then run this script');
    }
    throw error;
  } finally {
    if (browser && !ATTACH_MODE) {
      await browser.close();
    }
  }
}

// Run
runDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});

