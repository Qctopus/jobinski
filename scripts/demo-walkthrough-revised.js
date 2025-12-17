/**
 * UN Jobs Dashboard Demo Walkthrough - REVISED VERSION
 * 
 * Specific features to showcase:
 * 1. Workforce: Agency Fingerprints (sort by Staff%, HQ%), Staff vs Non-Staff
 * 2. Geography: Choropleth → Bubbles comparison (UNDP, UNICEF, UNEP), Hardship E filter, Hardship Profiles
 * 3. Categories: Agency Category Dominance
 * 4. Intelligence: For UN Secretariat specifically
 * 
 * USAGE:
 *   1. Start backend: cd backend && npm start
 *   2. Start frontend: npm start
 *   3. Run: node scripts/demo-walkthrough-revised.js
 * 
 * OPTIONS:
 *   --fast     Run at 2x speed for testing
 *   --port=XX  Custom port (default: 3000)
 */

const { chromium } = require('playwright');

// Parse args
const args = process.argv.slice(2);
const FAST_MODE = args.includes('--fast');
const PORT_ARG = args.find(a => a.startsWith('--port='));
const CUSTOM_PORT = PORT_ARG ? PORT_ARG.split('=')[1] : null;

// Config
const CONFIG = {
  url: `http://localhost:${CUSTOM_PORT || 3000}`,
  viewport: { width: 1920, height: 1080 },
  headless: false,
  speedMultiplier: FAST_MODE ? 0.5 : 1,
};

// Timing helper
const wait = (ms) => ms * CONFIG.speedMultiplier;

// Easing function for smooth animations
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Smooth scroll with easing
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

// Scroll down by amount
async function smoothScrollDown(page, amount, duration = 1500) {
  const currentY = await page.evaluate(() => window.scrollY);
  await smoothScrollTo(page, currentY + amount, wait(duration));
}

// Scroll to top
async function scrollToTop(page, duration = 1000) {
  await smoothScrollTo(page, 0, wait(duration));
}

// Scroll to element
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

// Cinematic mouse move with easing
async function moveMouse(page, toX, toY, duration = 800) {
  const currentPos = await page.evaluate(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
  const steps = Math.ceil(duration / 20);
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const eased = easeInOutCubic(t);
    const x = currentPos.x + (toX - currentPos.x) * eased;
    const y = currentPos.y + (toY - currentPos.y) * eased;
    await page.mouse.move(x, y);
    await page.waitForTimeout(20);
  }
}

// Click element with cinematic movement
async function clickElement(page, selector, description = '') {
  const element = await page.$(selector);
  if (!element) {
    console.log(`   ⚠️ Element not found: ${selector}`);
    return false;
  }
  
  const box = await element.boundingBox();
  if (box) {
    if (description) console.log(`   → ${description}`);
    await moveMouse(page, box.x + box.width / 2, box.y + box.height / 2, wait(600));
    await page.waitForTimeout(wait(200));
    await element.click();
    await page.waitForTimeout(wait(400));
    return true;
  }
  return false;
}

// Select dropdown option
async function selectOption(page, selectSelector, optionValue, description = '') {
  if (description) console.log(`   → ${description}`);
  await page.selectOption(selectSelector, optionValue);
  await page.waitForTimeout(wait(500));
}

// Click tab by name
async function clickTab(page, tabText) {
  console.log(`   📌 Tab: ${tabText}`);
  const tab = await page.$(`nav[aria-label="Tabs"] button:has-text("${tabText}")`);
  if (tab) {
    const box = await tab.boundingBox();
    if (box) {
      await moveMouse(page, box.x + box.width / 2, box.y + box.height / 2, wait(500));
      await page.waitForTimeout(wait(200));
      await tab.click();
      await page.waitForTimeout(wait(1000));
    }
  } else {
    console.log(`   ⚠️ Tab not found: ${tabText}`);
  }
}

// Hover over element
async function hoverElement(page, selector, duration = 1000) {
  const element = await page.$(selector);
  if (element) {
    const box = await element.boundingBox();
    if (box) {
      await moveMouse(page, box.x + box.width / 2, box.y + box.height / 2, wait(500));
      await page.waitForTimeout(wait(duration));
    }
  }
}

// Log segment
function logSegment(num, title) {
  console.log('');
  console.log('═'.repeat(60));
  console.log(`📹 SEGMENT ${num}: ${title}`);
  console.log('═'.repeat(60));
}

// Select agency from dropdown
async function selectAgency(page, agencyName) {
  console.log(`   → Selecting agency: ${agencyName}`);
  
  // Click the agency dropdown button
  const dropdownBtn = await page.$('button:has-text("Market View"), button:has-text("🌍")');
  if (dropdownBtn) {
    await dropdownBtn.click();
    await page.waitForTimeout(wait(500));
    
    // Find and click the agency option
    const agencyOption = await page.$(`button:has-text("${agencyName}")`);
    if (agencyOption) {
      await agencyOption.click();
      await page.waitForTimeout(wait(1500)); // Wait for data to load
    }
  }
}

// Main demo
async function runDemo() {
  console.log('');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(8) + 'UN Jobs Dashboard - REVISED Demo' + ' '.repeat(17) + '║');
  console.log('║' + ' '.repeat(58) + '║');
  if (FAST_MODE) console.log('║' + ' '.repeat(20) + '⚡ FAST MODE (2x)' + ' '.repeat(21) + '║');
  console.log('║' + ' '.repeat(15) + `URL: ${CONFIG.url}` + ' '.repeat(20) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('');
  
  const browser = await chromium.launch({
    headless: CONFIG.headless,
    args: ['--start-maximized'],
  });
  
  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    deviceScaleFactor: 1,
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate and wait for load
    console.log('🔄 Loading dashboard...');
    await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('.tab-content', { timeout: 30000 });
    console.log('✅ Dashboard loaded!');
    console.log('');
    console.log('⏱️  Starting demo in 3 seconds... (Start recording now!)');
    await page.waitForTimeout(3000);
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(1, 'OPENING - Intelligence Overview');
    // ═══════════════════════════════════════════════════════════════
    
    // Scroll down slightly to focus on content (fix white space issue)
    await page.waitForTimeout(wait(1000));
    await smoothScrollDown(page, 150, 1000);
    
    // Pause on overview
    await page.waitForTimeout(wait(4000));
    
    // Hover over some key insights
    await hoverElement(page, 'section', 2000);
    await page.waitForTimeout(wait(3000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(2, 'WORKFORCE - Agency Fingerprints');
    // ═══════════════════════════════════════════════════════════════
    
    await scrollToTop(page, 800);
    await clickTab(page, 'Workforce');
    await page.waitForTimeout(wait(2000));
    
    // Scroll to Agency Workforce Fingerprints section
    console.log('   Scrolling to Agency Fingerprints...');
    await scrollToElement(page, 'h3:has-text("Agency Workforce Fingerprints")', -50, 1500);
    await page.waitForTimeout(wait(2000));
    
    // Find and click the sort dropdown, select "Highest Staff %"
    console.log('   Sorting by Highest Staff %...');
    const sortSelect = await page.$('select:near(:text("Sort by"))');
    if (sortSelect) {
      await sortSelect.selectOption('staff-ratio');
      await page.waitForTimeout(wait(2000));
    } else {
      // Try alternative selector
      await page.selectOption('select', { label: 'Highest Staff %' }).catch(() => {});
      await page.waitForTimeout(wait(2000));
    }
    
    // Hover over top agency cards
    await hoverElement(page, '[class*="rounded-lg"][class*="border"]:has([class*="Building2"])', 1500);
    await page.waitForTimeout(wait(2000));
    
    // Change sort to "Highest HQ %"
    console.log('   Sorting by Highest HQ %...');
    if (sortSelect) {
      await sortSelect.selectOption('hq-ratio');
      await page.waitForTimeout(wait(2000));
    }
    
    // Hover and explore
    await hoverElement(page, '[class*="rounded-lg"][class*="border"]', 2000);
    await page.waitForTimeout(wait(2000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(3, 'WORKFORCE - Staff vs Non-Staff Analysis');
    // ═══════════════════════════════════════════════════════════════
    
    // Scroll to Staff vs Non-Staff Analysis
    console.log('   Scrolling to Staff vs Non-Staff...');
    await scrollToElement(page, 'h3:has-text("Staff vs Non-Staff")', -50, 1500);
    await page.waitForTimeout(wait(2000));
    
    // Hover over the chart
    await hoverElement(page, '.recharts-wrapper', 2000);
    await page.waitForTimeout(wait(3000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(4, 'GEOGRAPHY - Choropleth Map');
    // ═══════════════════════════════════════════════════════════════
    
    await scrollToTop(page, 800);
    await clickTab(page, 'Geography');
    await page.waitForTimeout(wait(2500));
    
    // Map should show choropleth (country shading) by default
    console.log('   Viewing choropleth map...');
    await page.waitForTimeout(wait(3000));
    
    // Hover over the map
    await hoverElement(page, 'svg.rsm-svg, [class*="map"]', 2000);
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(5, 'GEOGRAPHY - Agency Comparison (UNDP, UNICEF, UNEP)');
    // ═══════════════════════════════════════════════════════════════
    
    // Switch to bubbles mode
    console.log('   Switching to Bubbles view...');
    await clickElement(page, 'button:has-text("Bubbles")', 'Clicking Bubbles view');
    await page.waitForTimeout(wait(1500));
    
    // Click Compare button
    console.log('   Enabling comparison mode...');
    await clickElement(page, 'button:has-text("Compare")', 'Clicking Compare');
    await page.waitForTimeout(wait(1000));
    
    // Select agencies for comparison: UNDP, UNICEF, UNEP
    console.log('   Selecting comparison agencies...');
    
    // Find the agency selector dropdown
    const agencySelector = await page.$('select:near(:text("Add agency"))');
    
    // Add UNDP
    if (agencySelector) {
      await agencySelector.selectOption({ label: 'UNDP' }).catch(async () => {
        // Try clicking quick add button
        const undpBtn = await page.$('button:has-text("+ UNDP")');
        if (undpBtn) await undpBtn.click();
      });
      await page.waitForTimeout(wait(800));
    }
    
    // Add UNICEF
    const agencySelector2 = await page.$('select:near(:text("Add agency"))');
    if (agencySelector2) {
      await agencySelector2.selectOption({ label: 'UNICEF' }).catch(async () => {
        const unicefBtn = await page.$('button:has-text("+ UNICEF")');
        if (unicefBtn) await unicefBtn.click();
      });
      await page.waitForTimeout(wait(800));
    }
    
    // Add UNEP
    const agencySelector3 = await page.$('select:near(:text("Add agency"))');
    if (agencySelector3) {
      await agencySelector3.selectOption({ label: 'UNEP' }).catch(async () => {
        const unepBtn = await page.$('button:has-text("+ UNEP")');
        if (unepBtn) await unepBtn.click();
      });
      await page.waitForTimeout(wait(800));
    }
    
    // Let the comparison visualization settle
    await page.waitForTimeout(wait(3000));
    
    // Hover over map to show agency bubbles
    await hoverElement(page, 'svg.rsm-svg, [class*="map"]', 3000);
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(6, 'GEOGRAPHY - Hardship E Filter');
    // ═══════════════════════════════════════════════════════════════
    
    // First click Reset to clear comparison
    console.log('   Resetting map view...');
    await clickElement(page, 'button:has-text("Reset")', 'Clicking Reset');
    await page.waitForTimeout(wait(1000));
    
    // Switch back to bubbles if needed
    await clickElement(page, 'button:has-text("Bubbles")', 'Ensuring Bubbles view');
    await page.waitForTimeout(wait(1000));
    
    // Click on hardship level buttons - we want to show only E
    console.log('   Filtering to Hardship E only...');
    
    // Click A, B, C, D to deselect them (leaving only E)
    const hardshipButtons = await page.$$('button:has-text("A"), button:has-text("B"), button:has-text("C"), button:has-text("D")');
    for (const btn of hardshipButtons.slice(0, 4)) {
      const text = await btn.textContent();
      if (text && text.trim().length === 1 && ['A', 'B', 'C', 'D'].includes(text.trim())) {
        await btn.click();
        await page.waitForTimeout(wait(300));
      }
    }
    
    await page.waitForTimeout(wait(2500));
    
    // Hover over remaining E bubbles
    await hoverElement(page, 'svg.rsm-svg, [class*="map"]', 2000);
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(7, 'GEOGRAPHY - Hardship Profiles');
    // ═══════════════════════════════════════════════════════════════
    
    // Scroll down to Hardship Profile section
    console.log('   Scrolling to Hardship Profile...');
    await scrollToElement(page, 'h3:has-text("Hardship Profile")', -50, 1500);
    await page.waitForTimeout(wait(3000));
    
    // Hover over hardship distribution bars
    await hoverElement(page, '[class*="rounded-full"][class*="h-6"]', 1500);
    await page.waitForTimeout(wait(2000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(8, 'CATEGORIES - Agency Category Dominance');
    // ═══════════════════════════════════════════════════════════════
    
    await scrollToTop(page, 800);
    await clickTab(page, 'Categories');
    await page.waitForTimeout(wait(2000));
    
    // Scroll to Agency Category Dominance section
    console.log('   Scrolling to Agency Category Dominance...');
    await scrollToElement(page, 'h3:has-text("Agency Category Dominance")', -50, 1500);
    await page.waitForTimeout(wait(2000));
    
    // Click on a category to expand
    const categoryRow = await page.$('[class*="cursor-pointer"]:has([class*="rounded-full"])');
    if (categoryRow) {
      await categoryRow.click();
      await page.waitForTimeout(wait(2000));
    }
    
    // Hover over the chart
    await hoverElement(page, '.recharts-wrapper', 2000);
    
    // Switch to "By Agency" view
    console.log('   Switching to By Agency view...');
    await clickElement(page, 'button:has-text("By Agency")', 'By Agency view');
    await page.waitForTimeout(wait(2500));
    
    // Hover over agency bars
    await hoverElement(page, '[class*="rounded-lg"]:has([class*="font-semibold"])', 2000);
    await page.waitForTimeout(wait(2000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(9, 'INTELLIGENCE - UN Secretariat');
    // ═══════════════════════════════════════════════════════════════
    
    await scrollToTop(page, 800);
    
    // Select UN Secretariat agency from dropdown
    console.log('   Selecting UN Secretariat...');
    await selectAgency(page, 'UN Secretariat');
    await page.waitForTimeout(wait(2000));
    
    // Now navigate to Intelligence tab
    await clickTab(page, 'Intelligence');
    await page.waitForTimeout(wait(2500));
    
    // Scroll down to show key insights for UN Secretariat
    await smoothScrollDown(page, 150, 1000);
    await page.waitForTimeout(wait(2000));
    
    // Hover over intelligence sections
    await hoverElement(page, 'section', 2000);
    
    // Scroll through more content
    await smoothScrollDown(page, 400, 2000);
    await page.waitForTimeout(wait(2000));
    
    await smoothScrollDown(page, 400, 2000);
    await page.waitForTimeout(wait(2000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(10, 'CLOSING - Return to Market View');
    // ═══════════════════════════════════════════════════════════════
    
    await scrollToTop(page, 800);
    
    // Return to Market View
    console.log('   Returning to Market View...');
    await selectAgency(page, 'Market View');
    await page.waitForTimeout(wait(2500));
    
    // Final pause on dashboard
    await page.waitForTimeout(wait(4000));
    
    // ═══════════════════════════════════════════════════════════════
    console.log('');
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '🎬 DEMO COMPLETE! 🎬' + ' '.repeat(23) + '║');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('║' + '   You can stop recording now.' + ' '.repeat(27) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    
    // Keep browser open briefly
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Is the frontend running? (npm start)');
    console.error('  2. Is the backend running? (cd backend && npm start)');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run
runDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});





