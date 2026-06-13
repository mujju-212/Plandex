"""
Creates properly padded adaptive icon files for Android/iOS.
- Reads the existing logo images (NOT modified)
- Adds 20% transparent padding on all sides so logo = 60% of canvas
- Saves as NEW files: adaptive-icon.png and adaptive-icon-dark.png
- Canvas size: 1024x1024
"""

from PIL import Image
import os

CANVAS_SIZE = 1024
# Logo will occupy 62% of the canvas, padded equally on all sides
LOGO_RATIO = 0.62
LOGO_SIZE = int(CANVAS_SIZE * LOGO_RATIO)  # ~634px
OFFSET = (CANVAS_SIZE - LOGO_SIZE) // 2    # ~195px from each edge

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')

def make_padded_icon(input_filename, output_filename):
    input_path = os.path.join(ASSETS_DIR, input_filename)
    output_path = os.path.join(ASSETS_DIR, output_filename)

    # Open original logo
    logo = Image.open(input_path).convert('RGBA')

    # Resize logo keeping aspect ratio, fitting within LOGO_SIZE x LOGO_SIZE
    logo.thumbnail((LOGO_SIZE, LOGO_SIZE), Image.LANCZOS)

    # Create transparent 1024x1024 canvas
    canvas = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))

    # Center the logo on the canvas
    paste_x = (CANVAS_SIZE - logo.width) // 2
    paste_y = (CANVAS_SIZE - logo.height) // 2
    canvas.paste(logo, (paste_x, paste_y), logo)

    # Save
    canvas.save(output_path, 'PNG')
    print(f"Saved: {output_path}  (logo={logo.width}x{logo.height}, offset=({paste_x},{paste_y}))")

make_padded_icon('light-theme-logo.png', 'adaptive-icon.png')
make_padded_icon('dark-theme-logo.png',  'adaptive-icon-dark.png')
print("Done!")
