# Test Fixtures

This directory contains test images for E2E testing.

## Creating Test Fixtures

Run the following script to generate test images:

```bash
pip install pillow
python3 generate_fixtures.py
```

Or use ImageMagick:

```bash
# Small test image
convert -size 100x100 xc:white -fill black -draw "rectangle 20,20 80,80" test-image.png

# Large test image  
convert -size 800x600 xc:white -fill black -strokewidth 2 \
  -draw "line 0,0 800,0" \
  -draw "line 0,50 800,50" \
  -draw "line 0,100 800,100" \
  large-image.png
```

## Files

- `test-image.png` - Small 100x100px test image with a black square
- `large-image.png` - Large 800x600px test image with grid pattern
