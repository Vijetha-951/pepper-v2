#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Fix emoji characters in test files for Windows compatibility"""

import re
import os

# Mapping of emoji to text
replacements = {
    '✓': 'PASS',
    '❌': 'FAIL',
    '⚠': 'WARN',
    '📸': 'IMG',
    '✗': 'FAIL',
}

test_files = [
    'test_add_to_cart.py',
    'test_admin_add_product.py',
    'test_admin_update_stock.py',
]

for filename in test_files:
    filepath = os.path.join(os.path.dirname(__file__), filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace emoji characters
        for emoji, replacement in replacements.items():
            content = content.replace(emoji, replacement)
            # Also handle unicode escapes
            content = content.replace(f'\\u{ord(emoji):04x}', replacement)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filename}")

print("Done fixing emoji characters!")



