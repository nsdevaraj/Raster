#!/usr/bin/env python3
"""Generate test image fixtures for E2E testing"""

from PIL import Image, ImageDraw

def create_test_image():
    """Create a simple 100x100 test image with a black square"""
    img = Image.new('RGB', (100, 100), color='white')
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 20, 80, 80], fill='black')
    img.save('test-image.png')
    print("✓ Created test-image.png")

def create_large_image():
    """Create a larger 800x600 test image with a grid pattern"""
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    for i in range(0, 800, 50):
        draw.line([(i, 0), (i, 600)], fill='black', width=2)
    
    for i in range(0, 600, 50):
        draw.line([(0, i), (800, i)], fill='black', width=2)
    
    img.save('large-image.png')
    print("✓ Created large-image.png")

if __name__ == '__main__':
    print("Generating test fixtures...")
    create_test_image()
    create_large_image()
    print("\nAll test fixtures created successfully!")
