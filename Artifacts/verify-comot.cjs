const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🚀 Starting COMOT Multi-Page SDLC Verification...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport to mobile to test responsiveness
  console.log('📱 Testing Mobile Responsiveness Viewport (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  
  // ==================== PHASE 1: DASHBOARD VERIFICATION ====================
  console.log('🌐 Navigating to COMOT Live VPS Dashboard...');
  await page.goto('https://comot.simpel.fun/app', { waitUntil: 'networkidle' });
  
  // Assert Title
  const dashboardTitle = await page.title();
  console.log(`📋 Dashboard Title: "${dashboardTitle}"`);
  if (!dashboardTitle.includes('COMOT')) {
    throw new Error('Verification Failed: Dashboard title does not contain "COMOT"');
  }
  
  // Assert Expert Advisor component exists
  console.log('🔎 Checking if COMOT Procurement Expert Advisor is visible...');
  const expertAdvisor = await page.locator('.expert-advisor-container');
  const count = await expertAdvisor.count();
  if (count === 0) {
    throw new Error('Verification Failed: COMOT Procurement Expert Advisor element not found!');
  }
  console.log('✅ COMOT Procurement Expert Advisor is verified in DOM.');
  
  // Verify that the body has our new radial gradient style (assert no glow divs)
  console.log('🔎 Checking if Gaussian ambient glow divs have been successfully removed...');
  const glowCount = await page.locator('.glow').count();
  if (glowCount > 0) {
    throw new Error('Verification Failed: Gaussian blur glow divs are still present in DOM!');
  }
  console.log('✅ Verified: All CPU/GPU-heavy glow divs have been completely removed.');
  
  // Capture a screenshot of the optimized dashboard
  const dashboardScreenshotPath = '/Users/aditif/.gemini/antigravity-ide/brain/a039b17b-a3ec-4ea4-b911-0bef330207f4/optimized_dashboard_mobile.png';
  console.log(`📸 Capturing mobile responsive dashboard screenshot to: ${dashboardScreenshotPath}`);
  await page.screenshot({ path: dashboardScreenshotPath });

  // ==================== PHASE 2: LANDING/PITCH DECK VERIFICATION ====================
  console.log('\n🌐 Navigating to COMOT Live Presentation Landing Page...');
  await page.goto('https://comot.simpel.fun', { waitUntil: 'networkidle' });
  
  // Assert Landing Page Title
  const landingTitle = await page.title();
  console.log(`📋 Presentation Title: "${landingTitle}"`);
  if (!landingTitle.includes('COMOT') || !landingTitle.includes('Profit')) {
    throw new Error('Verification Failed: Presentation title does not match strategic requirements');
  }
  
  // Assert Slide 1 is active initially
  const slide1 = await page.locator('#slide-1');
  const isSlide1Active = await slide1.evaluate(el => el.classList.contains('active'));
  if (!isSlide1Active) {
    throw new Error('Verification Failed: Slide 1 should be active by default');
  }
  console.log('✅ Slide 1 (Hook & Identity) is active by default.');
  
  // Click "Lanjut" to transition to Slide 2 (About Us)
  console.log('👉 Clicking "Lanjut" to switch to Slide 2 (About Us)...');
  await page.click('#btn-next');
  await page.waitForTimeout(500); // Wait for transition
  
  const isSlide1ActivePost = await slide1.evaluate(el => el.classList.contains('active'));
  const slide2 = await page.locator('#slide-2');
  const isSlide2Active = await slide2.evaluate(el => el.classList.contains('active'));
  
  if (isSlide1ActivePost || !isSlide2Active) {
    throw new Error('Verification Failed: Slide transition to Slide 2 (About Us) failed');
  }
  console.log('✅ Slide 2 (About Us) successfully transition-verified.');

  // Click "Lanjut" again to transition to Slide 3 (The Problem)
  console.log('👉 Clicking "Lanjut" to switch to Slide 3 (The Problem)...');
  await page.click('#btn-next');
  await page.waitForTimeout(500); // Wait for transition

  const isSlide2ActivePost = await slide2.evaluate(el => el.classList.contains('active'));
  const slide3 = await page.locator('#slide-3');
  const isSlide3Active = await slide3.evaluate(el => el.classList.contains('active'));

  if (isSlide2ActivePost || !isSlide3Active) {
    throw new Error('Verification Failed: Slide transition to Slide 3 (The Problem) failed');
  }
  console.log('✅ Slide 3 (The Problem & Calculator) successfully transition-verified.');
  
  // Verify Calculator Elements exist
  const slider = await page.locator('#project-slider');
  if (await slider.count() === 0) {
    throw new Error('Verification Failed: Interactive range slider not found on Slide 3');
  }
  console.log('✅ Interactive Cost Calculator slider is present in DOM.');
  
  // Capture a screenshot of the landing page
  const landingScreenshotPath = '/Users/aditif/.gemini/antigravity-ide/brain/a039b17b-a3ec-4ea4-b911-0bef330207f4/optimized_landing_mobile.png';
  console.log(`📸 Capturing mobile responsive presentation screenshot to: ${landingScreenshotPath}`);
  await page.screenshot({ path: landingScreenshotPath });
  
  console.log('🎉 ALL COMOT PLATFORMS SDLC VERIFICATION COMPLETED SUCCESSFULLY!');
  await browser.close();
})().catch(err => {
  console.error('❌ SDLC Verification Failed:', err);
  process.exit(1);
});
