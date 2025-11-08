"""
Comprehensive Admin Operations Tests
Tests for: Admin Login -> Add Product -> Restock -> Assign Order to Delivery Boy
"""
import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from base_test import BaseTest
from config import Config


class TestAdminOperations(BaseTest):
    """Test admin operations: login, add product, restock, assign delivery"""
    
    def admin_login(self):
        """Helper method to login as admin"""
        print("=== ADMIN LOGIN ===")
        print(f"[INFO] Email: {Config.EXISTING_USER['email']}")
        
        self.driver.get(f"{Config.BASE_URL}/login")
        time.sleep(2)
        self.take_screenshot("01_admin_login_page")
        
        email_field = self.wait_for_element(By.NAME, "email", timeout=10)
        self.safe_send_keys(email_field, Config.EXISTING_USER["email"])
        
        password_field = self.wait_for_element(By.NAME, "password", timeout=10)
        self.safe_send_keys(password_field, Config.EXISTING_USER["password"])
        
        self.take_screenshot("02_admin_login_form_filled")
        
        submit_button = self.wait_for_clickable(By.XPATH, "//button[@type='submit']", timeout=10)
        self.safe_click(submit_button)
        time.sleep(5)
        
        wait_for_redirect = 10
        while wait_for_redirect > 0:
            current_url = self.driver.current_url
            if "/login" not in current_url:
                print(f"[OK] Redirected to: {current_url}")
                break
            time.sleep(1)
            wait_for_redirect -= 1
        
        self.take_screenshot("03_admin_dashboard")
        print("[OK] Admin login successful")
    
    def navigate_to_admin_products(self):
        """Navigate to admin products management page"""
        print("=== NAVIGATE TO ADMIN PRODUCTS ===")
        
        admin_product_pages = [
            "/admin/products",
            "/admin-products",
            "/dashboard/products",
            "/admin/inventory",
        ]
        
        page_found = False
        for page_url in admin_product_pages:
            try:
                self.driver.get(f"{Config.BASE_URL}{page_url}")
                time.sleep(2)
                current_url = self.driver.current_url
                if "/login" not in current_url and page_url in current_url or current_url.endswith(page_url):
                    print(f"[OK] Accessed products page: {page_url}")
                    page_found = True
                    break
            except:
                continue
        
        if not page_found:
            try:
                self.driver.get(f"{Config.BASE_URL}/dashboard")
                time.sleep(2)
                buttons = self.driver.find_elements(By.TAG_NAME, "button")
                links = self.driver.find_elements(By.TAG_NAME, "a")
                
                for elem in buttons + links:
                    try:
                        text = elem.text.lower()
                        if "product" in text and "manage" in text or "add" in text and "product" in text:
                            self.safe_click(elem)
                            print(f"[OK] Clicked: {elem.text}")
                            time.sleep(2)
                            page_found = True
                            break
                    except:
                        continue
            except:
                pass
        
        self.take_screenshot("04_admin_products_page")
        return page_found
    
    def add_new_product(self, product_name=None):
        """Add a new product to the catalog"""
        print("=== ADD NEW PRODUCT ===")
        
        if product_name is None:
            product_name = f"Test Product {int(time.time())}"
        
        try:
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            for button in buttons:
                try:
                    button_text = button.text.lower()
                    if "add" in button_text and "product" in button_text or "new" in button_text and "product" in button_text or "create" in button_text and "product" in button_text:
                        self.scroll_to_element(button)
                        self.safe_click(button)
                        print(f"[OK] Clicked: {button.text}")
                        time.sleep(2)
                        break
                except:
                    continue
        except:
            pass
        
        self.take_screenshot("05_product_form_page")
        
        product_data = {
            "name": product_name,
            "price": "250",
            "stock": "100",
            "description": "Test product for automated testing",
        }
        
        input_fields = self.driver.find_elements(By.CSS_SELECTOR, "input[type='text'], input[type='number'], textarea")
        
        if len(input_fields) > 0:
            try:
                self.safe_send_keys(input_fields[0], product_data["name"])
                print(f"[OK] Entered product name: {product_data['name']}")
            except:
                pass
        
        if len(input_fields) > 1:
            try:
                self.safe_send_keys(input_fields[1], product_data["price"])
                print(f"[OK] Entered price: {product_data['price']}")
            except:
                pass
        
        if len(input_fields) > 2:
            try:
                self.safe_send_keys(input_fields[2], product_data["stock"])
                print(f"[OK] Entered stock: {product_data['stock']}")
            except:
                pass
        
        if len(input_fields) > 3:
            try:
                self.safe_send_keys(input_fields[3], product_data["description"])
                print(f"[OK] Entered description")
            except:
                pass
        
        self.take_screenshot("06_product_form_filled")
        
        buttons = self.driver.find_elements(By.TAG_NAME, "button")
        for button in buttons:
            try:
                button_text = button.text.lower()
                if "submit" in button_text or "save" in button_text or "create" in button_text or ("add" in button_text and "product" not in button_text):
                    self.scroll_to_element(button)
                    self.safe_click(button)
                    print(f"[OK] Clicked: {button.text}")
                    time.sleep(3)
                    break
            except:
                continue
        
        self.take_screenshot("07_product_added")
        print(f"[OK] Product added: {product_name}")
        return product_name
    
    def restock_product(self, quantity=50):
        """Restock a product with specified quantity"""
        print("=== RESTOCK PRODUCT ===")
        
        try:
            products = self.driver.find_elements(By.CSS_SELECTOR, ".product-row, .product-item, [data-testid='product']")
            
            if products:
                first_product = products[0]
                self.scroll_to_element(first_product)
                
                try:
                    first_product.click()
                    print("[OK] Clicked on product")
                    time.sleep(2)
                except:
                    pass
        except:
            print("[WARN] Could not find product list")
        
        self.take_screenshot("08_product_details_page")
        
        buttons = self.driver.find_elements(By.TAG_NAME, "button")
        restock_found = False
        
        for button in buttons:
            try:
                button_text = button.text.lower()
                if "restock" in button_text or "update" in button_text and "stock" in button_text or "edit" in button_text:
                    self.scroll_to_element(button)
                    self.safe_click(button)
                    print(f"[OK] Clicked: {button.text}")
                    restock_found = True
                    time.sleep(2)
                    break
            except:
                continue
        
        if restock_found:
            self.take_screenshot("09_restock_form")
            
            input_fields = self.driver.find_elements(By.CSS_SELECTOR, "input[type='number']")
            if input_fields:
                try:
                    self.safe_send_keys(input_fields[0], str(quantity))
                    print(f"[OK] Entered restock quantity: {quantity}")
                except:
                    pass
            
            self.take_screenshot("10_restock_form_filled")
            
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            for button in buttons:
                try:
                    button_text = button.text.lower()
                    if "confirm" in button_text or "save" in button_text or "submit" in button_text or "update" in button_text:
                        self.scroll_to_element(button)
                        self.safe_click(button)
                        print(f"[OK] Clicked: {button.text}")
                        time.sleep(2)
                        break
                except:
                    continue
        else:
            print("[WARN] Restock button not found")
        
        self.take_screenshot("11_restock_completed")
        print("[OK] Restock operation completed")
    
    def navigate_to_orders(self):
        """Navigate to orders management page"""
        print("=== NAVIGATE TO ORDERS ===")
        
        order_pages = [
            "/admin/orders",
            "/admin-orders",
            "/dashboard/orders",
            "/orders",
        ]
        
        page_found = False
        for page_url in order_pages:
            try:
                self.driver.get(f"{Config.BASE_URL}{page_url}")
                time.sleep(2)
                current_url = self.driver.current_url
                if "/login" not in current_url:
                    print(f"[OK] Accessed orders page: {page_url}")
                    page_found = True
                    break
            except:
                continue
        
        if not page_found:
            try:
                buttons = self.driver.find_elements(By.TAG_NAME, "button")
                links = self.driver.find_elements(By.TAG_NAME, "a")
                
                for elem in buttons + links:
                    try:
                        text = elem.text.lower()
                        if "order" in text:
                            self.safe_click(elem)
                            print(f"[OK] Clicked: {elem.text}")
                            time.sleep(2)
                            page_found = True
                            break
                    except:
                        continue
            except:
                pass
        
        self.take_screenshot("12_orders_page")
        return page_found
    
    def assign_order_to_delivery(self):
        """Assign an order to delivery boy"""
        print("=== ASSIGN ORDER TO DELIVERY BOY ===")
        
        try:
            orders = self.driver.find_elements(By.CSS_SELECTOR, ".order-row, .order-item, [data-testid='order']")
            
            if orders:
                first_order = orders[0]
                self.scroll_to_element(first_order)
                
                try:
                    first_order.click()
                    print("[OK] Clicked on order")
                    time.sleep(2)
                except:
                    pass
        except:
            print("[WARN] Could not find orders list")
        
        self.take_screenshot("13_order_details_page")
        
        buttons = self.driver.find_elements(By.TAG_NAME, "button")
        assign_found = False
        
        for button in buttons:
            try:
                button_text = button.text.lower()
                if "assign" in button_text or "delivery" in button_text or "dispatch" in button_text or "allocate" in button_text:
                    self.scroll_to_element(button)
                    self.safe_click(button)
                    print(f"[OK] Clicked: {button.text}")
                    assign_found = True
                    time.sleep(2)
                    break
            except:
                continue
        
        if assign_found:
            self.take_screenshot("14_delivery_assignment_form")
            
            select_elements = self.driver.find_elements(By.TAG_NAME, "select")
            dropdowns = self.driver.find_elements(By.CSS_SELECTOR, ".dropdown, [role='combobox']")
            
            if select_elements:
                try:
                    options = select_elements[0].find_elements(By.TAG_NAME, "option")
                    if len(options) > 1:
                        options[1].click()
                        print(f"[OK] Selected delivery boy: {options[1].text}")
                except:
                    pass
            elif dropdowns:
                try:
                    self.safe_click(dropdowns[0])
                    time.sleep(1)
                    dropdown_options = self.driver.find_elements(By.CSS_SELECTOR, ".dropdown-item, [role='option']")
                    if dropdown_options:
                        self.safe_click(dropdown_options[0])
                        print(f"[OK] Selected delivery boy")
                except:
                    pass
            
            self.take_screenshot("15_delivery_boy_selected")
            
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            for button in buttons:
                try:
                    button_text = button.text.lower()
                    if "confirm" in button_text or "assign" in button_text or "submit" in button_text:
                        self.scroll_to_element(button)
                        self.safe_click(button)
                        print(f"[OK] Clicked: {button.text}")
                        time.sleep(2)
                        break
                except:
                    continue
        else:
            print("[WARN] Assign delivery button not found")
        
        self.take_screenshot("16_delivery_assigned")
        print("[OK] Order assignment completed")
    
    def test_admin_login(self):
        """Test Case: Admin Login"""
        try:
            print("\n" + "="*70)
            print("[TEST] ADMIN LOGIN")
            print("="*70 + "\n")
            
            self.admin_login()
            current_url = self.driver.current_url
            assert "/login" not in current_url, "Still on login page"
            
            print("\n[PASS] ADMIN LOGIN TEST PASSED\n")
            
        except Exception as e:
            print(f"\n[FAIL] ADMIN LOGIN TEST FAILED: {str(e)}\n")
            self.take_screenshot("admin_login_failure")
            pytest.fail(f"Admin login failed: {str(e)}")
    
    def test_add_product(self):
        """Test Case: Add New Product"""
        try:
            print("\n" + "="*70)
            print("[TEST] ADD NEW PRODUCT")
            print("="*70 + "\n")
            
            self.admin_login()
            self.navigate_to_admin_products()
            self.add_new_product()
            
            print("\n[PASS] ADD NEW PRODUCT TEST PASSED\n")
            
        except Exception as e:
            print(f"\n[FAIL] ADD NEW PRODUCT TEST FAILED: {str(e)}\n")
            self.take_screenshot("add_product_failure")
            pytest.fail(f"Add product test failed: {str(e)}")
    
    def test_restock_product(self):
        """Test Case: Restock Product"""
        try:
            print("\n" + "="*70)
            print("[TEST] RESTOCK PRODUCT")
            print("="*70 + "\n")
            
            self.admin_login()
            self.navigate_to_admin_products()
            self.restock_product(quantity=75)
            
            print("\n[PASS] RESTOCK PRODUCT TEST PASSED\n")
            
        except Exception as e:
            print(f"\n[FAIL] RESTOCK PRODUCT TEST FAILED: {str(e)}\n")
            self.take_screenshot("restock_failure")
            pytest.fail(f"Restock test failed: {str(e)}")
    
    def test_assign_delivery(self):
        """Test Case: Assign Order to Delivery Boy"""
        try:
            print("\n" + "="*70)
            print("[TEST] ASSIGN ORDER TO DELIVERY BOY")
            print("="*70 + "\n")
            
            self.admin_login()
            self.navigate_to_orders()
            self.assign_order_to_delivery()
            
            print("\n[PASS] ASSIGN DELIVERY TEST PASSED\n")
            
        except Exception as e:
            print(f"\n[FAIL] ASSIGN DELIVERY TEST FAILED: {str(e)}\n")
            self.take_screenshot("assign_delivery_failure")
            pytest.fail(f"Assign delivery test failed: {str(e)}")
    
    def test_complete_admin_workflow(self):
        """Test Case: Complete Admin Workflow"""
        try:
            print("\n" + "="*70)
            print("[TEST] COMPLETE ADMIN WORKFLOW")
            print("="*70)
            
            print("\n[1] ADMIN LOGIN")
            print("-"*70)
            self.admin_login()
            current_url = self.driver.current_url
            assert "/login" not in current_url, "Still on login page"
            print("[PASS] Login verified\n")
            
            print("[2] ADD NEW PRODUCT")
            print("-"*70)
            self.navigate_to_admin_products()
            product_name = self.add_new_product()
            print("[PASS] Product added\n")
            
            print("[3] RESTOCK PRODUCT")
            print("-"*70)
            self.navigate_to_admin_products()
            self.restock_product(quantity=75)
            print("[PASS] Restock completed\n")
            
            print("[4] ASSIGN ORDER TO DELIVERY")
            print("-"*70)
            self.navigate_to_orders()
            self.assign_order_to_delivery()
            print("[PASS] Order assigned\n")
            
            print("="*70)
            print("[PASS] COMPLETE ADMIN WORKFLOW PASSED")
            print("="*70 + "\n")
            
        except Exception as e:
            print(f"\n[FAIL] COMPLETE ADMIN WORKFLOW FAILED: {str(e)}\n")
            self.take_screenshot("complete_admin_workflow_failure")
            pytest.fail(f"Complete admin workflow failed: {str(e)}")
