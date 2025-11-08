"""
Configuration file for PEPPER Selenium tests
"""
import os

class Config:
    # Base URL
    BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
    
    # Test credentials
    EXISTING_USER = {
        "email": os.getenv("ADMIN_EMAIL", "vj.vijetha01@gmail.com"),
        "password": os.getenv("ADMIN_PASSWORD", "Admin123#")
    }
    
    TEST_USER = {
        "email": os.getenv("TEST_EMAIL", "vijethajinu2026@mca.ajce.in"),
        "password": os.getenv("TEST_PASSWORD", "Vij246544#")
    }
    
    # Browser settings
    # Default to firefox on Windows due to ChromeDriver compatibility issues
    BROWSER = os.getenv("BROWSER", "firefox")  # chrome or firefox
    HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"
    WINDOW_SIZE = (1920, 1080)
    
    # Timeouts
    IMPLICIT_WAIT = 10
    EXPLICIT_WAIT = 20
    PAGE_LOAD_TIMEOUT = 30
    
    # Screenshot settings
    SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
    REPORTS_DIR = os.path.join(os.path.dirname(__file__), "reports")
    
    # Test data
    TEST_PRODUCT_NAME = f"Test Product {int(__import__('time').time())}"
    TEST_PRODUCT_PRICE = "150"
    TEST_PRODUCT_STOCK = "50"
    TEST_PRODUCT_DESCRIPTION = "Test product description for automated testing"
