#!/usr/bin/env python3
"""
TypeScript Strict Enforcer for NS2PO Platform
Enforces strict TypeScript practices and prevents common type-safety issues.
"""
import json
import sys
import os
import re
import subprocess

def check_strict_typescript(file_path, content):
    """Check TypeScript file for strict mode compliance."""
    
    # Only check TypeScript files
    if not file_path.endswith(('.ts', '.tsx')):
        return True
    
    # Skip declaration files and node_modules
    if file_path.endswith('.d.ts') or 'node_modules' in file_path:
        return True
    
    violations = []
    
    # Check for any usage
    any_usage = re.findall(r'\b:\s*any\b', content)
    if any_usage:
        violations.append(f"Found {len(any_usage)} 'any' type usage(s)")
    
    # Check for non-null assertions without proper checks
    non_null_assertions = re.findall(r'!\s*\.', content)
    if non_null_assertions:
        violations.append(f"Found {len(non_null_assertions)} non-null assertion(s) - consider optional chaining")
    
    # Check for console.log (should use proper logging)
    console_logs = re.findall(r'console\.log\s*\(', content)
    if console_logs:
        violations.append(f"Found {len(console_logs)} console.log statement(s) - use proper logging")
    
    # Check for empty catch blocks
    empty_catch = re.findall(r'catch\s*\([^)]*\)\s*\{\s*\}', content, re.MULTILINE)
    if empty_catch:
        violations.append(f"Found {len(empty_catch)} empty catch block(s)")
    
    # Check for missing return type annotations on functions
    function_no_return = re.findall(r'function\s+\w+\s*\([^)]*\)\s*\{', content)
    arrow_no_return = re.findall(r'=\s*\([^)]*\)\s*=>\s*\{', content)
    if function_no_return or arrow_no_return:
        total = len(function_no_return) + len(arrow_no_return)
        violations.append(f"Found {total} function(s) without explicit return types")
    
    # Check for TODO/FIXME comments
    todos = re.findall(r'//\s*(TODO|FIXME|HACK)', content, re.IGNORECASE)
    if todos:
        violations.append(f"Found {len(todos)} TODO/FIXME comment(s) - consider creating issues")
    
    # Check for disabled ESLint rules
    eslint_disable = re.findall(r'eslint-disable', content)
    if eslint_disable:
        violations.append(f"Found {len(eslint_disable)} ESLint disable comment(s)")
    
    # Check for missing error handling in async functions
    async_no_try = re.findall(r'async\s+function[^{]*\{[^}]*(?!.*try).*\}', content, re.DOTALL)
    if async_no_try:
        violations.append(f"Found async function(s) without try-catch blocks")
    
    if violations:
        print(f"🔷 TypeScript strict violations in {file_path}:")
        for violation in violations[:5]:  # Limit output
            print(f"  • {violation}")
        if len(violations) > 5:
            print(f"  • ... and {len(violations) - 5} more issues")
        
        print("\n💡 Strict TypeScript recommendations:")
        print("  • Replace 'any' with specific types")
        print("  • Use optional chaining (?.) instead of non-null assertions")
        print("  • Add explicit return type annotations")
        print("  • Handle errors properly in async functions")
        print("  • Remove console.log statements before production")
        
        return False
    
    return True

def run_typescript_check(file_path):
    """Run TypeScript compiler with strict checks."""
    
    if not file_path.endswith(('.ts', '.tsx')):
        return True
    
    project_root = '/Users/ns2poportable/Desktop/ns2po-w'
    os.chdir(project_root)
    
    try:
        # Run strict TypeScript check
        tsc_result = subprocess.run(
            ['pnpm', 'tsc', '--noEmit', '--strict', '--skipLibCheck', file_path],
            capture_output=True,
            text=True,
            timeout=20
        )
        
        if tsc_result.returncode == 0:
            print(f"✅ TypeScript strict check: {file_path}")
            return True
        else:
            print(f"🔷 TypeScript strict errors in {file_path}:")
            if tsc_result.stderr:
                # Parse and show relevant errors
                error_lines = tsc_result.stderr.split('\n')
                relevant_errors = [line for line in error_lines if file_path in line or 'error TS' in line]
                for error in relevant_errors[:3]:  # Show first 3 errors
                    if error.strip():
                        print(f"   {error}")
                if len(relevant_errors) > 3:
                    print(f"   ... and {len(relevant_errors) - 3} more errors")
            
            print("💡 Fix TypeScript strict errors before proceeding")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"⏰ TypeScript check timeout on {file_path}")
        return False
    except Exception as e:
        print(f"❌ TypeScript check error: {e}")
        return False

def check_tsconfig_strict(project_root):
    """Check if tsconfig.json has strict mode enabled."""
    
    tsconfig_paths = [
        os.path.join(project_root, 'tsconfig.json'),
        os.path.join(project_root, 'apps/election-mvp/tsconfig.json'),
        os.path.join(project_root, 'packages/ui/tsconfig.json'),
        os.path.join(project_root, 'packages/types/tsconfig.json'),
    ]
    
    for tsconfig_path in tsconfig_paths:
        if os.path.exists(tsconfig_path):
            try:
                with open(tsconfig_path, 'r') as f:
                    content = f.read()
                
                # Check for strict mode
                if '"strict": true' not in content and '"strict":true' not in content:
                    rel_path = os.path.relpath(tsconfig_path, project_root)
                    print(f"⚠️ Strict mode not enabled in {rel_path}")
                    print("💡 Add '\"strict\": true' to compilerOptions")
                    
            except Exception:
                pass

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
        sys.exit(0)  # Nothing to check
    
    # Make path relative for cleaner output
    project_root = '/Users/ns2poportable/Desktop/ns2po-w'
    if file_path.startswith(project_root):
        display_path = file_path.replace(project_root + '/', '')
    else:
        display_path = file_path
    
    # Check TypeScript strict compliance
    strict_ok = True
    if content:
        strict_ok = check_strict_typescript(display_path, content)
    
    # Run TypeScript compiler strict check
    if os.path.exists(file_path):
        compiler_ok = run_typescript_check(file_path)
        strict_ok = strict_ok and compiler_ok
    
    # Check tsconfig.json strict settings (only for TypeScript files)
    if file_path.endswith(('.ts', '.tsx')):
        check_tsconfig_strict(project_root)
    
    if not strict_ok:
        print(f"\n🔷 TypeScript strict mode violations detected in {display_path}")
        print("🔗 Learn more: https://www.typescriptlang.org/tsconfig#strict")
        # Don't block - just warn for now
    
except Exception as e:
    print(f"Error checking TypeScript strict mode: {e}", file=sys.stderr)
    sys.exit(0)  # Don't block on check errors