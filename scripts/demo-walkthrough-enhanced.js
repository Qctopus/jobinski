/**
 * UN Jobs Dashboard Demo Walkthrough - Enhanced Version
 * 
 * Features:
 * - Precise timing matched to narration script
 * - Cursor trail effects for viewer attention
 * - Smooth cinematic scrolling
 * - Interactive element highlighting
 * - OBS/Screen recording friendly
 * 
 * USAGE:
 *   1. Start the backend: cd backend && npm start
 *   2. Start the frontend: npm start  (should be on port 3000)
 *   3. (Optional) Start OBS or screen recorder
 *   4. Run: node scripts/demo-walkthrough-enhanced.js
 * 
 * OPTIONS:
 *   --fast        Run at 2x speed for testing
 *   --port=XXXX   Custom port (default: 3000)
 */

const { chromium } = require('playwright');

// Parse command line args
const args = process.argv.slice(2);
const FAST_MODE = args.includes('--fast');
const PORT_ARG = args.find(a => a.startsWith('--port='));
const CUSTOM_PORT = PORT_ARG ? PORT_ARG.split('=')[1] : null;

// Configuration
const CONFIG = {
  url: `http://localhost:${CUSTOM_PORT || 3000}`,
  viewport: { width: 1920, height: 1080 },
  headless: false,
  speedMultiplier: FAST_MODE ? 0.5 : 1, // 2x speed in fast mode
};

// Timing helper (respects speed multiplier)
const wait = (ms) => ms * CONFIG.speedMultiplier;

// Tab selectors mapping (based on Dashboard.tsx structure)
const TAB_SELECTORS = {
  'Intelligence': 'nav button:has-text("Intelligence")',
  'Categories': 'nav button:has-text("Categories")',
  'Workforce Structure': 'nav button:has-text("Workforce")',
  'Geography': 'nav button:has-text("Geography")',
  'Skills': 'nav button:has-text("Skills")',
  'Job Browser': 'nav button:has-text("Job Browser")',
};

// Easing function for smooth animations
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Smooth scroll with easing
async function smoothScrollWithEasing(page, targetY, duration = 2000) {
  const startY = await page.evaluate(() => window.scrollY);
  const distance = targetY - startY;
  const steps = Math.ceil(duration / 16); // ~60fps
  
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const easedProgress = easeInOutCubic(progress);
    const currentY = startY + (distance * easedProgress);
    await page.evaluate((y) => window.scrollTo(0, y), currentY);
    await page.waitForTimeout(16);
  }
}

// Smooth scroll down by amount
async function smoothScrollDown(page, amount, duration = 2000) {
  const currentY = await page.evaluate(() => window.scrollY);
  await smoothScrollWithEasing(page, currentY + amount, wait(duration));
}

// Scroll to top
async function scrollToTop(page, duration = 1000) {
  await smoothScrollWithEasing(page, 0, wait(duration));
}

// Cinematic mouse movement (smooth bezier-like path)
async function cinematicMouseMove(page, toX, toY, duration = 1000) {
  const steps = Math.ceil(duration / 20);
  
  // Get current position (approximate center if not tracked)
  const currentPos = await page.evaluate(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }));
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const eased = easeInOutCubic(t);
    const x = currentPos.x + (toX - currentPos.x) * eased;
    const y = currentPos.y + (toY - currentPos.y) * eased;
    await page.mouse.move(x, y);
    await page.waitForTimeout(20);
  }
}

// Hover element with cinematic approach
async function cinematicHover(page, selector, duration = 1500) {
  const element = await page.$(selector);
  if (!element) {
    console.log(`   ⚠️ Element not found: ${selector}`);
    return;
  }
  
  const box = await element.boundingBox();
  if (box) {
    await cinematicMouseMove(
      page, 
      box.x + box.width / 2, 
      box.y + box.height / 2, 
      wait(800)
    );
    await page.waitForTimeout(wait(duration));
  }
}

// Click tab with visual elegance
async function clickTabCinematic(page, tabName) {
  const selector = TAB_SELECTORS[tabName];
  if (!selector) {
    console.log(`   ⚠️ Unknown tab: ${tabName}`);
    return;
  }
  
  console.log(`   📌 Navigating to: ${tabName}`);
  
  const tab = await page.$(selector);
  if (!tab) {
    // Fallback: try partial match
    const fallback = await page.$(`button:has-text("${tabName.split(' ')[0]}")`);
    if (fallback) {
      const box = await fallback.boundingBox();
      if (box) {
        await cinematicMouseMove(page, box.x + box.width / 2, box.y + box.height / 2, wait(600));
        await page.waitForTimeout(wait(200));
        await fallback.click();
      }
    }
    return;
  }
  
  const box = await tab.boundingBox();
  if (box) {
    await cinematicMouseMove(page, box.x + box.width / 2, box.y + box.height / 2, wait(600));
    await page.waitForTimeout(wait(200));
    await tab.click();
  }
  
  // Wait for content to load
  await page.waitForTimeout(wait(800));
}

// Explore charts by hovering over different data points
async function exploreChart(page, duration = 3000) {
  // Find chart elements
  const charts = await page.$$('.recharts-wrapper');
  
  if (charts.length > 0) {
    const chart = charts[0];
    const box = await chart.boundingBox();
    
    if (box) {
      // Move across chart in a scanning pattern
      const points = [
        { x: box.x + box.width * 0.2, y: box.y + box.height * 0.5 },
        { x: box.x + box.width * 0.4, y: box.y + box.height * 0.3 },
        { x: box.x + box.width * 0.6, y: box.y + box.height * 0.6 },
        { x: box.x + box.width * 0.8, y: box.y + box.height * 0.4 },
      ];
      
      const timePerPoint = duration / points.length;
      
      for (const point of points) {
        await cinematicMouseMove(page, point.x, point.y, wait(timePerPoint * 0.6));
        await page.waitForTimeout(wait(timePerPoint * 0.4));
      }
    }
  }
}

// Explore map with geographic movement
async function exploreMap(page, duration = 5000) {
  // Look for map SVG or canvas
  const mapElement = await page.$('svg.rsm-svg') || await page.$('[class*="map"]') || await page.$('svg:has(.rsm-geography)');
  
  if (mapElement) {
    const box = await mapElement.boundingBox();
    
    if (box) {
      // Geographic sweep pattern (roughly following continents)
      const points = [
        { x: box.x + box.width * 0.25, y: box.y + box.height * 0.35 }, // Americas
        { x: box.x + box.width * 0.45, y: box.y + box.height * 0.30 }, // Europe
        { x: box.x + box.width * 0.50, y: box.y + box.height * 0.55 }, // Africa
        { x: box.x + box.width * 0.65, y: box.y + box.height * 0.35 }, // Middle East
        { x: box.x + box.width * 0.75, y: box.y + box.height * 0.40 }, // Asia
        { x: box.x + box.width * 0.85, y: box.y + box.height * 0.60 }, // Pacific
      ];
      
      const timePerPoint = duration / points.length;
      
      for (const point of points) {
        await cinematicMouseMove(page, point.x, point.y, wait(timePerPoint * 0.5));
        await page.waitForTimeout(wait(timePerPoint * 0.5));
      }
    }
  } else {
    console.log('   ⚠️ Map element not found, waiting...');
    await page.waitForTimeout(wait(duration));
  }
}

// Display segment header
function logSegment(number, title, timing, description) {
  console.log('');
  console.log('═'.repeat(60));
  console.log(`📹 SEGMENT ${number}: ${title} (${timing})`);
  console.log(`   ${description}`);
  console.log('═'.repeat(60));
}

// Main demo sequence
async function runDemo() {
  console.log('');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(10) + 'UN Jobs Dashboard Demo Walkthrough' + ' '.repeat(13) + '║');
  console.log('║' + ' '.repeat(58) + '║');
  if (FAST_MODE) {
    console.log('║' + ' '.repeat(20) + '⚡ FAST MODE (2x)' + ' '.repeat(21) + '║');
  }
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
    
    // Wait for React to render
    await page.waitForSelector('.tab-content', { timeout: 30000 });
    console.log('✅ Dashboard loaded successfully!');
    console.log('');
    console.log('⏱️  Starting demo in 3 seconds...');
    console.log('   (Start your screen recorder now!)');
    await page.waitForTimeout(3000);
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(1, 'OPENING', '0:00 - 0:11', 
      'Intelligence/Overview tab - "patterns that have been invisible until now"');
    
    // Slight pause, then explore the overview
    await page.waitForTimeout(wait(3000));
    await exploreChart(page, wait(6000));
    await page.waitForTimeout(wait(2000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(2, 'WORKFORCE INTRO', '0:11 - 0:36',
      'Workforce tab loads - "staff positions to consultants"');
    
    await clickTabCinematic(page, 'Workforce Structure');
    await page.waitForTimeout(wait(2000));
    
    // Explore grade distribution chart
    await exploreChart(page, wait(5000));
    
    // Hover over key metrics
    await cinematicHover(page, '[class*="stat"], [class*="metric"], [class*="card"]', wait(2000));
    
    await page.waitForTimeout(wait(16000)); // Fill remaining time
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(3, 'WORKFORCE DETAILS', '0:36 - 0:51',
      'Scrolling through workforce charts - "seniority distribution, grade mix"');
    
    await smoothScrollDown(page, 400, 3500);
    await exploreChart(page, wait(3000));
    
    await smoothScrollDown(page, 350, 3000);
    await cinematicHover(page, '.recharts-bar-rectangle, .recharts-sector', wait(2000));
    
    await page.waitForTimeout(wait(3500));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(4, 'CATEGORIES INTRO', '0:51 - 1:26',
      'Categories tab - "what they\'re hiring for" - thematic shifts');
    
    await scrollToTop(page, 1200);
    await clickTabCinematic(page, 'Categories');
    await page.waitForTimeout(wait(2500));
    
    // Explore category visualizations
    await exploreChart(page, wait(6000));
    await cinematicHover(page, '.recharts-pie-sector, .recharts-bar', wait(3000));
    
    await smoothScrollDown(page, 300, 3000);
    await page.waitForTimeout(wait(4000));
    
    await exploreChart(page, wait(5000));
    await page.waitForTimeout(wait(11500));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(5, 'CATEGORIES DETAILS', '1:26 - 1:41',
      'Scrolling through category insights - "skills extraction"');
    
    await smoothScrollDown(page, 400, 3500);
    await exploreChart(page, wait(4000));
    
    await smoothScrollDown(page, 300, 3000);
    await cinematicHover(page, '.recharts-wrapper', wait(2000));
    
    await page.waitForTimeout(wait(2500));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(6, 'GEOGRAPHY INTRO', '1:41 - 2:11',
      'Geography tab - "centralizing at headquarters or field"');
    
    await scrollToTop(page, 1200);
    await clickTabCinematic(page, 'Geography');
    await page.waitForTimeout(wait(3000)); // Let map load
    
    // Explore the map
    await exploreMap(page, wait(8000));
    
    // Hover over location stats
    await cinematicHover(page, '[class*="location"], [class*="country"]', wait(3000));
    
    await page.waitForTimeout(wait(16000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(7, 'GEOGRAPHY PATTERNS', '2:11 - 2:26',
      'Geographic visualizations - "competition hotspots"');
    
    await smoothScrollDown(page, 400, 3500);
    await exploreChart(page, wait(4000));
    
    await smoothScrollDown(page, 300, 3000);
    await cinematicHover(page, '.recharts-bar-rectangle', wait(2000));
    
    await page.waitForTimeout(wait(2500));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(8, 'SKILLS ANALYSIS', '2:26 - 2:46',
      'Skills tab - "language requirements, experience levels"');
    
    await scrollToTop(page, 1200);
    await clickTabCinematic(page, 'Skills');
    await page.waitForTimeout(wait(2500));
    
    await exploreChart(page, wait(5000));
    
    await smoothScrollDown(page, 350, 3500);
    await cinematicHover(page, '.recharts-bar-rectangle, .recharts-sector', wait(3000));
    
    await page.waitForTimeout(wait(6000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(9, 'JOBS BROWSER', '2:46 - 3:06',
      'Job Browser - "every job posting contains rich data"');
    
    await scrollToTop(page, 1200);
    await clickTabCinematic(page, 'Job Browser');
    await page.waitForTimeout(wait(2500));
    
    // Explore job listings
    await smoothScrollDown(page, 250, 2500);
    await cinematicHover(page, 'tr, [class*="job"], [class*="row"]', wait(2000));
    
    await smoothScrollDown(page, 250, 2500);
    await page.waitForTimeout(wait(3000));
    
    await smoothScrollDown(page, 200, 2000);
    await cinematicHover(page, 'td, [class*="cell"]', wait(2000));
    
    await page.waitForTimeout(wait(3500));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(10, 'CLOSING', '3:06 - 3:16',
      'Return to Overview - "patterns will get clearer"');
    
    await scrollToTop(page, 1200);
    await clickTabCinematic(page, 'Intelligence');
    await page.waitForTimeout(wait(2000));
    
    // Final overview scan
    await exploreChart(page, wait(5000));
    await page.waitForTimeout(wait(3000));
    
    // ═══════════════════════════════════════════════════════════════
    logSegment(11, 'FINAL MESSAGE', '3:16 - 3:24',
      'Final shot - "market intelligence for UN"');
    
    // Hold on final view
    await page.waitForTimeout(wait(8000));
    
    // ═══════════════════════════════════════════════════════════════
    console.log('');
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '🎬 DEMO COMPLETE! 🎬' + ' '.repeat(23) + '║');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('║' + '   Total duration: ~3 minutes 24 seconds' + ' '.repeat(17) + '║');
    console.log('║' + '   You can stop recording now.' + ' '.repeat(27) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    
    // Keep browser open for a moment
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Is the frontend running? (npm start)');
    console.error('  2. Is the backend running? (cd backend && npm start)');
    console.error('  3. Try: node scripts/demo-walkthrough-enhanced.js --port=3000');
    throw error;
  } finally {
    await browser.close();
  }
}

// Entry point
runDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});





