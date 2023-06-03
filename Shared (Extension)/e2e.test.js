/*
* @jest-environment node
*/

const puppeteer = require('puppeteer'); // import Puppeteer
const path = require('path');

// Path to the actual extension we want to be testing
const pathToExtension = require('path').join(
  path.join(__dirname, 'Resources'),
);

// Tell puppeteer we want to load the web extension
const puppeteerArgs = [
  `--disable-extensions-except=${pathToExtension}`,
  `--load-extension=${pathToExtension}`,
  '--show-component-extension-options',
  '--enable-automation',
];

describe('Local short-keys.html tests', () => {
  let page;
  let browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      slowMo: 250,
      devtools: true,
      args: puppeteerArgs,
    });

    // Creates a new tab
    page = await browser.newPage();

    // navigates to some specific page
    await page.goto(`file://${__dirname}/test-pages/short-keys.html`);
    await page.keyboard.press('g');
  }, 10000);


  afterAll(async () => {
    // Tear down the browser
    await browser.close();
  });

  it('Tests that 1-letter keys can be generated', async () => {
    const firstLinkKey = await page.evaluate(() => Array.from(document.querySelectorAll('#first-anchor .Keys-Character'), (element) => element.textContent).join(''));
    const lastLinkKey = await page.evaluate(() => Array.from(document.querySelectorAll('#last-anchor .Keys-Character'), (element) => element.textContent).join(''));
    expect(firstLinkKey).toBe('A');
    expect(lastLinkKey).toBe('q');
  });
});

describe('Local non-latin-characters.html tests', () => {
  let page;
  let browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 250,
      devtools: true,
      args: puppeteerArgs,
    });

    // Creates a new tab
    page = await browser.newPage();

    // navigates to some specific page
    await page.goto(`file://${__dirname}/test-pages/non-latin-characters.html`);
    await page.keyboard.press('g');
  }, 10000);

  afterAll(async () => {
    // Tear down the browser
    await browser.close();
  });

  it('Tests that non-latin links are treated like images & non-latin searchboxes get latin placeholders.', async () => {
    const nonLatinAnchorsThatAreTetherTargets = await page.evaluate(() => Array.from(document.querySelectorAll('#non-latin-anchor.tether-target')).length);
    expect(nonLatinAnchorsThatAreTetherTargets).toBe(1);

    const nonLatinInputThatAreTetherTargets = await page.evaluate(() => document.querySelector('#non-latin-searchbox').placeholder);
    expect(nonLatinInputThatAreTetherTargets).toMatch(/[A-Za-z0-9_]/);
  });
});

describe('Remote youtube.com tests', () => {
  let page;
  let browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      slowMo: 250,
      devtools: true,
      args: puppeteerArgs,
    });

    // Creates a new tab
    page = await browser.newPage();

    // navigates to some specific page
    await page.goto('https://www.youtube.com/');
    await page.keyboard.press('g');
  }, 10000);

  afterAll(async () => {
    // Tear down the browser
    await browser.close();
  });

  it('Tests site-specific modification ensuring that home page chips arent emptied by keys', async () => {
    const chipTextList = await page.$$eval('yt-chip-cloud-chip-renderer', (a) => a.map((e) => e.innerText));
    // source: https://stackoverflow.com/questions/46377955/puppeteer-page-evaluate-queryselectorall-return-empty-objects
    expect(chipTextList[0]).not.toBe('');
  }, 10000);
});
