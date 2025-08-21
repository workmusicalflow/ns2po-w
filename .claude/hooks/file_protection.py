#!/usr/bin/env python3
"""
File Protection Hook for NS2PO Platform
Prevents modifications to sensitive files and directories.
"""
import json
import sys
import os
import re

def is_sensitive_file(file_path):
    """Check if file is sensitive and should be protected."""
    
    # Normalize path
    if file_path.startswith('/Users/ns2poportable/Desktop/ns2po-w/'):
        file_path = file_path.replace('/Users/ns2poportable/Desktop/ns2po-w/', '')
    
    # Sensitive file patterns
    sensitive_patterns = [
        # Environment files (only production is truly sensitive)
        r'\.env\.production$',
        r'\.env\.prod$',
        
        # Lock files (should be managed by package managers)
        r'package-lock\.json$',
        r'pnpm-lock\.yaml$',
        r'yarn\.lock$',
        
        # Git files
        r'\.git/',
        r'\.gitignore$',
        
        # Build artifacts
        r'\.next/',
        r'dist/',
        r'build/',
        r'node_modules/',
        r'\.turbo/',
        
        # CI/CD files
        r'\.github/workflows/',
        r'\.vercel/',
        r'\.netlify/',
        
        # NS2PO specific sensitive files
        r'NS2PO_Synthese\.md$',
        r'strategic-coach\.sh$',
        
        # Docker files in production
        r'Dockerfile\.prod$',
        r'docker-compose\.prod\.yml$',
        
        # Database files
        r'\.db$',
        r'\.sqlite$',
        r'\.sqlite3$',
        
        # Backup files
        r'\.bak$',
        r'\.backup$',
        r'\.orig$',
        
        # System files
        r'\.DS_Store$',
        r'Thumbs\.db$',
        
        # TypeScript generated files
        r'\.d\.ts$',
        
        # Certificate files
        r'\.pem$',
        r'\.key$',
        r'\.crt$',
        r'\.cert$',
    ]
    
    # Check against patterns
    for pattern in sensitive_patterns:
        if re.search(pattern, file_path, re.IGNORECASE):
            return True, pattern
    
    # Additional logic checks
    
    # Check for files containing secrets (by name pattern)
    secret_keywords = ['secret', 'private', 'credential', 'token', 'password', 'key']
    file_lower = file_path.lower()
    for keyword in secret_keywords:
        if keyword in file_lower and any(ext in file_lower for ext in ['.json', '.yaml', '.yml', '.txt']):
            return True, f"contains '{keyword}'"
    
    # Check for production config files
    if 'prod' in file_lower and any(ext in file_lower for ext in ['.json', '.yaml', '.yml', '.config.js']):
        return True, "production config file"
    
    return False, None

def get_file_safety_level(file_path):
    """Determine the safety level of modifying a file."""
    
    # Critical: Never allow modification
    critical_patterns = [
        r'\.env\.production$',     # Only block production env files
        r'\.env\.prod$',           # Only block production env files
        r'\.git/',
        r'package-lock\.json$',
        r'pnpm-lock\.yaml$',
    ]
    
    # Warning: Allow but warn (includes development .env files)
    warning_patterns = [
        r'\.env($|\.local$|\.development$)', # Warn for development env files
        r'tsconfig\.json$',
        r'next\.config\.',
        r'tailwind\.config\.',
        r'package\.json$',
    ]
    
    for pattern in critical_patterns:
        if re.search(pattern, file_path, re.IGNORECASE):
            return 'critical'
    
    for pattern in warning_patterns:
        if re.search(pattern, file_path, re.IGNORECASE):
            return 'warning'
    
    return 'safe'

def check_file_content_safety(content):
    """Check if file content contains sensitive information."""
    
    if not content:
        return True, []
    
    violations = []
    
    # Check for potential secrets
    secret_patterns = [
        (r'password\s*[=:]\s*["\'][^"\']+["\']', 'Password in plain text'),
        (r'api[_-]?key\s*[=:]\s*["\'][^"\']+["\']', 'API key in plain text'),
        (r'secret\s*[=:]\s*["\'][^"\']+["\']', 'Secret in plain text'),
        (r'token\s*[=:]\s*["\'][^"\']+["\']', 'Token in plain text'),
        (r'DATABASE_URL\s*=\s*["\'][^"\']*://[^"\']+["\']', 'Database URL with credentials'),
        (r'mongodb://[^:]+:[^@]+@', 'MongoDB connection with credentials'),
        (r'postgres://[^:]+:[^@]+@', 'PostgreSQL connection with credentials'),
    ]
    
    for pattern, description in secret_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            violations.append(description)
    
    # Check for console.log with sensitive data
    console_sensitive = re.findall(r'console\.log\([^)]*(?:password|secret|token|key)[^)]*\)', content, re.IGNORECASE)
    if console_sensitive:
        violations.append(f"Console.log with sensitive data ({len(console_sensitive)} occurrences)")
    
    return len(violations) == 0, violations

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
    
    if not file_path:
        sys.exit(0)  # Nothing to protect
    
    # Check if file is sensitive
    is_sensitive, reason = is_sensitive_file(file_path)
    safety_level = get_file_safety_level(file_path)
    
    # Make path relative for cleaner output
    display_path = file_path
    if file_path.startswith('/Users/ns2poportable/Desktop/ns2po-w/'):
        display_path = file_path.replace('/Users/ns2poportable/Desktop/ns2po-w/', '')
    
    # Check content safety
    content_safe, content_violations = check_file_content_safety(content)
    
    # Handle critical files
    if safety_level == 'critical':
        print(f"🚫 BLOCKED: Cannot modify critical file {display_path}")
        print(f"📋 Reason: {reason or 'Critical system file'}")
        print("💡 Critical files include:")
        print("  • Environment files (.env)")
        print("  • Lock files (package-lock.json, pnpm-lock.yaml)")
        print("  • Git directory (.git/)")
        print("  • Use proper tools to modify these files")
        sys.exit(2)  # Block the operation
    
    # Handle warning files
    if safety_level == 'warning':
        print(f"⚠️ WARNING: Modifying important config file {display_path}")
        print("💡 Please ensure you know what you're doing")
        print("🔍 Consider reviewing changes carefully")
    
    # Handle sensitive files
    if is_sensitive and safety_level != 'critical':
        print(f"🔒 CAUTION: Modifying sensitive file {display_path}")
        print(f"📋 Detected as: {reason}")
        print("💡 Make sure this modification is intentional")
    
    # Check content violations
    if not content_safe:
        print(f"🔐 SECURITY WARNING: Sensitive content detected in {display_path}:")
        for violation in content_violations:
            print(f"  • {violation}")
        print("\n💡 Security recommendations:")
        print("  • Use environment variables for secrets")
        print("  • Store credentials in .env files (not in code)")
        print("  • Avoid logging sensitive information")
        print("  • Use proper secret management tools")
        # Don't block - just warn about content
    
    # Special handling for package.json changes
    if file_path.endswith('package.json') and content:
        if '"scripts"' in content:
            print(f"📦 Package.json scripts modified in {display_path}")
            print("💡 Run 'pnpm install' if dependencies changed")
    
    # Special handling for TypeScript config changes
    if 'tsconfig.json' in file_path and content:
        print(f"⚙️ TypeScript config modified in {display_path}")
        print("💡 Consider running 'pnpm build' to verify config")
    
except Exception as e:
    print(f"Error checking file protection: {e}", file=sys.stderr)
    sys.exit(0)  # Don't block on protection errors