import time
import pytest
from selenium.webdriver.common.by import By
from base_test import BaseTest
from config import Config

class TestLogin(BaseTest):
    """Test user login functionality"""
    
    def test_user_login(self):
        """
        Test Case: User Login
        Steps:
        1. Navigate to login page
        2. Enter email and password
        3. Submit login form
        4. Verify successful redirect to dashboard
        """
        try:
            print("\n" + "="*70)
            print("🔐 TEST: User Login")
            print("="*70 + "\n")
            
            print("Step 1: Navigate to login page...")
            self.navigate_to("/login")
            time.sleep(2)
            self.take_screenshot("01_login_page_loaded")
            print("✓ Login page loaded")
            
            print("\nStep 2: Enter email and password...")
            try:
                email_field = self.wait_for_element(By.CSS_SELECTOR, "input[name='email']")
            except:
                try:
                    email_field = self.wait_for_element(By.CSS_SELECTOR, "input[type='email']")
                except:
                    email_field = self.wait_for_element(By.CSS_SELECTOR, "#email")
            self.safe_send_keys(email_field, Config.TEST_USER["email"])
            print(f"✓ Entered email: {Config.TEST_USER['email']}")
            
            try:
                password_field = self.wait_for_element(By.CSS_SELECTOR, "input[name='password']")
            except:
                try:
                    password_field = self.wait_for_element(By.CSS_SELECTOR, "input[type='password']")
                except:
                    password_field = self.wait_for_element(By.CSS_SELECTOR, "#password")
            self.safe_send_keys(password_field, Config.TEST_USER["password"])
            print("✓ Entered password")
            
            time.sleep(1)
            self.take_screenshot("02_login_form_filled")
            
            print("\nStep 3: Submit login form...")
            try:
                submit_button = self.wait_for_clickable(By.XPATH, "//button[@type='submit']")
            except:
                try:
                    submit_button = self.wait_for_clickable(By.XPATH, "//button[contains(text(), 'Login')]")
                except:
                    submit_button = self.wait_for_clickable(By.CSS_SELECTOR, ".login-button")
            self.safe_click(submit_button)
            print("✓ Clicked login button")
            
            time.sleep(3)
            self.take_screenshot("03_login_submitted")
            
            print("\nStep 4: Verify successful login...")
            current_url = self.get_current_url()
            print(f"Current URL: {current_url}")
            
            if "/login" not in current_url:
                print(f"✓ User redirected to: {current_url}")
                self.take_screenshot("04_login_success")
                print("\n✅ TEST PASSED: User successfully logged in\n")
            else:
                raise AssertionError("Still on login page after submission")
            
        except Exception as e:
            print(f"\n✗ TEST FAILED: {str(e)}\n")
            print(f"Stacktrace: {type(e).__name__}: {e}")
            self.take_screenshot("login_failure")
            pytest.fail(f"Login test failed: {str(e)}")


class TestAdminLogin(BaseTest):
    """Test admin login functionality"""
    
    def test_admin_login(self):
        """
        Test Case: Admin Login
        Steps:
        1. Navigate to login page
        2. Enter admin email and password
        3. Submit login form
        4. Verify redirect to admin dashboard
        """
        try:
            print("\n" + "="*70)
            print("👨‍💼 TEST: Admin Login")
            print("="*70 + "\n")
            
            print("Step 1: Navigate to login page...")
            self.navigate_to("/login")
            time.sleep(2)
            self.take_screenshot("admin_01_login_page")
            print("✓ Login page loaded")
            
            print("\nStep 2: Enter admin credentials...")
            try:
                email_field = self.wait_for_element(By.CSS_SELECTOR, "input[name='email']")
            except:
                try:
                    email_field = self.wait_for_element(By.CSS_SELECTOR, "input[type='email']")
                except:
                    email_field = self.wait_for_element(By.CSS_SELECTOR, "#email")
            self.safe_send_keys(email_field, Config.ADMIN_USER["email"])
            print(f"✓ Entered admin email: {Config.ADMIN_USER['email']}")
            
            try:
                password_field = self.wait_for_element(By.CSS_SELECTOR, "input[name='password']")
            except:
                try:
                    password_field = self.wait_for_element(By.CSS_SELECTOR, "input[type='password']")
                except:
                    password_field = self.wait_for_element(By.CSS_SELECTOR, "#password")
            self.safe_send_keys(password_field, Config.ADMIN_USER["password"])
            print("✓ Entered admin password")
            
            time.sleep(1)
            self.take_screenshot("admin_02_form_filled")
            
            print("\nStep 3: Submit login form...")
            try:
                submit_button = self.wait_for_clickable(By.XPATH, "//button[@type='submit']")
            except:
                submit_button = self.wait_for_clickable(By.XPATH, "//button[contains(text(), 'Login')]")
            self.safe_click(submit_button)
            print("✓ Clicked login button")
            
            time.sleep(3)
            self.take_screenshot("admin_03_login_submitted")
            
            print("\nStep 4: Verify admin dashboard...")
            current_url = self.get_current_url()
            print(f"Current URL: {current_url}")
            
            if "/login" not in current_url:
                print(f"✓ Admin redirected to: {current_url}")
                self.take_screenshot("admin_04_success")
                print("\n✅ TEST PASSED: Admin successfully logged in\n")
            else:
                raise AssertionError("Still on login page after admin submission")
            
        except Exception as e:
            print(f"\n✗ TEST FAILED: {str(e)}\n")
            print(f"Stacktrace: {type(e).__name__}: {e}")
            self.take_screenshot("admin_login_failure")
            pytest.fail(f"Admin login test failed: {str(e)}")
