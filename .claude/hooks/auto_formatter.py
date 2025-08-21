#!/usr/bin/env python3
"""
Auto-Formatter for NS2PO Platform
Automatically formats TypeScript/JavaScript files using Prettier and ESLint after edits.
"""
import json
import sys
import os
import subprocess

def format_file(file_path):
    """Format TypeScript/JavaScript files using Prettier and ESLint."""
    
    # Skip non-relevant files
    if not any(file_path.endswith(ext) for ext in ['.ts', '.tsx', '.js', '.jsx']):
        return True
    
    # Skip node_modules and build directories
    skip_dirs = ['node_modules', 'dist', 'build', '.next', '.turbo']
    if any(skip_dir in file_path for skip_dir in skip_dirs):
        return True
    
    # Make sure file exists
    if not os.path.exists(file_path):
        return True
    
    project_root = '/Users/ns2poportable/Desktop/ns2po-w'
    election_mvp_app = '/Users/ns2poportable/Desktop/ns2po-w/apps/election-mvp'
    
    # Change to the specific app directory for ESLint (which has its own config)
    if '/apps/election-mvp/' in file_path:
        os.chdir(election_mvp_app)
    else:
        os.chdir(project_root)
    
    print(f"🎨 Formatting {file_path}...")
    
    success = True
    
    try:
        # Run Prettier
        prettier_result = subprocess.run(
            ['pnpm', 'prettier', '--write', file_path],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if prettier_result.returncode == 0:
            print(f"✅ Prettier: {file_path}")
        else:
            print(f"⚠️ Prettier warning on {file_path}: {prettier_result.stderr}")
            
    except subprocess.TimeoutExpired:
        print(f"⏰ Prettier timeout on {file_path}")
        success = False
    except Exception as e:
        print(f"❌ Prettier error on {file_path}: {e}")
        success = False
    
    try:
        # Run ESLint --fix for code quality
        eslint_result = subprocess.run(
            ['pnpm', 'eslint', '--fix', file_path],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if eslint_result.returncode == 0:
            print(f"✅ ESLint: {file_path}")
        elif eslint_result.returncode == 1:
            # ESLint found fixable issues and fixed them
            print(f"🔧 ESLint fixed issues in {file_path}")
        else:
            # ESLint found unfixable issues - just warn, don't block
            print(f"⚠️ ESLint issues in {file_path}:")
            if eslint_result.stdout:
                print(f"   {eslint_result.stdout}")
                
    except subprocess.TimeoutExpired:
        print(f"⏰ ESLint timeout on {file_path}")
    except Exception as e:
        print(f"❌ ESLint error on {file_path}: {e}")
    
    # Check if this is a TypeScript file for additional validation
    if file_path.endswith(('.ts', '.tsx')):
        try:
            # Quick TypeScript check (don't run full build, just syntax check)
            tsc_result = subprocess.run(
                ['pnpm', 'tsc', '--noEmit', '--skipLibCheck', file_path],
                capture_output=True,
                text=True,
                timeout=15
            )
            
            if tsc_result.returncode == 0:
                print(f"✅ TypeScript: {file_path}")
            else:
                print(f"⚠️ TypeScript issues in {file_path}:")
                if tsc_result.stderr:
                    # Show only first few lines to avoid spam
                    lines = tsc_result.stderr.split('\n')[:3]
                    for line in lines:
                        if line.strip():
                            print(f"   {line}")
                            
        except subprocess.TimeoutExpired:
            print(f"⏰ TypeScript check timeout on {file_path}")
        except Exception as e:
            print(f"❌ TypeScript check error on {file_path}: {e}")
    
    return success

def check_formatting_tools():
    """Check if required formatting tools are available."""
    
    project_root = '/Users/ns2poportable/Desktop/ns2po-w'
    os.chdir(project_root)
    
    tools_status = {}
    
    # Check Prettier
    try:
        prettier_result = subprocess.run(
            ['pnpm', 'prettier', '--version'],
            capture_output=True,
            text=True,
            timeout=10
        )
        tools_status['prettier'] = prettier_result.returncode == 0
    except:
        tools_status['prettier'] = False
    
    # Check ESLint
    try:
        eslint_result = subprocess.run(
            ['pnpm', 'eslint', '--version'],
            capture_output=True,
            text=True,
            timeout=10
        )
        tools_status['eslint'] = eslint_result.returncode == 0
    except:
        tools_status['eslint'] = False
    
    # Check TypeScript
    try:
        tsc_result = subprocess.run(
            ['pnpm', 'tsc', '--version'],
            capture_output=True,
            text=True,
            timeout=10
        )
        tools_status['typescript'] = tsc_result.returncode == 0
    except:
        tools_status['typescript'] = False
    
    missing_tools = [tool for tool, available in tools_status.items() if not available]
    
    if missing_tools:
        print(f"⚠️ Missing formatting tools: {', '.join(missing_tools)}")
        print("💡 Install missing tools:")
        if 'prettier' in missing_tools:
            print("   pnpm add -D prettier")
        if 'eslint' in missing_tools:
            print("   pnpm add -D eslint")
        if 'typescript' in missing_tools:
            print("   pnpm add -D typescript")
        return False
    
    return True

# Main execution
try:
    input_data = json.load(sys.stdin)
    tool_input = input_data.get('tool_input', {})
    file_path = tool_input.get('file_path', '')
    
    if not file_path:
        sys.exit(0)  # Nothing to format
    
    # Check if formatting tools are available
    if not check_formatting_tools():
        print("🔧 Auto-formatting skipped - install missing tools first")
        sys.exit(0)
    
    # Format the file
    if not format_file(file_path):
        print(f"⚠️ Some formatting issues in {file_path} - check output above")
    
except Exception as e:
    print(f"Error during auto-formatting: {e}", file=sys.stderr)
    sys.exit(0)  # Don't block on formatting errors