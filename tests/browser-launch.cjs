// Shared Playwright launch for browser suites.
// TEST_BROWSER=chromium|firefox|webkit selects the engine; TEST_BROWSER_CHANNEL (e.g. chrome) and TEST_BROWSER_EXECUTABLE
// let local runs use an installed browser when Playwright's pinned build is missing.
const { chromium, firefox, webkit } = require('playwright');

function launchOptions(extra = {}) {
  const options = { headless: true, ...extra };
  if (process.env.TEST_BROWSER_CHANNEL) options.channel = process.env.TEST_BROWSER_CHANNEL;
  if (process.env.TEST_BROWSER_EXECUTABLE) options.executablePath = process.env.TEST_BROWSER_EXECUTABLE;
  return options;
}

function launchBrowser(extra) {
  const kind = process.env.TEST_BROWSER || 'chromium';
  const browser = { chromium, firefox, webkit }[kind];
  if (!browser) throw new Error('Unknown TEST_BROWSER: ' + kind);
  if (kind !== 'chromium' && process.env.TEST_BROWSER_CHANNEL) throw new Error('TEST_BROWSER_CHANNEL requires Chromium');
  return browser.launch(launchOptions(extra));
}

module.exports = { launchBrowser, launchOptions };
