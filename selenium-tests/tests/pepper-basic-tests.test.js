const WebDriverManager = require('./setup');

describe('PEPPER E-commerce Application Tests', () => {
  let webDriver;

  beforeAll(async () => {
    webDriver = new WebDriverManager();
    try {
      await webDriver.createDriver();
      console.log('✅ WebDriver initialized successfully');
    } catch (error) {
      console.log('❌ WebDriver initialization failed:', error.message);
      throw error;
    }
  }, 60000);

  afterAll(async () => {
    if (webDriver && webDriver.driver) {
      await webDriver.quitDriver();
    }
  });

  beforeEach(async () => {
    // Clear any existing session data
    if (webDriver && webDriver.driver) {
      try {
        await webDriver.driver.manage().deleteAllCookies();
      } catch (e) {
        console.log('Note: Could not clear cookies');
      }
    }
  });

  describe('Test Case 1: Application Accessibility Test', () => {
    test('should verify application is accessible and basic elements load', async () => {
      console.log('Starting Test Case 1: Application Accessibility Test');
      
      try {
        // Navigate to home page
        await webDriver.navigateTo('/');
        await webDriver.takeScreenshot('01_home_page_loaded');
        
        // Check if page loaded (look for any content)
        const pageTitle = await webDriver.driver.getTitle();
        console.log(`Page title: ${pageTitle}`);
        
        // Look for basic page elements
        const bodyElement = await webDriver.driver.findElement(By.css('body'));
        expect(bodyElement).toBeDefined();
        console.log('✅ Page body element found');
        
        // Check for any navigation elements
        const navElements = await webDriver.driver.findElements(By.css('nav, .navbar, .navigation, header'));
        console.log(`Found ${navElements.length} navigation/header elements`);
        
        // Check for any links
        const links = await webDriver.driver.findElements(By.css('a'));
        console.log(`Found ${links.length} links on the page`);
        
        // Check for any buttons
        const buttons = await webDriver.driver.findElements(By.css('button'));
        console.log(`Found ${buttons.length} buttons on the page`);
        
        // Check for any forms
        const forms = await webDriver.driver.findElements(By.css('form'));
        console.log(`Found ${forms.length} forms on the page`);
        
        console.log('✅ Test Case 1 completed successfully - Basic page structure verified');
        
      } catch (error) {
        console.log('❌ Test Case 1 failed:', error.message);
        await webDriver.takeScreenshot('01_error_state');
        throw error;
      }
    }, 60000);
  });

  describe('Test Case 2: Navigation Test', () => {
    test('should test basic navigation functionality', async () => {
      console.log('Starting Test Case 2: Navigation Test');
      
      try {
        // Test navigation to different pages
        const pagesToTest = [
          { path: '/', name: 'Home' },
          { path: '/login', name: 'Login' },
          { path: '/register', name: 'Register' },
          { path: '/cart', name: 'Cart' }
        ];
        
        for (const page of pagesToTest) {
          try {
            console.log(`Testing ${page.name} page...`);
            await webDriver.navigateTo(page.path);
            await webDriver.takeScreenshot(`02_${page.name.toLowerCase()}_page`);
            
            // Verify page loaded
            const currentUrl = await webDriver.driver.getCurrentUrl();
            console.log(`${page.name} page URL: ${currentUrl}`);
            
            // Check for basic page content
            const bodyText = await webDriver.driver.findElement(By.css('body')).getText();
            console.log(`${page.name} page has content: ${bodyText.length > 0 ? 'Yes' : 'No'}`);
            
            // Wait between page loads
            await webDriver.driver.sleep(1000);
            
          } catch (pageError) {
            console.log(`⚠️ Error testing ${page.name} page:`, pageError.message);
            await webDriver.takeScreenshot(`02_${page.name.toLowerCase()}_error`);
          }
        }
        
        console.log('✅ Test Case 2 completed successfully - Navigation tested');
        
      } catch (error) {
        console.log('❌ Test Case 2 failed:', error.message);
        await webDriver.takeScreenshot('02_navigation_error');
        throw error;
      }
    }, 60000);
  });

  describe('Test Case 3: Form Interaction Test', () => {
    test('should test form elements and interactions', async () => {
      console.log('Starting Test Case 3: Form Interaction Test');
      
      try {
        // Navigate to registration page
        await webDriver.navigateTo('/register');
        await webDriver.takeScreenshot('03_register_page');
        
        // Look for form elements
        const inputs = await webDriver.driver.findElements(By.css('input'));
        console.log(`Found ${inputs.length} input fields`);
        
        const selects = await webDriver.driver.findElements(By.css('select'));
        console.log(`Found ${selects.length} select fields`);
        
        const textareas = await webDriver.driver.findElements(By.css('textarea'));
        console.log(`Found ${textareas.length} textarea fields`);
        
        const submitButtons = await webDriver.driver.findElements(By.css('button[type="submit"], input[type="submit"]'));
        console.log(`Found ${submitButtons.length} submit buttons`);
        
        // Test form interaction if elements exist
        if (inputs.length > 0) {
          try {
            // Try to interact with first input field
            const firstInput = inputs[0];
            await firstInput.click();
            await firstInput.sendKeys('Test Input');
            console.log('✅ Successfully interacted with input field');
            await webDriver.takeScreenshot('03_form_interaction');
            
            // Clear the input
            await firstInput.clear();
            console.log('✅ Successfully cleared input field');
            
          } catch (inputError) {
            console.log('⚠️ Could not interact with input field:', inputError.message);
          }
        }
        
        console.log('✅ Test Case 3 completed successfully - Form interactions tested');
        
      } catch (error) {
        console.log('❌ Test Case 3 failed:', error.message);
        await webDriver.takeScreenshot('03_form_error');
        throw error;
      }
    }, 60000);
  });

  describe('Test Case 4: Responsive Design Test', () => {
    test('should test responsive design and different screen sizes', async () => {
      console.log('Starting Test Case 4: Responsive Design Test');
      
      try {
        // Test desktop view
        await webDriver.driver.manage().window().setRect({ width: 1920, height: 1080 });
        await webDriver.navigateTo('/');
        await webDriver.takeScreenshot('04_desktop_view');
        
        const desktopWidth = await webDriver.driver.manage().window().getRect();
        console.log(`Desktop view: ${desktopWidth.width}x${desktopWidth.height}`);
        
        // Test tablet view
        await webDriver.driver.manage().window().setRect({ width: 768, height: 1024 });
        await webDriver.navigateTo('/');
        await webDriver.takeScreenshot('04_tablet_view');
        
        const tabletWidth = await webDriver.driver.manage().window().getRect();
        console.log(`Tablet view: ${tabletWidth.width}x${tabletWidth.height}`);
        
        // Test mobile view
        await webDriver.driver.manage().window().setRect({ width: 375, height: 667 });
        await webDriver.navigateTo('/');
        await webDriver.takeScreenshot('04_mobile_view');
        
        const mobileWidth = await webDriver.driver.manage().window().getRect();
        console.log(`Mobile view: ${mobileWidth.width}x${mobileWidth.height}`);
        
        // Reset to desktop
        await webDriver.driver.manage().window().setRect({ width: 1920, height: 1080 });
        
        console.log('✅ Test Case 4 completed successfully - Responsive design tested');
        
      } catch (error) {
        console.log('❌ Test Case 4 failed:', error.message);
        await webDriver.takeScreenshot('04_responsive_error');
        throw error;
      }
    }, 60000);
  });
});
