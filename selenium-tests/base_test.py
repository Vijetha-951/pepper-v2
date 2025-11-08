import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from config import Config

class BaseTest:
    """Base test class with common functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup WebDriver before each test"""
        self.driver = None
        self.wait = None
        self.actions = None
        self.screenshot_counter = 0
        
        self._create_driver()
        self.wait = WebDriverWait(self.driver, Config.IMPLICIT_WAIT)
        self.actions = ActionChains(self.driver)
        
        yield
        
        self._quit_driver()
    
    def _create_driver(self):
        """Create WebDriver instance"""
        try:
            if Config.BROWSER.lower() == "chrome":
                options = ChromeOptions()
                if Config.HEADLESS:
                    options.add_argument("--headless")
                options.add_argument("--no-sandbox")
                options.add_argument("--disable-dev-shm-usage")
                options.add_argument("--disable-gpu")
                options.add_argument("--window-size=1920,1080")
                options.add_argument("--disable-web-security")
                options.add_argument("--allow-running-insecure-content")
                
                self.driver = webdriver.Chrome(options=options)
            else:
                options = FirefoxOptions()
                if Config.HEADLESS:
                    options.add_argument("--headless")
                
                self.driver = webdriver.Firefox(options=options)
            
            self.driver.set_page_load_timeout(Config.PAGE_LOAD_TIMEOUT)
            self.driver.set_script_timeout(Config.SCRIPT_TIMEOUT)
            self.driver.implicitly_wait(Config.IMPLICIT_WAIT)
            
            print(f"✅ WebDriver initialized: {Config.BROWSER}")
        except Exception as e:
            print(f"❌ Failed to initialize WebDriver: {e}")
            raise
    
    def _quit_driver(self):
        """Close WebDriver"""
        if self.driver:
            try:
                self.driver.quit()
                print("✅ WebDriver closed")
            except:
                pass
    
    def wait_for_element(self, by, value, timeout=None):
        """Wait for element to be present"""
        if timeout is None:
            timeout = Config.IMPLICIT_WAIT
        try:
            wait = WebDriverWait(self.driver, timeout)
            element = wait.until(EC.presence_of_element_located((by, value)))
            return element
        except TimeoutException:
            raise TimeoutException(f"Element not found: {by}={value}")
    
    def wait_for_clickable(self, by, value, timeout=None):
        """Wait for element to be clickable"""
        if timeout is None:
            timeout = Config.IMPLICIT_WAIT
        try:
            wait = WebDriverWait(self.driver, timeout)
            element = wait.until(EC.element_to_be_clickable((by, value)))
            return element
        except TimeoutException:
            raise TimeoutException(f"Element not clickable: {by}={value}")
    
    def wait_for_visible(self, by, value, timeout=None):
        """Wait for element to be visible"""
        if timeout is None:
            timeout = Config.IMPLICIT_WAIT
        try:
            wait = WebDriverWait(self.driver, timeout)
            element = wait.until(EC.visibility_of_element_located((by, value)))
            return element
        except TimeoutException:
            raise TimeoutException(f"Element not visible: {by}={value}")
    
    def safe_click(self, element):
        """Safely click an element"""
        try:
            self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
            time.sleep(0.5)
            element.click()
            return True
        except Exception as e:
            print(f"⚠️  Click failed, trying JavaScript click: {e}")
            try:
                self.driver.execute_script("arguments[0].click();", element)
                return True
            except Exception as e2:
                print(f"❌ Click failed: {e2}")
                raise
    
    def safe_send_keys(self, element, text):
        """Safely send keys to element"""
        try:
            element.clear()
            element.send_keys(text)
            return True
        except Exception as e:
            print(f"❌ Send keys failed: {e}")
            raise
    
    def scroll_to_element(self, element):
        """Scroll element into view"""
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
        time.sleep(0.5)
    
    def take_screenshot(self, name="screenshot"):
        """Take and save screenshot"""
        try:
            if not os.path.exists(Config.SCREENSHOT_DIR):
                os.makedirs(Config.SCREENSHOT_DIR, exist_ok=True)
            
            timestamp = int(time.time() * 1000)
            filename = f"{name}_{timestamp}.png"
            filepath = os.path.join(Config.SCREENSHOT_DIR, filename)
            
            self.driver.save_screenshot(filepath)
            print(f"📸 Screenshot saved: selenium-tests/screenshots/{filename}")
            return filepath
        except Exception as e:
            print(f"⚠️  Screenshot failed: {e}")
            return None
    
    def get_current_url(self):
        """Get current URL"""
        return self.driver.current_url
    
    def navigate_to(self, path=""):
        """Navigate to URL"""
        url = f"{Config.BASE_URL}{path}"
        self.driver.get(url)
        time.sleep(1)
        return url
    
    def find_element(self, by, value):
        """Find element"""
        try:
            return self.driver.find_element(by, value)
        except NoSuchElementException:
            return None
    
    def find_elements(self, by, value):
        """Find multiple elements"""
        return self.driver.find_elements(by, value)
    
    def element_exists(self, by, value):
        """Check if element exists"""
        try:
            self.driver.find_element(by, value)
            return True
        except NoSuchElementException:
            return False
    
    def get_element_text(self, element):
        """Get element text"""
        return element.text if element else ""
    
    def switch_to_alert_and_accept(self):
        """Switch to alert and accept"""
        try:
            alert = self.wait.until(EC.alert_is_present())
            alert.accept()
            return True
        except:
            return False
    
    def wait_for_url_contains(self, text, timeout=10):
        """Wait for URL to contain text"""
        wait = WebDriverWait(self.driver, timeout)
        wait.until(lambda driver: text in driver.current_url)
