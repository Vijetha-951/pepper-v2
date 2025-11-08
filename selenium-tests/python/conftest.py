"""
Pytest configuration and fixtures
"""
import pytest
import os

# Create directories if they don't exist
from config import Config
os.makedirs(Config.SCREENSHOT_DIR, exist_ok=True)
os.makedirs(Config.REPORTS_DIR, exist_ok=True)


