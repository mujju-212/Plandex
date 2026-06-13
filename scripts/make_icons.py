"""
Creates properly padded adaptive icon files for Android/iOS.
- Reads the existing logo images (NOT modified)
- Bakes background color directly into the PNG (avoids Android transparent crash)
- Light icon: #4A9BE2 (brand blue) background — white P is clearly visible
- Dark icon:  #141414 (dark card) background — gold P is clearly visible
- Adds padding so logo = 62% of canvas, centered
- Canvas size: 1024x1024
"""

from PIL import Image
import os

CANVAS_SIZE = 1024
LOGO_RATIO  = 0.62
LOGO_SIZE   = int(CANVAS_SIZE * LOGO_RATIO)   # ~635px

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def make_icon(input_filename, output_filename, bg_hex):
    input_path  = os.path.join(ASSETS_DIR, input_filename)
    output_path = os.path.join(ASSETS_DIR, output_filename)

    # Open original logo (keep transparent background of logo itself)
    logo = Image.open(input_path).convert('RGBA')

    # Resize logo keeping aspect ratio
    logo.thumbnail((LOGO_SIZE, LOGO_SIZE), Image.LANCZOS)

    # Create solid-colored 1024x1024 canvas (baked-in background)
    bg_rgb = hex_to_rgb(bg_hex)
    canvas = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (*bg_rgb, 255))

    # Center the logo on the canvas using alpha composite
    paste_x = (CANVAS_SIZE - logo.width)  // 2
    paste_y = (CANVAS_SIZE - logo.height) // 2
    canvas.paste(logo, (paste_x, paste_y), logo)

    # Save as PNG
    canvas.save(output_path, 'PNG')
    print(f"Saved: {output_filename}  bg={bg_hex}  logo={logo.width}x{logo.height}  offset=({paste_x},{paste_y})")

# Light icon — brand blue background so white glassy P is clearly visible
make_icon('light-theme-logo.png', 'adaptive-icon.png',      '#4A9BE2')

# Dark icon  — dark background so gold P is clearly visible
make_icon('dark-theme-logo.png',  'adaptive-icon-dark.png', '#141414')

print("Done!")
