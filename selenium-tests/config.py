class Config:
    BASE_URL = "http://localhost:3000"
    BROWSER = "chrome"
    HEADLESS = False
    IMPLICIT_WAIT = 10
    PAGE_LOAD_TIMEOUT = 30
    SCRIPT_TIMEOUT = 30
    
    TEST_USER = {
        "email": "vijethajinu2026@mca.ajce.in",
        "password": "Vij246544#"
    }
    
    ADMIN_USER = {
        "email": "vj.vijetha01@gmail.com",
        "password": "Admin123#"
    }
    
    EXISTING_USER = {
        "email": "testuser@example.com",
        "password": "testuser123"
    }
    
    SCREENSHOT_DIR = "selenium-tests/screenshots"
