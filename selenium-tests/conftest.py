import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "smoke: mark test as a smoke test"
    )
    config.addinivalue_line(
        "markers", "regression: mark test as a regression test"
    )

def pytest_collection_modifyitems(config, items):
    """Modify test collection"""
    for item in items:
        if "test_" in item.nodeid:
            item.add_marker(pytest.mark.functional)

@pytest.fixture(scope="session")
def test_session():
    """Session-wide fixture"""
    print("\n" + "="*70)
    print("PEPPER Selenium Tests - pytest")
    print("="*70 + "\n")
    yield
    print("\n" + "="*70)
    print("Tests Complete")
    print("="*70 + "\n")
