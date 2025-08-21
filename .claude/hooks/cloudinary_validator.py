#!/usr/bin/env python3
"""
Cloudinary Asset Validator for Camydia Portfolio
Ensures all media assets use Cloudinary for optimal performance and management.
"""
import json
import sys
import re
import os

def validate_cloudinary_usage(file_path, content):
    """Validate that media assets use Cloudinary."""
    
    # Skip non-relevant files
    if not any(ext in file_path.lower() for ext in ['.tsx', '.ts', '.jsx', '.js', '.md', '.mdx']):
        return True
    
    # Media URL patterns to detect
    media_patterns = [
        r'https?://[^\s\'\"]+\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|svg)',  # Direct URLs
        r'src\s*=\s*[\'\"](/[^\'\"]*\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|svg))[\'\"]]',  # Local src
        r'url\s*\(\s*[\'\"](/[^\'\"]*\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|svg))[\'\"]\s*\)',  # CSS urls
    ]
    
    violations = []
    
    for pattern in media_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            url = match[0] if isinstance(match, tuple) else match
            
            # Allow localhost, cloudinary, and relative paths for development
            if not any(allowed in url.lower() for allowed in [
                'cloudinary.com',
                'localhost',
                '127.0.0.1',
                'res.cloudinary.com',
                '/api/cloudinary',  # API routes
                'data:image',  # Base64 images
                '.svg'  # SVG icons are OK as local
            ]) and not url.startswith('#'):  # Skip anchors
                violations.append(url)
    
    # Check for Next.js Image component usage without Cloudinary
    next_image_pattern = r'<Image[^>]*src\s*=\s*[\'\"](https?://[^\'\"]+)[\'\"]]'
    next_images = re.findall(next_image_pattern, content)
    
    for img_url in next_images:
        if 'cloudinary.com' not in img_url and 'localhost' not in img_url:
            violations.append(f"Next.js Image: {img_url}")
    
    if violations:
        print(f"📸 Non-Cloudinary assets detected in {file_path}:")
        for violation in violations[:5]:  # Limit output
            print(f"  • {violation}")
        if len(violations) > 5:
            print(f"  • ... and {len(violations) - 5} more")
        
        print("\n💡 Recommendations:")
        print("  • Upload images to Cloudinary and use the public_id")
        print("  • Use next-cloudinary components: <CldImage>, <CldVideo>") 
        print("  • For development, use localhost URLs")
        print("  • SVG icons can remain local for better performance")
        return False
    
    # Check for proper Next.js + Cloudinary integration
    if '<Image' in content and 'next/image' in content:
        if 'cloudinary' not in content.lower():
            print(f"💡 Consider using next-cloudinary for better optimization in {file_path}")
    
    return True

def check_cloudinary_config(file_path, content):
    """Check for proper Cloudinary configuration."""
    
    # Check for environment variables in config files
    if 'next.config' in file_path:
        if 'cloudinary' in content.lower():
            if 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME' not in content:
                print(f"⚠️ Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in {file_path}")
    
    # Check for proper image domains configuration
    if 'next.config' in file_path and 'res.cloudinary.com' not in content:
        print(f"💡 Add 'res.cloudinary.com' to image domains in {file_path}")

# Main execution
try:
    input_data = json.load(sys.stdin)
    tool_input = input_data.get('tool_input', {})
    file_path = tool_input.get('file_path', '')
    
    # Get content from different tool types
    content = (
        tool_input.get('content', '') or 
        tool_input.get('new_string', '') or
        tool_input.get('body', '')
    )
    
    if not file_path or not content:
        sys.exit(0)  # Nothing to validate
    
    # Make path relative for cleaner output
    if file_path.startswith('/Users/ns2poportable/Desktop/immersive-camydia/camydia-portfolio/'):
        display_path = file_path.replace('/Users/ns2poportable/Desktop/immersive-camydia/camydia-portfolio/', '')
    else:
        display_path = file_path
    
    # Validate Cloudinary usage
    if not validate_cloudinary_usage(display_path, content):
        print(f"\n🔗 Learn more: https://next.cloudinary.dev/")
        # Don't block - just warn
    
    # Check configuration
    check_cloudinary_config(display_path, content)
    
except Exception as e:
    print(f"Error validating Cloudinary usage: {e}", file=sys.stderr)
    sys.exit(0)  # Don't block on validation errors