# Playwright E2E Testing Suite for PEPPER

This directory contains end-to-end tests for the PEPPER e-commerce platform using Playwright.

## Test Files

- **home.spec.js** - Tests for home page and navigation
- **auth.spec.js** - Tests for login/register authentication flows
- **products.spec.js** - Tests for product browsing, search, and filtering
- **cart.spec.js** - Tests for shopping cart functionality
- **disease-detection.spec.js** - Tests for ML-based pepper disease detection
- **videos.spec.js** - Tests for video features and video management
- **admin.spec.js** - Tests for admin dashboard and management features
- **api.spec.js** - Tests for backend API endpoints

## Prerequisites

- Node.js installed
- Frontend and Backend servers should be running (or use the config to auto-start)
- Playwright browsers installed (`npx playwright install`)

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests with UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in Chrome only
```bash
npm run test:chrome
```

### Debug tests
```bash
npm run test:debug
```

### View test report
```bash
npm run test:report
```

### Run specific test file
```bash
npx playwright test e2e-tests/home.spec.js
```

### Run tests matching a pattern
```bash
npx playwright test --grep "login"
```

## Test Configuration

The Playwright configuration is in `playwright.config.js` and includes:

- **Test directory**: `e2e-tests/`
- **Base URL**: `http://localhost:3000` (frontend)
- **Backend URL**: `http://localhost:5000`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile testing**: Mobile Chrome, Mobile Safari
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Auto-start servers**: Frontend and backend servers start automatically

## Test Features

### Visual Testing
- Screenshots are captured on test failure
- Videos are recorded for failed tests
- Traces are collected for debugging

### Cross-Browser Testing
Tests run on multiple browsers:
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile viewports

### API Testing
Direct API endpoint testing using Playwright's request context.

## Writing New Tests

1. Create a new file in `e2e-tests/` with `.spec.js` extension
2. Import Playwright test utilities:
   ```javascript
   import { test, expect } from '@playwright/test';
   ```
3. Group related tests using `test.describe()`
4. Write individual tests using `test()`

Example:
```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PEPPER/);
  });
});
```

## Continuous Integration

Tests can be integrated into CI/CD pipelines:
- Set `CI=true` environment variable
- Tests will run in headless mode
- Failed tests will retry automatically

## Troubleshooting

### Servers not starting
If the web servers don't start automatically:
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Then run tests with: `npx playwright test`

### Port conflicts
If ports 3000 or 5000 are in use:
- Update `playwright.config.js` with the correct ports
- Make sure XAMPP or other services aren't using these ports

### Browser installation
If browsers are missing:
```bash
npx playwright install
```

## Test Results

Test results are available in:
- Console output (live during test run)
- HTML report (`playwright-report/` directory)
- JSON report (`test-results/test-results.json`)

View HTML report:
```bash
npx playwright show-report
```

## Best Practices

1. **Keep tests independent** - Each test should be able to run standalone
2. **Use proper locators** - Prefer role-based and text-based locators
3. **Wait for elements** - Use Playwright's auto-waiting features
4. **Clean up after tests** - Reset state if needed
5. **Test real user flows** - Simulate actual user interactions
6. **Keep tests maintainable** - Use page objects for complex pages

## Coverage

Current test coverage includes:
- ✅ Home page and navigation
- ✅ User authentication (login/register)
- ✅ Product browsing and search
- ✅ Shopping cart operations
- ✅ Disease detection ML feature
- ✅ Video management and viewing
- ✅ Admin dashboard features
- ✅ Backend API endpoints
- ✅ Mobile responsiveness

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Generator](https://playwright.dev/docs/codegen) - `npx playwright codegen`
