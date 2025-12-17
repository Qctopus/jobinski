/**
 * UN Jobs Dashboard Demo Walkthrough Script
 * 
 * This script automates a demo walkthrough of the dashboard for video recording.
 * It follows the narration script timing and creates smooth transitions.
 * 
 * USAGE:
 *   1. Start the backend: cd backend && npm start
 *   2. Start the frontend: npm start
 *   3. Run this script: node scripts/demo-walkthrough.js
 * 
 * REQUIREMENTS:
 *   - Node.js 18+
 *   - Playwright: npm install playwright
 * 
 * TIMING REFERENCE (from narration script):
 *   0:00-0:11  - Opening (Intelligence/Overview tab)
 *   0:11-0:36  - Workforce Structure intro
 *   0:36-0:51  - Workforce scroll
 *   0:51-1:26  - Categories intro
 *   1:26-1:41  - Categories scroll
 *   1:41-2:11  - Geography intro
 *   2:11-2:26  - Geography interaction
 *   2:26-2:46  - Skills tab
 *   2:46-3:06  - Jobs Browser
 *   3:06-3:16  - Return to Overview
 *   3:16-3:24  - Final shot
 */

const { chromium } = require('playwright');

// Configuration
const CONFIG = {
  url: 'http://localhost:3000',
  viewport: { width: 1920, height: 1080 },
  slowMo: 50, // Add slight delay for smoother visuals
  headless: false, // Show browser for recording
};

// Smooth scroll helper - scrolls gradually for video-friendly animation
async function smoothScroll(page, distance, duration = 2000) {
  const steps = 60; // 60 steps for smooth animation
  const stepDistance = distance / steps;
  const stepDelay = duration / steps;
  
  for (let i = 0; i < steps; i++) {
    await page.evaluate((dist) => window.scrollBy(0, dist), stepDistance);
    await page.waitForTimeout(stepDelay);
  }
}

// Smooth scroll to element
async function smoothScrollToElement(page, selector, duration = 1500) {
  const element = await page.$(selector);
  if (element) {
    const box = await element.boundingBox();
    if (box) {
      const targetY = box.y - 100; // Offset from top
      const currentY = await page.evaluate(() => window.scrollY);
      const distance = targetY - currentY;
      await smoothScroll(page, distance, duration);
    }
  }
}

// Scroll to top smoothly
async function scrollToTop(page, duration = 1000) {
  const currentY = await page.evaluate(() => window.scrollY);
  await smoothScroll(page, -currentY, duration);
}

// Click tab with visual feedback
async function clickTab(page, tabName) {
  console.log(`📌 Navigating to: ${tabName}`);
  
  // Find and click the tab
  const tabButton = await page.locator(`nav button:has-text("${tabName}")`).first();
  
  // Highlight effect - move mouse to tab before clicking
  const box = await tabButton.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 20 });
    await page.waitForTimeout(300);
  }
  
  await tabButton.click();
  await page.waitForTimeout(500); // Let content load
}

// Hover over element for visual effect
async function hoverElement(page, selector, duration = 1000) {
  const element = await page.$(selector);
  if (element) {
    const box = await element.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 30 });
      await page.waitForTimeout(duration);
    }
  }
}

// Main demo sequence
async function runDemo() {
  console.log('🎬 Starting UN Jobs Dashboard Demo Walkthrough');
  console.log('='.repeat(50));
  
  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
  });
  
  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    deviceScaleFactor: 1,
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to dashboard
    console.log('📍 Loading dashboard...');
    await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Wait for dashboard to fully load
    await page.waitForSelector('.tab-content', { timeout: 30000 });
    console.log('✅ Dashboard loaded');
    
    // Give a moment for all animations to settle
    await page.waitForTimeout(2000);
    
    // ═══════════════════════════════════════════════════════════════
    // SEGMENT 1: OPENING (0:00 - 0:11)
    // Intelligence/Overview tab - Default landing
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📹 SEGMENT 1: Opening (0:00 - 0:11)');
    console.log('   Screen: Dashboard landing - Intelligence tab');
    
    // Just pause and let the viewer absorb the overview
    await page.waitForTimeout(11000);
    
    // ═══════════════════════════════════════════════════════════════
    // SEGMENT 2: WORKFORCE STRUCTURE - INTRO (0:11 - 0:36)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📹 SEGMENT 2: Workforce Introduction (0:11 - 0:36)');
    console.log('   Screen: Workforce tab loads');
    
    await clickTab(page, 'Workforce Structure');
    await page.waitForTimeout(1500); // Let content load
    
    // Hover over key elements - grade distribution
    await hoverElement(page, '.recharts-wrapper', 2000);
    
    // Let viewer see the initial workforce view
    await page.waitForTimeout(21500); // Total 25 seconds for this segment
    
    // ═══════════════════════════════════════════════════════════════
    // SEGMENT 3: WORKFORCE STRUCTURE - DETAILS (0:36 - 0:51)
    // Scrolling through workforce charts
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📹 SEGMENT 3: Workforce Details (0:36 - 0:51)');
    console.log('   Screen: Scrolling through workforce charts');
    
    // Smooth scroll down through the content
    await smoothScroll(page, 400, 3000);
    await page.waitForTimeout(2000);
    
    // Continue scrolling to see more charts
    await smoothScroll(page, 400, 3000);
    await page.waitForTimeout(2000);
    
    // Hover over a chart element
    await hoverElement(page, '.recharts-bar-rectangle', 1500);
    
    await page.waitForTimeout(3500); // Complete the 15 second segment
    
    // ═══════════════════════════════════════════════════════════════
    // SEGMENT 4: CATEGORIES - THEMATIC SHIFTS (0:51 - 1:26)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📹 SEGMENT 4: Categories Analysis (0:51 - 1:26)');
    console.log('   Screen: Categories tab loads');
    
    // Scroll back to top first
    await scrollToTop(page, 1000);
    
    await clickTab(page, 'Categories');
    await page.waitForTimeout(2000); // Let content load
    
    // Hover over category distribution chart
    await hoverElement(page, '.recharts-pie', 2000);
    
    // Explore the category view
    await page.waitForTimeout(5000);
    
    // Scroll down to see more content
    await smoothScroll(page, 300, 2500);
    await page.waitForTimeout(3000);
    
    // Hover over trend elements
    await hoverElement(page, '.recharts-line', 2000);
    
    await page.waitForTimeout(18500); // Complete the 35 second segment
    
    // ═══════════════════════════════════════════════════════════════
    // SEGMENT 5: CATEGORY DETAILS (1:26 - 1:41)
    // Scrolling through category insights
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📹 SEGMENT 5: Category Details (1:26 - 1:41)');
    console.log('   Screen: Scrolling through category insights');
    
    // Continue scrolling through category content
    await smoothScroll(page, 400, 3000);
    await page.waitForTimeout(2000);
    
    await smoothScroll(page, 300, 2500);
    await page.waitForTimeout(2000);
    
    // Hover over insights
    await hoverElement(page, '.recharts-wrapper', 2000);
    
    await page.waitForTimeout(3500); // Complete 15 second segment
    
    // ═══════════════════════════════════════════════════════════════
    // SEGMENT 6: GEOGRAPHIC STRATEGY (1:41 - 2:11)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📹 SEGMENT 6: Geographic Strategy (1:41 - 2:11)');
    console.log('   Screen: Geography tab loads');
    
    // Scroll back to top
    await scrollToTop(page, 1000);
    
    await clickTab(page, 'Geography');
    await page.waitForTimeout(2000); // Let map load
    
    // Let the map render fully
    await page.waitForTimeout(3000);
    
    // Hover over map regions
    const mapCanvas = await page.$('svg.rsm-svg, .rsm-geography, canvas');
    if (mapCanvas) {
      const box = await mapCanvas.boundingBox();
      if (box) {
        // Move across the map to show interactivity
        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4, { steps: 30 });
        await page.waitForTimeout(1500);
        
        await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 40 });
        await page.waitForTimeout(1500);
        
        await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3, { steps: 30 });
        await page.waitForTimeout(1500);
      }
    }
    
    await page.waitForTimeout(20000); // Complete the 30 second segment
    
    // ═══════════════════════════════════════════════════════════════
    // SEGMENT 7: GEOGRAPHIC PATTERNS (2:11 - 2:26)
    // Interacting with geographic visualizations
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📹 SEGMENT 7: Geographic Patterns (2:11 - 2:26)');
    console.log('   Screen: Interacting with geographic visualizations');
    
    // Scroll to see geographic data tables/charts below map
    await smoothScroll(page, 400, 3000);
    await page.waitForTimeout(2000);
    
    // Hover over data points
    await hoverElement(page, '.recharts-bar-rectangle', 1500);
    
    // Continue exploring
    await smoothScroll(page, 300, 2500);
    
    await page.waitForTimeout(6000); // Complete 15 second segment
    
    // ═══════════════════════════════════════════════════════════════
    // SEGMENT 8: SKILLS ANALYSIS (2:26 - 2:46)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📹 SEGMENT 8: Skills Analysis (2:26 - 2:46)');
    console.log('   Screen: Skills tab loads');
    
    // Scroll back to top
    await scrollToTop(page, 1000);
    
    await clickTab(page, 'Skills');
    await page.waitForTimeout(2000); // Let content load
    
    // Explore skills visualizations
    await hoverElement(page, '.recharts-wrapper', 2000);
    
    // Scroll through skills content
    await smoothScroll(page, 350, 3000);
    await page.waitForTimeout(2000);
    
    await hoverElement(page, '.recharts-bar-rectangle', 1500);
    
    await page.waitForTimeout(8500); // Complete 20 second segment
    
    // ═══════════════════════════════════════════════════════════════
    // SEGMENT 9: OPERATIONAL INTELLIGENCE (2:46 - 3:06)
    // Jobs browser tab
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📹 SEGMENT 9: Jobs Browser (2:46 - 3:06)');
    console.log('   Screen: Job Browser tab');
    
    // Scroll back to top
    await scrollToTop(page, 1000);
    
    await clickTab(page, 'Job Browser');
    await page.waitForTimeout(2000); // Let job list load
    
    // Scroll through job listings
    await smoothScroll(page, 300, 2500);
    await page.waitForTimeout(2000);
    
    // Hover over a job card if visible
    const jobCard = await page.$('[class*="job"], [class*="card"], tr');
    if (jobCard) {
      await hoverElement(page, '[class*="job"], [class*="card"], tr', 2000);
    }
    
    // Continue scrolling
    await smoothScroll(page, 300, 2500);
    
    await page.waitForTimeout(9000); // Complete 20 second segment
    
    // ═══════════════════════════════════════════════════════════════
    // SEGMENT 10: CLOSING (3:06 - 3:16)
    // Return to Overview
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📹 SEGMENT 10: Closing (3:06 - 3:16)');
    console.log('   Screen: Return to Overview');
    
    // Scroll back to top
    await scrollToTop(page, 1000);
    
    await clickTab(page, 'Intelligence');
    await page.waitForTimeout(2000);
    
    // Pan across the overview
    await page.waitForTimeout(7000); // Complete 10 second segment
    
    // ═══════════════════════════════════════════════════════════════
    // SEGMENT 11: FINAL MESSAGE (3:16 - 3:24)
    // Final shot on Overview
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📹 SEGMENT 11: Final Message (3:16 - 3:24)');
    console.log('   Screen: Overview - Final view');
    
    // Hold on the final view
    await page.waitForTimeout(8000);
    
    // ═══════════════════════════════════════════════════════════════
    // DEMO COMPLETE
    // ═══════════════════════════════════════════════════════════════
    console.log('\n' + '='.repeat(50));
    console.log('🎬 Demo walkthrough complete!');
    console.log('   Total duration: ~3 minutes 24 seconds');
    console.log('='.repeat(50));
    
    // Keep browser open for a moment at the end
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Error during demo:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the demo
runDemo().catch(console.error);





