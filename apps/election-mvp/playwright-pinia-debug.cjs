const { chromium } = require('playwright');

async function debugPiniaError() {
  console.log('🔍 Starting Pinia error investigation...');

  const browser = await chromium.launch({
    headless: false,  // Show browser for debugging
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages and errors
  const consoleLogs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });

    if (msg.type() === 'error') {
      console.log('❌ Console Error:', text);
    } else if (text.includes('Pinia') || text.includes('useEventEmitter')) {
      console.log('🔍 Pinia/EventEmitter related:', text);
    }
  });

  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log('💥 Page Error:', error.message);
    console.log('Stack:', error.stack);
  });

  // Monitor network requests for any failed API calls
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`🌐 Failed Request: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('🚀 Navigating to admin products page...');
    await page.goto('http://localhost:3000/admin/products', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any async operations to complete
    await page.waitForTimeout(3000);

    // Take screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({
      path: '/Users/logansery/Documents/ns2po-w/apps/election-mvp/pinia-error-screenshot.png',
      fullPage: true
    });

    // Check if page loaded successfully
    const title = await page.title();
    console.log('📄 Page title:', title);

    // Look for specific error indicators in the DOM
    const errorElements = await page.$$eval('[data-testid*="error"], .error, [class*="error"]',
      elements => elements.map(el => ({
        tagName: el.tagName,
        className: el.className,
        textContent: el.textContent?.substring(0, 200)
      }))
    ).catch(() => []);

    if (errorElements.length > 0) {
      console.log('🔍 Found error elements in DOM:', errorElements);
    }

    // Check for Pinia store status
    const piniaStores = await page.evaluate(() => {
      if (window.__PINIA__) {
        return Object.keys(window.__PINIA__.state.value || {});
      }
      return null;
    }).catch(() => null);

    if (piniaStores) {
      console.log('🏪 Available Pinia stores:', piniaStores);
    } else {
      console.log('❌ Pinia not found or not initialized');
    }

    // Summary
    console.log('\n📊 INVESTIGATION SUMMARY:');
    console.log('========================');
    console.log(`Total console messages: ${consoleLogs.length}`);
    console.log(`Total page errors: ${errors.length}`);
    console.log(`Error elements found: ${errorElements.length}`);

    // Filter important messages
    const importantLogs = consoleLogs.filter(log =>
      log.text.includes('Pinia') ||
      log.text.includes('useEventEmitter') ||
      log.text.includes('store') ||
      log.type === 'error'
    );

    if (importantLogs.length > 0) {
      console.log('\n🔍 RELEVANT CONSOLE MESSAGES:');
      importantLogs.forEach((log, index) => {
        console.log(`${index + 1}. [${log.type.toUpperCase()}] ${log.text}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n💥 PAGE ERRORS:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
        if (error.stack) {
          console.log(`   Stack: ${error.stack.split('\n')[0]}`);
        }
      });
    }

    return {
      consoleLogs,
      errors,
      errorElements,
      piniaStores,
      pageTitle: title
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({
      path: '/Users/logansery/Documents/ns2po-w/apps/election-mvp/pinia-error-failed.png'
    });
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the investigation
debugPiniaError()
  .then(results => {
    console.log('\n✅ Investigation completed successfully');

    // Write detailed results to file
    const fs = require('fs');
    fs.writeFileSync(
      '/Users/logansery/Documents/ns2po-w/apps/election-mvp/pinia-debug-results.json',
      JSON.stringify(results, null, 2)
    );
    console.log('📝 Detailed results saved to pinia-debug-results.json');
  })
  .catch(error => {
    console.error('❌ Investigation failed:', error);
    process.exit(1);
  });