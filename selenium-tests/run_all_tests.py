import subprocess
import sys
import os

# Change to selenium-tests directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 80)
print("STARTING COMPREHENSIVE TEST SUITE")
print("=" * 80)
print()

test_files = [
    ("Python Simple Tests", "python/test_simple.py"),
    ("Login Tests", "test_login.py"),
    ("Browse Products Tests", "test_browse_products.py"),
    ("Add to Cart Tests", "test_add_to_cart.py"),
    ("Checkout Tests", "test_checkout.py"),
]

all_passed = True

for test_name, test_file in test_files:
    if os.path.exists(test_file):
        print(f"\n[RUNNING] {test_name}: {test_file}")
        print("-" * 80)
        
        cmd = [
            sys.executable, "-m", "pytest", 
            test_file, 
            "-v", 
            "--tb=short",
            "--html=python/reports/report.html",
            "--self-contained-html",
            "-ra"
        ]
        
        result = subprocess.run(cmd, capture_output=False)
        
        if result.returncode != 0:
            all_passed = False
            print(f"[FAILED] {test_name}")
        else:
            print(f"[PASSED] {test_name}")
    else:
        print(f"[SKIPPED] {test_file} - File not found")

print()
print("=" * 80)
if all_passed:
    print("ALL TESTS PASSED!")
else:
    print("SOME TESTS FAILED - Check report for details")
print("=" * 80)
print()
print("HTML Report: python/reports/report.html")
print("Open in browser: file:///c:/xampp/htdocs/PEPPER/selenium-tests/python/reports/report.html")
