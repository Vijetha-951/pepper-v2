# PEPPER Selenium Testing Guide

This directory contains comprehensive Selenium tests for the PEPPER e-commerce application. The tests are designed to run independently without affecting your main project.

## Test Structure

### Test Cases Included:

1. **User Registration and Login Flow**
   - Tests user registration process
   - Verifies login functionality
   - Ensures proper redirects after authentication

2. **Product Browsing and Cart Management**
   - Tests product display on home page
   - Verifies add to cart functionality
   - Tests cart page interactions
   - Tests quantity updates and item removal

3. **Navigation and Page Accessibility**
   - Tests all main navigation links
   - Verifies page loading and accessibility
   - Tests responsive design elements
   - Ensures proper page structure

4. **Dashboard and User Interface Elements**
   - Tests dashboard functionality
   - Verifies UI element presence
   - Tests form interactions and validation
   - Ensures proper user interface behavior

## Setup Instructions

### Prerequisites
- Node.js installed
- Chrome or Firefox browser
- Your PEPPER application running on localhost:3000

### Installation

1. Navigate to the selenium-tests directory:
```bash
cd selenium-tests
```

2. Install dependencies:
```bash
npm install
```

### Running Tests

#### Run all tests:
```bash
npm test
```

#### Run tests in headless mode:
```bash
npm run test:headless
```

#### Run tests with specific browser:
```bash
npm run test:chrome
npm run test:firefox
```

#### Run tests in watch mode:
```bash
npm run test:watch
```

## Configuration

### Environment Variables

You can customize test behavior using environment variables:

- `BASE_URL`: Base URL of your application (default: http://localhost:3000)
- `BROWSER`: Browser to use for testing (chrome/firefox, default: chrome)
- `HEADLESS`: Run browser in headless mode (true/false, default: false)

Example:
```bash
BASE_URL=http://localhost:3000 BROWSER=chrome HEADLESS=true npm test
```

### Test Configuration

The tests are configured in `package.json` with:
- 30-second timeout per test
- Screenshots saved automatically
- Detailed logging for debugging

## Test Features

### Screenshots
- Automatic screenshots are taken at key test points
- Screenshots are saved in `tests/screenshots/` directory
- Each screenshot is timestamped for easy identification

### Error Handling
- Tests gracefully handle missing elements
- Comprehensive error logging
- Tests continue even if some elements are not found

### Cross-Browser Support
- Chrome and Firefox support
- Headless mode for CI/CD environments
- Responsive design testing

## Test Results

After running tests, you'll see:
- Detailed console output for each test step
- Screenshots of test progress
- Pass/fail status for each test case
- Summary of test results

## Troubleshooting

### Common Issues:

1. **Application not running**: Ensure your PEPPER app is running on localhost:3000
2. **Browser driver issues**: Make sure ChromeDriver/GeckoDriver are properly installed
3. **Element not found**: Check if your application structure matches expected selectors
4. **Timeout errors**: Increase timeout values in setup.js if needed

### Debug Mode:

Run tests with detailed logging:
```bash
DEBUG=true npm test
```

## Customization

### Adding New Tests

1. Create a new test file in `tests/` directory
2. Follow the existing test structure
3. Use the WebDriverManager class for consistent browser interactions

### Modifying Selectors

If your application uses different CSS selectors, update them in the test files:
- Look for CSS selectors in test files
- Update them to match your application's structure
- Test selectors individually before running full test suite

## Integration with CI/CD

These tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Selenium Tests
  run: |
    cd selenium-tests
    npm install
    npm run test:headless
```

## Support

The tests are designed to be robust and handle various application states. If you encounter issues:

1. Check the screenshots in `tests/screenshots/`
2. Review the console output for specific error messages
3. Verify your application is running and accessible
4. Ensure all required dependencies are installed

## Notes

- Tests are designed to run independently
- No modifications to your main project are required
- Tests can be run multiple times safely
- Screenshots help with debugging and verification
