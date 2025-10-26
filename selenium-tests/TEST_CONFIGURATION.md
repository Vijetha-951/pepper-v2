# PEPPER Selenium Test Configuration

## Test Environment Setup

This configuration ensures that Selenium tests run independently without affecting your main PEPPER project.

### Test Structure
```
selenium-tests/
├── package.json              # Test dependencies and scripts
├── tests/
│   ├── setup.js             # WebDriver manager and utilities
│   ├── pepper-e2e-tests.test.js  # Main test cases
│   └── screenshots/         # Auto-generated test screenshots
├── run-tests.sh             # Linux/Mac test runner
├── run-tests.bat            # Windows test runner
├── setup-check.js           # Environment validation
└── README.md               # Documentation
```

### Test Cases Overview

#### Test Case 1: User Registration and Login Flow
- **Purpose**: Verify user authentication system
- **Coverage**: Registration form, login form, redirects
- **Duration**: ~60 seconds
- **Screenshots**: Registration page, login page, success states

#### Test Case 2: Product Browsing and Cart Management
- **Purpose**: Test e-commerce core functionality
- **Coverage**: Product display, add to cart, cart operations
- **Duration**: ~60 seconds
- **Screenshots**: Home page, cart page, interactions

#### Test Case 3: Navigation and Page Accessibility
- **Purpose**: Ensure proper navigation and page structure
- **Coverage**: All main pages, responsive design, accessibility
- **Duration**: ~60 seconds
- **Screenshots**: Each page tested, mobile/desktop views

#### Test Case 4: Dashboard and User Interface Elements
- **Purpose**: Verify dashboard functionality and UI elements
- **Coverage**: Dashboard access, form interactions, UI components
- **Duration**: ~60 seconds
- **Screenshots**: Dashboard states, form validation, UI elements

### Browser Support
- **Chrome**: Primary browser (default)
- **Firefox**: Alternative browser support
- **Headless Mode**: Available for CI/CD environments

### Configuration Options

#### Environment Variables
```bash
BASE_URL=http://localhost:3000    # Application URL
BROWSER=chrome                    # Browser choice
HEADLESS=true                     # Headless mode
```

#### Test Timeouts
- **Implicit Wait**: 10 seconds
- **Page Load**: 30 seconds
- **Script Timeout**: 30 seconds
- **Test Timeout**: 60 seconds per test case

### Screenshot Strategy
- **Automatic**: Screenshots taken at key test points
- **Naming**: Descriptive names with timestamps
- **Location**: `tests/screenshots/` directory
- **Purpose**: Debugging and verification

### Error Handling
- **Graceful Degradation**: Tests continue if elements not found
- **Comprehensive Logging**: Detailed console output
- **Screenshot Capture**: Visual debugging on failures
- **Non-Destructive**: No impact on main application

### Integration Points
- **CI/CD Ready**: Headless mode support
- **Cross-Platform**: Windows, Linux, Mac support
- **Independent**: No modifications to main project
- **Repeatable**: Can run multiple times safely

### Performance Considerations
- **Parallel Execution**: Tests run sequentially to avoid conflicts
- **Resource Management**: Proper browser cleanup
- **Memory Management**: Driver instances properly closed
- **Timeout Handling**: Prevents hanging tests

### Debugging Features
- **Verbose Logging**: Step-by-step test execution
- **Screenshot Evidence**: Visual proof of test execution
- **Error Context**: Detailed error messages
- **Environment Validation**: Pre-test setup verification

### Maintenance
- **Selector Updates**: Easy to modify CSS selectors
- **Test Addition**: Simple framework for new tests
- **Configuration Changes**: Environment-based customization
- **Version Compatibility**: Works with current Selenium WebDriver

This configuration ensures comprehensive testing coverage while maintaining complete independence from your main PEPPER project.
