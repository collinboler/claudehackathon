#!/usr/bin/env python3
"""
Simple script to create placeholder PNG icons for the Chrome extension.
Requires PIL/Pillow: pip install pillow
"""

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Please install Pillow: pip install pillow")
    exit(1)

def create_icon(size):
    # Create image with gradient-like background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)

    # Draw a simple microphone icon
    # Microphone capsule
    mic_width = size // 4
    mic_height = size // 3
    mic_x = (size - mic_width) // 2
    mic_y = size // 4

    draw.ellipse(
        [mic_x, mic_y, mic_x + mic_width, mic_y + mic_height],
        fill='white'
    )

    # Microphone stand
    stand_x = size // 2
    stand_y = mic_y + mic_height
    stand_height = size // 6

    draw.line(
        [stand_x, stand_y, stand_x, stand_y + stand_height],
        fill='white',
        width=max(2, size // 32)
    )

    # Microphone base
    base_width = size // 5
    base_y = stand_y + stand_height

    draw.line(
        [stand_x - base_width // 2, base_y, stand_x + base_width // 2, base_y],
        fill='white',
        width=max(2, size // 32)
    )

    return img

# Create icons
sizes = [16, 48, 128]
for size in sizes:
    icon = create_icon(size)
    icon.save(f'icons/icon{size}.png')
    print(f'Created icons/icon{size}.png')

print('All icons created successfully!')
