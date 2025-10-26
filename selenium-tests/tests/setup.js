const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

class WebDriverManager {
  constructor() {
    this.driver = null;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.browser = process.env.BROWSER || 'chrome';
    this.headless = process.env.HEADLESS === 'true';
  }

  async createDriver() {
    let options;
    
    try {
      if (this.browser === 'chrome') {
        options = new chrome.Options();
        if (this.headless) {
          options.addArguments('--headless');
        }
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');
        options.addArguments('--disable-web-security');
        options.addArguments('--allow-running-insecure-content');
      } else if (this.browser === 'firefox') {
        options = new firefox.Options();
        if (this.headless) {
          options.addArguments('--headless');
        }
      }

      this.driver = await new Builder()
        .forBrowser(this.browser)
        .setChromeOptions(options)
        .setFirefoxOptions(options)
        .build();
        
      console.log(`✅ WebDriver created successfully with ${this.browser}`);
    } catch (error) {
      console.log(`❌ Failed to create ${this.browser} driver:`, error.message);
      
      // Try alternative browser
      const alternativeBrowser = this.browser === 'chrome' ? 'firefox' : 'chrome';
      console.log(`🔄 Trying alternative browser: ${alternativeBrowser}`);
      
      try {
        if (alternativeBrowser === 'chrome') {
          options = new chrome.Options();
          options.addArguments('--headless');
          options.addArguments('--no-sandbox');
          options.addArguments('--disable-dev-shm-usage');
          options.addArguments('--disable-gpu');
          options.addArguments('--window-size=1920,1080');
        } else {
          options = new firefox.Options();
          options.addArguments('--headless');
        }
        
        this.driver = await new Builder()
          .forBrowser(alternativeBrowser)
          .setChromeOptions(options)
          .setFirefoxOptions(options)
          .build();
          
        this.browser = alternativeBrowser;
        console.log(`✅ WebDriver created successfully with ${alternativeBrowser}`);
      } catch (altError) {
        console.log(`❌ Failed to create ${alternativeBrowser} driver:`, altError.message);
        throw new Error(`Unable to create WebDriver. Please ensure Chrome or Firefox is installed.`);
      }
    }

    await this.driver.manage().setTimeouts({
      implicit: 10000,
      pageLoad: 30000,
      script: 30000
    });

    return this.driver;
  }

  async quitDriver() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  async navigateTo(path = '') {
    const url = `${this.baseUrl}${path}`;
    await this.driver.get(url);
    await this.driver.wait(until.titleContains('PEPPER'), 10000);
  }

  async waitForElement(selector, timeout = 10000) {
    return await this.driver.wait(until.elementLocated(By.css(selector)), timeout);
  }

  async waitForElementVisible(selector, timeout = 10000) {
    const element = await this.waitForElement(selector, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    return element;
  }

  async waitForElementClickable(selector, timeout = 10000) {
    const element = await this.waitForElement(selector, timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    return element;
  }

  async clickElement(selector) {
    const element = await this.waitForElementClickable(selector);
    await element.click();
  }

  async typeText(selector, text) {
    const element = await this.waitForElementClickable(selector);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(selector) {
    const element = await this.waitForElement(selector);
    return await element.getText();
  }

  async isElementPresent(selector) {
    try {
      await this.driver.findElement(By.css(selector));
      return true;
    } catch (e) {
      return false;
    }
  }

  async waitForText(selector, text, timeout = 10000) {
    await this.driver.wait(async () => {
      try {
        const element = await this.driver.findElement(By.css(selector));
        const elementText = await element.getText();
        return elementText.includes(text);
      } catch (e) {
        return false;
      }
    }, timeout);
  }

  async takeScreenshot(name) {
    const screenshot = await this.driver.takeScreenshot();
    const fs = require('fs');
    const path = require('path');
    const screenshotDir = path.join(__dirname, 'screenshots');
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const filename = `${name}_${Date.now()}.png`;
    const filepath = path.join(screenshotDir, filename);
    fs.writeFileSync(filepath, screenshot, 'base64');
    console.log(`Screenshot saved: ${filepath}`);
    return filepath;
  }
}

module.exports = WebDriverManager;
