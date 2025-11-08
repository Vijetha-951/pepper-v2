"""
Base test class for PEPPER Selenium tests
"""
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
import config


class BaseTest:
    """Base class for all test cases"""
    
    def setup_method(self):
        """Setup method called before each test"""
        self.driver = None
        self.wait = None
        self.setup_driver()
        
        # Create screenshot directory
        os.makedirs(config.Config.SCREENSHOT_DIR, exist_ok=True)
        os.makedirs(config.Config.REPORTS_DIR, exist_ok=True)
    
    def teardown_method(self):
        """Teardown method called after each test"""
        if self.driver:
            self.driver.quit()
    
    def setup_driver(self):
        """Setup WebDriver with appropriate browser"""
        browser = config.Config.BROWSER.lower()
        headless = config.Config.HEADLESS
        
        # Try Chrome first, fallback to Firefox if Chrome fails
        browsers_to_try = [browser]
        if browser == "chrome":
            browsers_to_try.append("firefox")  # Fallback to Firefox
        
        last_error = None
        for browser_to_try in browsers_to_try:
            try:
                if browser_to_try == "chrome":
                    options = ChromeOptions()
                    if headless:
                        options.add_argument("--headless=new")
                    options.add_argument("--no-sandbox")
                    options.add_argument("--disable-dev-shm-usage")
                    options.add_argument("--disable-gpu")
                    options.add_argument(f"--window-size={config.Config.WINDOW_SIZE[0]},{config.Config.WINDOW_SIZE[1]}")
                    options.add_argument("--disable-web-security")
                    options.add_argument("--allow-running-insecure-content")
                    options.add_experimental_option('excludeSwitches', ['enable-logging'])
                    
                    # Try to use system ChromeDriver first, then webdriver-manager
                    try:
                        # Try without service (uses system PATH)
                        self.driver = webdriver.Chrome(options=options)
                    except:
                        # Fallback to webdriver-manager
                        service = ChromeService(ChromeDriverManager().install())
                        self.driver = webdriver.Chrome(service=service, options=options)
                    
                elif browser_to_try == "firefox":
                    options = FirefoxOptions()
                    if headless:
                        options.add_argument("--headless")
                    
                    # Try to use system GeckoDriver first
                    try:
                        self.driver = webdriver.Firefox(options=options)
                    except:
                        # Fallback to webdriver-manager
                        service = FirefoxService(GeckoDriverManager().install())
                        self.driver = webdriver.Firefox(service=service, options=options)
                else:
                    raise ValueError(f"Unsupported browser: {browser_to_try}")
                
                # Set timeouts
                self.driver.implicitly_wait(config.Config.IMPLICIT_WAIT)
                self.driver.set_page_load_timeout(config.Config.PAGE_LOAD_TIMEOUT)
                
                # Set window size
                try:
                    self.driver.set_window_size(*config.Config.WINDOW_SIZE)
                except:
                    pass  # Ignore window size errors
                
                # Initialize WebDriverWait
                self.wait = WebDriverWait(self.driver, config.Config.EXPLICIT_WAIT)
                
                print(f"WebDriver initialized: {browser_to_try} (headless: {headless})")
                return  # Success!
                
            except Exception as e:
                last_error = e
                print(f"Failed to initialize {browser_to_try}: {str(e)}")
                if browser_to_try == browsers_to_try[-1]:
                    # Last browser to try, raise error
                    raise Exception(f"Failed to initialize any browser. Last error: {str(last_error)}")
                continue
    
    def wait_for_element(self, by, value, timeout=None):
        """Wait for element to be present"""
        if timeout is None:
            timeout = config.Config.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.presence_of_element_located((by, value)))
    
    def wait_for_clickable(self, by, value, timeout=None):
        """Wait for element to be clickable"""
        if timeout is None:
            timeout = config.Config.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.element_to_be_clickable((by, value)))
    
    def wait_for_visible(self, by, value, timeout=None):
        """Wait for element to be visible"""
        if timeout is None:
            timeout = config.Config.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, timeout)
        return wait.until(EC.visibility_of_element_located((by, value)))
    
    def safe_click(self, element):
        """Safely click an element with scrolling"""
        try:
            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
            time.sleep(0.5)
            element.click()
            return True
        except Exception as e:
            print(f"WARNING: Click failed: {e}")
            # Try JavaScript click as fallback
            try:
                self.driver.execute_script("arguments[0].click();", element)
                return True
            except:
                return False
    
    def safe_send_keys(self, element, text):
        """Safely send keys to an element"""
        try:
            element.clear()
            element.send_keys(text)
            return True
        except Exception as e:
            print(f"WARNING: Send keys failed: {e}")
            return False
    
    def scroll_to_element(self, element):
        """Scroll element into view"""
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        time.sleep(0.5)
    
    def take_screenshot(self, name):
        """Take screenshot and save it"""
        try:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"{name}_{timestamp}.png"
            filepath = os.path.join(config.Config.SCREENSHOT_DIR, filename)
            # Ensure directory exists
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            self.driver.save_screenshot(filepath)
            print(f"Screenshot saved: {filepath}")
            return filepath
        except Exception as e:
            print(f"WARNING: Screenshot failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def element_exists(self, by, value, timeout=5):
        """Check if element exists"""
        try:
            self.wait_for_element(by, value, timeout)
            return True
        except TimeoutException:
            return False
    
    def get_element_text(self, by, value, default=""):
        """Get element text safely"""
        try:
            element = self.wait_for_element(by, value, timeout=5)
            return element.text
        except:
            return default
