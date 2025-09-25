const { chromium } = require('playwright');

async function testConsoleErrors() {
  console.log('🔍 Testing console errors on admin products page...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  const consoleMessages = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text
    });

    if (msg.type() === 'error') {
      console.log('❌ Console Error:', text);
      errors.push(text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('💥 Page Error:', error.message);
    errors.push(error.message);
  });

  try {
    await page.goto('http://localhost:3000/admin/products', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for page to be fully loaded
    await page.waitForTimeout(3000);

    console.log('\n📊 RESULTS:');
    console.log('===========');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Total errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ No errors found!');
    }

    // Check for specific Pinia/EventEmitter related messages
    const relevantMessages = consoleMessages.filter(msg =>
      msg.text.includes('Pinia') ||
      msg.text.includes('useEventEmitter') ||
      msg.text.includes('globalNotifications') ||
      msg.text.includes('ReferenceError') ||
      msg.text.includes('TypeError')
    );

    if (relevantMessages.length > 0) {
      console.log('\n🔍 RELEVANT MESSAGES:');
      relevantMessages.forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
      });
    }

    return { errors, consoleMessages, relevantMessages };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { errors: [error.message], consoleMessages: [], relevantMessages: [] };
  } finally {
    await browser.close();
  }
}

testConsoleErrors()
  .then(results => {
    if (results.errors.length > 0) {
      console.log('\n❌ Test completed with errors');
      process.exit(1);
    } else {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });