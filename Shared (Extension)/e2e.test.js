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

describe('Wikipedia tests', () => {
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
    await page.goto('https://en.wikipedia.org/wiki/Main_Page');
    await page.keyboard.press('g');
  }, 10000);

  afterAll(async () => {
    // Tear down the browser
    await browser.close();
  });

  it('Tests that re is the key for read tab', async () => {
    // const f = await page.$("[id='ca-view'] .Keys-Character")
    // obtain text
    const text = await page.evaluate(() => Array.from(document.querySelectorAll("[id='ca-view'] .Keys-Character"), (element) => element.textContent).join(''));
    expect(text).toBe('Re');
  });
});
