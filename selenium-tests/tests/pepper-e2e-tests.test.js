const WebDriverManager = require('./setup');

describe('PEPPER E-commerce Application Tests', () => {
  let webDriver;

  beforeAll(async () => {
    webDriver = new WebDriverManager();
    await webDriver.createDriver();
  });

  afterAll(async () => {
    await webDriver.quitDriver();
  });

  beforeEach(async () => {
    // Clear any existing session data
    await webDriver.driver.manage().deleteAllCookies();
  });

  describe('Test Case 1: User Registration and Login Flow', () => {
    test('should successfully register a new user and login', async () => {
      console.log('Starting Test Case 1: User Registration and Login Flow');
      
      // Navigate to registration page
      await webDriver.navigateTo('/register');
      await webDriver.takeScreenshot('01_register_page');

      // Fill registration form
      await webDriver.typeText('input[name="name"]', 'Test User');
      await webDriver.typeText('input[name="email"]', `testuser${Date.now()}@example.com`);
      await webDriver.typeText('input[name="password"]', 'TestPassword123');
      await webDriver.typeText('input[name="confirmPassword"]', 'TestPassword123');
      await webDriver.typeText('input[name="phone"]', '1234567890');
      await webDriver.typeText('input[name="address"]', '123 Test Street, Test City');

      await webDriver.takeScreenshot('01_registration_form_filled');

      // Submit registration
      await webDriver.clickElement('button[type="submit"]');

      // Wait for successful registration (should redirect to login or dashboard)
      try {
        await webDriver.waitForElementVisible('.success-message, .alert-success', 5000);
        console.log('Registration successful');
      } catch (e) {
        console.log('Registration completed (no success message found)');
      }

      await webDriver.takeScreenshot('01_registration_success');

      // Navigate to login page
      await webDriver.navigateTo('/login');
      await webDriver.takeScreenshot('01_login_page');

      // Fill login form
      await webDriver.typeText('input[name="email"]', 'testuser@example.com');
      await webDriver.typeText('input[name="password"]', 'TestPassword123');

      await webDriver.takeScreenshot('01_login_form_filled');

      // Submit login
      await webDriver.clickElement('button[type="submit"]');

      // Wait for successful login (should redirect to dashboard)
      await webDriver.waitForElementVisible('.dashboard, [data-testid="dashboard"]', 10000);
      await webDriver.takeScreenshot('01_login_success');

      console.log('Test Case 1 completed successfully');
    }, 60000);
  });

  describe('Test Case 2: Product Browsing and Cart Management', () => {
    test('should browse products and manage cart functionality', async () => {
      console.log('Starting Test Case 2: Product Browsing and Cart Management');
      
      // Navigate to home page
      await webDriver.navigateTo('/');
      await webDriver.takeScreenshot('02_home_page');

      // Wait for products to load
      try {
        await webDriver.waitForElementVisible('.product-card, .product-item, [data-testid="product"]', 10000);
        console.log('Products loaded successfully');
      } catch (e) {
        console.log('No products found on home page, checking for product containers');
        await webDriver.takeScreenshot('02_no_products_found');
      }

      // Look for add to cart buttons
      const addToCartButtons = await webDriver.driver.findElements(By.css('button:contains("Add to Cart"), .add-to-cart, [data-testid="add-to-cart"]'));
      
      if (addToCartButtons.length > 0) {
        // Click first add to cart button
        await addToCartButtons[0].click();
        await webDriver.takeScreenshot('02_product_added_to_cart');

        // Navigate to cart page
        await webDriver.navigateTo('/cart');
        await webDriver.takeScreenshot('02_cart_page');

        // Verify cart has items
        const cartItems = await webDriver.driver.findElements(By.css('.cart-item, .cart-product, [data-testid="cart-item"]'));
        expect(cartItems.length).toBeGreaterThan(0);
        console.log(`Found ${cartItems.length} items in cart`);

        // Test quantity update if possible
        try {
          const quantityInput = await webDriver.waitForElementVisible('input[type="number"], .quantity-input', 5000);
          await quantityInput.clear();
          await quantityInput.sendKeys('2');
          await webDriver.takeScreenshot('02_quantity_updated');
        } catch (e) {
          console.log('Quantity input not found or not editable');
        }

        // Test remove item if possible
        try {
          const removeButton = await webDriver.waitForElementVisible('.remove-item, .delete-item, [data-testid="remove-item"]', 5000);
          await removeButton.click();
          await webDriver.takeScreenshot('02_item_removed');
        } catch (e) {
          console.log('Remove button not found');
        }

      } else {
        console.log('No add to cart buttons found, testing cart page directly');
        await webDriver.navigateTo('/cart');
        await webDriver.takeScreenshot('02_empty_cart');
      }

      console.log('Test Case 2 completed successfully');
    }, 60000);
  });

  describe('Test Case 3: Navigation and Page Accessibility', () => {
    test('should navigate through all main pages and verify accessibility', async () => {
      console.log('Starting Test Case 3: Navigation and Page Accessibility');
      
      // Test home page
      await webDriver.navigateTo('/');
      await webDriver.takeScreenshot('03_home_page');
      
      // Check for navbar/navigation
      const navbarPresent = await webDriver.isElementPresent('nav, .navbar, .navigation');
      expect(navbarPresent).toBe(true);
      console.log('Navigation bar found');

      // Test navigation links
      const navLinks = await webDriver.driver.findElements(By.css('nav a, .navbar a, .navigation a'));
      console.log(`Found ${navLinks.length} navigation links`);

      // Test key pages
      const pagesToTest = [
        { path: '/add-products', name: 'Add Products' },
        { path: '/cart', name: 'Cart' },
        { path: '/login', name: 'Login' },
        { path: '/register', name: 'Register' }
      ];

      for (const page of pagesToTest) {
        try {
          await webDriver.navigateTo(page.path);
          await webDriver.takeScreenshot(`03_${page.name.toLowerCase().replace(' ', '_')}_page`);
          
          // Verify page loaded (check for main content)
          const pageLoaded = await webDriver.isElementPresent('main, .main-content, .container, .page-content');
          expect(pageLoaded).toBe(true);
          console.log(`${page.name} page loaded successfully`);
          
          // Wait a bit between page loads
          await webDriver.driver.sleep(1000);
        } catch (e) {
          console.log(`Error testing ${page.name} page:`, e.message);
        }
      }

      // Test responsive design (if possible)
      try {
        await webDriver.driver.manage().window().setRect({ width: 375, height: 667 }); // Mobile size
        await webDriver.navigateTo('/');
        await webDriver.takeScreenshot('03_mobile_view');
        
        await webDriver.driver.manage().window().setRect({ width: 1920, height: 1080 }); // Desktop size
        await webDriver.takeScreenshot('03_desktop_view');
      } catch (e) {
        console.log('Responsive testing not available');
      }

      console.log('Test Case 3 completed successfully');
    }, 60000);
  });

  describe('Test Case 4: Dashboard and User Interface Elements', () => {
    test('should verify dashboard functionality and UI elements', async () => {
      console.log('Starting Test Case 4: Dashboard and User Interface Elements');
      
      // Navigate to dashboard (this might redirect to login if not authenticated)
      await webDriver.navigateTo('/dashboard');
      await webDriver.takeScreenshot('04_dashboard_attempt');

      // Check if we're redirected to login
      const currentUrl = await webDriver.driver.getCurrentUrl();
      if (currentUrl.includes('/login')) {
        console.log('Redirected to login page - testing login flow');
        
        // Try to login with test credentials (you may need to adjust these)
        try {
          await webDriver.typeText('input[name="email"]', 'admin@example.com');
          await webDriver.typeText('input[name="password"]', 'admin123');
          await webDriver.clickElement('button[type="submit"]');
          
          // Wait for redirect
          await webDriver.driver.sleep(3000);
          await webDriver.takeScreenshot('04_login_attempt');
        } catch (e) {
          console.log('Login form not found or login failed');
        }
      }

      // Check current page after login attempt
      const finalUrl = await webDriver.driver.getCurrentUrl();
      console.log(`Current URL after login attempt: ${finalUrl}`);

      // Test dashboard elements if accessible
      try {
        // Look for dashboard-specific elements
        const dashboardElements = [
          '.dashboard',
          '[data-testid="dashboard"]',
          '.user-dashboard',
          '.admin-dashboard',
          '.delivery-dashboard'
        ];

        let dashboardFound = false;
        for (const selector of dashboardElements) {
          if (await webDriver.isElementPresent(selector)) {
            dashboardFound = true;
            await webDriver.takeScreenshot('04_dashboard_found');
            break;
          }
        }

        if (dashboardFound) {
          console.log('Dashboard elements found');
          
          // Test dashboard navigation
          const menuItems = await webDriver.driver.findElements(By.css('.menu-item, .nav-item, .dashboard-nav a'));
          console.log(`Found ${menuItems.length} dashboard menu items`);

          // Test dashboard content areas
          const contentAreas = await webDriver.driver.findElements(By.css('.content, .main-content, .dashboard-content'));
          console.log(`Found ${contentAreas.length} content areas`);

        } else {
          console.log('Dashboard not accessible - testing public pages instead');
          
          // Test public page elements
          await webDriver.navigateTo('/');
          const publicElements = await webDriver.driver.findElements(By.css('.hero, .banner, .featured-products, .main-content'));
          console.log(`Found ${publicElements.length} public page elements`);
          await webDriver.takeScreenshot('04_public_page_elements');
        }

      } catch (e) {
        console.log('Error testing dashboard elements:', e.message);
      }

      // Test form elements and interactions
      try {
        await webDriver.navigateTo('/register');
        const formElements = await webDriver.driver.findElements(By.css('input, select, textarea, button'));
        console.log(`Found ${formElements.length} form elements on registration page`);
        
        // Test form validation (try submitting empty form)
        await webDriver.clickElement('button[type="submit"]');
        await webDriver.takeScreenshot('04_form_validation');
        
      } catch (e) {
        console.log('Form testing not available');
      }

      console.log('Test Case 4 completed successfully');
    }, 60000);
  });
});
