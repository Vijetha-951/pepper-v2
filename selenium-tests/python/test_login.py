"""
Test Case 1: User Login Functionality
"""
import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from base_test import BaseTest
from config import Config


class TestLogin(BaseTest):
    """Test user login functionality"""
    
    def test_login(self):
        """
        Test Case: User Login
        Steps:
        1. Navigate to login page
        2. Enter credentials
        3. Submit login form
        4. Verify login success
        """
        try:
            print("\n=== Starting Login Test ===")
            
            # Step 1: Navigate to login page
            print("Step 1: Navigating to login page...")
            self.driver.get(f"{Config.BASE_URL}/login")
            time.sleep(2)
            self.take_screenshot("01_login_page")
            
            # Step 2: Enter credentials
            print("Step 2: Entering credentials...")
            
            # Email field
            email_field = self.wait_for_element(By.NAME, "email", timeout=10)
            self.safe_send_keys(email_field, Config.EXISTING_USER["email"])
            time.sleep(0.5)
            
            # Password field
            password_field = self.wait_for_element(By.NAME, "password", timeout=10)
            self.safe_send_keys(password_field, Config.EXISTING_USER["password"])
            time.sleep(0.5)
            
            self.take_screenshot("02_login_form_filled")
            
            # Step 3: Submit login form
            print("Step 3: Submitting login form...")
            submit_button = self.wait_for_clickable(By.XPATH, "//button[@type='submit']", timeout=10)
            self.safe_click(submit_button)
            time.sleep(3)
            
            self.take_screenshot("03_login_submitted")
            
            # Step 4: Verify login success
            print("Step 4: Verifying login success...")
            current_url = self.driver.current_url
            
            # Check if redirected away from login page
            if "/login" not in current_url:
                print(f"PASS: Redirected to: {current_url}")
                
                # Look for dashboard elements
                dashboard_indicators = [
                    (By.XPATH, "//*[contains(@class, 'dashboard')]"),
                    (By.XPATH, "//*[contains(text(), 'Dashboard')]"),
                    (By.XPATH, "//*[contains(@class, 'user-profile')]"),
                    (By.XPATH, "//*[contains(@class, 'admin')]"),
                ]
                
                dashboard_found = False
                for by, value in dashboard_indicators:
                    if self.element_exists(by, value, timeout=5):
                        print(f"PASS: Dashboard element found: {value}")
                        dashboard_found = True
                        break
                
                if dashboard_found or "/login" not in current_url:
                    print("PASS: Login successful")
                    self.take_screenshot("04_login_success")
                    print("\n=== Login Test PASSED ===\n")
                    return
            
            # Check for error messages
            try:
                error_elements = self.driver.find_elements(By.CSS_SELECTOR, ".error, .alert-danger, [role='alert']")
                if error_elements:
                    error_text = error_elements[0].text
                    raise AssertionError(f"Login failed: {error_text}")
            except:
                pass
            
            # If still on login page, login failed
            if "/login" in current_url:
                raise AssertionError("Login failed: Still on login page")
            
            print("\n=== Login Test PASSED ===\n")
            
        except Exception as e:
            print(f"\nFAIL: Test Failed: {str(e)}")
            self.take_screenshot("login_failure")
            pytest.fail(f"Login test failed: {str(e)}")
