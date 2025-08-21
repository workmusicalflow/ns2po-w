#!/usr/bin/env python3
"""
Turborepo Validator for NS2PO Platform
Validates that file modifications respect monorepo boundaries and conventions.
"""
import json
import sys
import os

def validate_turborepo_structure(file_path):
    """Validate file modifications against Turborepo conventions."""
    
    # Define valid workspace patterns for NS2PO
    valid_patterns = [
        'apps/election-mvp/',
        'packages/ui/',
        'packages/types/',
        'packages/config/',
        'packages/composables/',
        'packages/database/',
        'turbo.json',
        'package.json',
        'pnpm-workspace.yaml',
        '.gitignore',
        'README.md',
        'CONTRIBUTING.md',
        'CLAUDE.md',
        'dev-sprint.md',
        '.env.example',
        'tsconfig.json',
        '.eslintrc.js',
        '.prettierrc',
        '.claude/',
        '.husky/',
        '.github/',
        'sonar-project.properties',
        '.npmrc'
    ]
    
    # Check if file is in valid location
    is_valid = any(file_path.startswith(pattern) for pattern in valid_patterns)
    
    if not is_valid:
        print(f"⚠️ Modification outside valid Turborepo workspace: {file_path}")
        print("Valid locations: apps/election-mvp/, packages/ui/, packages/types/, packages/config/, packages/composables/, packages/database/, root config files")
        return False
    
    # Specific validations
    if file_path.startswith('packages/'):
        # Packages should not import from apps
        return validate_package_imports(file_path)
    
    if file_path.startswith('apps/'):
        # Apps can import from packages but not other apps
        return validate_app_imports(file_path)
    
    return True

def validate_package_imports(file_path):
    """Packages should not import from apps."""
    if not os.path.exists(file_path):
        return True
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for imports from apps
        if 'from "../../../apps/' in content or 'import "../../../apps/' in content:
            print(f"❌ Package importing from apps detected in {file_path}")
            print("Packages should not import from apps - consider moving shared code to packages/")
            return False
            
    except Exception:
        pass
    
    return True

def validate_app_imports(file_path):
    """Apps should not import from other apps."""
    if not os.path.exists(file_path):
        return True
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract app name from path
        current_app = file_path.split('/')[1] if '/' in file_path else ''
        
        # Check for imports from other apps (currently only election-mvp)
        # No cross-app imports to check for single app setup
        # Future: add validation when more apps are added
        pass
            
    except Exception:
        pass
    
    return True

# Main execution
try:
    input_data = json.load(sys.stdin)
    file_path = input_data.get('tool_input', {}).get('file_path', '')
    
    if not file_path:
        sys.exit(0)  # No file path to validate
    
    # Make path relative to project root
    if file_path.startswith('/Users/ns2poportable/Desktop/ns2po-w/'):
        file_path = file_path.replace('/Users/ns2poportable/Desktop/ns2po-w/', '')
    
    if not validate_turborepo_structure(file_path):
        print(f"Use proper Turborepo workspace structure for {file_path}")
        sys.exit(2)  # Block the operation
    
    print(f"✅ Turborepo structure validated for {file_path}")
    
except Exception as e:
    print(f"Error validating Turborepo structure: {e}", file=sys.stderr)
    sys.exit(0)  # Don't block on validation errors