#!/usr/bin/env python3
"""
Enhanced Linting and Formatting Hook for NS2PO Platform
Automatically runs ESLint, Prettier, and TypeScript checks after code modifications.
"""
import json
import sys
import os
import subprocess
from pathlib import Path

def log_message(message, level="INFO"):
    """Log messages with proper formatting."""
    icons = {"INFO": "ℹ️", "SUCCESS": "✅", "WARNING": "⚠️", "ERROR": "❌"}
    print(f"{icons.get(level, 'ℹ️')} {message}")

def is_relevant_file(file_path):
    """Check if file should be linted/formatted."""
    if not file_path:
        return False
    
    # Relevant extensions
    relevant_exts = ['.ts', '.tsx', '.js', '.jsx', '.vue']
    if not any(file_path.endswith(ext) for ext in relevant_exts):
        return False
    
    # Skip directories to avoid
    skip_dirs = ['node_modules', 'dist', 'build', '.next', '.turbo', '.git', 'coverage']
    if any(skip_dir in file_path for skip_dir in skip_dirs):
        return False
    
    return True

def run_command(cmd, cwd, timeout=30):
    """Run a command and return result."""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return result
    except subprocess.TimeoutExpired:
        log_message(f"Command timed out: {' '.join(cmd)}", "WARNING")
        return None
    except Exception as e:
        log_message(f"Command failed: {' '.join(cmd)} - {e}", "ERROR")
        return None

def get_project_paths(file_path):
    """Determine correct project paths based on file location."""
    project_root = Path("/Users/ns2poportable/Desktop/ns2po-w")
    election_mvp = project_root / "apps" / "election-mvp"
    ui_package = project_root / "packages" / "ui"
    
    file_path_obj = Path(file_path)
    
    # Determine which workspace to use
    if "/apps/election-mvp/" in file_path:
        return str(election_mvp), "election-mvp"
    elif "/packages/ui/" in file_path:
        return str(ui_package), "ui-package"
    else:
        return str(project_root), "root"

def lint_file(file_path):
    """Run comprehensive linting on a file."""
    if not is_relevant_file(file_path):
        return True
    
    if not os.path.exists(file_path):
        log_message(f"File not found: {file_path}", "WARNING")
        return True
    
    log_message(f"🔍 Linting: {file_path}")
    
    # Get correct working directory
    work_dir, context = get_project_paths(file_path)
    log_message(f"Working in {context} context: {work_dir}")
    
    success = True
    
    # 1. Run ESLint with fix
    eslint_result = run_command(
        ["pnpm", "exec", "eslint", "--fix", file_path],
        work_dir
    )
    
    if eslint_result:
        if eslint_result.returncode == 0:
            log_message(f"ESLint: No issues found", "SUCCESS")
        elif eslint_result.returncode == 1:
            log_message(f"ESLint: Fixed issues automatically", "SUCCESS")
        else:
            log_message(f"ESLint: Found unfixable issues", "WARNING")
            if eslint_result.stdout.strip():
                print(eslint_result.stdout)
    
    # 2. Run Prettier
    prettier_result = run_command(
        ["pnpm", "exec", "prettier", "--write", file_path],
        work_dir
    )
    
    if prettier_result and prettier_result.returncode == 0:
        log_message(f"Prettier: Formatted successfully", "SUCCESS")
    elif prettier_result:
        log_message(f"Prettier: Issues found", "WARNING")
        if prettier_result.stderr.strip():
            print(prettier_result.stderr)
    
    # 3. TypeScript check for .ts/.tsx files
    if file_path.endswith(('.ts', '.tsx')):
        tsc_result = run_command(
            ["pnpm", "exec", "tsc", "--noEmit", "--skipLibCheck"],
            work_dir
        )
        
        if tsc_result and tsc_result.returncode == 0:
            log_message(f"TypeScript: No type errors", "SUCCESS")
        elif tsc_result:
            log_message(f"TypeScript: Type errors found", "WARNING")
            if tsc_result.stdout.strip():
                # Show relevant errors only
                lines = tsc_result.stdout.split('\n')
                relevant_lines = [line for line in lines if file_path in line or 'error TS' in line]
                if relevant_lines:
                    print('\n'.join(relevant_lines[:5]))  # Max 5 errors
    
    return success

def main():
    """Main execution function."""
    try:
        # Try to read JSON input, but don't fail if there's none
        if not sys.stdin.isatty():
            input_data = json.load(sys.stdin)
            tool_input = input_data.get('tool_input', {})
            file_path = tool_input.get('file_path', '')
        else:
            # Manual execution or testing
            file_path = sys.argv[1] if len(sys.argv) > 1 else ''
        
        if not file_path:
            log_message("No file path provided", "INFO")
            return
        
        # Check if tools are available
        project_root = "/Users/ns2poportable/Desktop/ns2po-w"
        
        # Quick tool check
        tools_check = run_command(["pnpm", "--version"], project_root, timeout=5)
        if not tools_check or tools_check.returncode != 0:
            log_message("pnpm not available - skipping linting", "WARNING")
            return
        
        # Run the linting
        lint_file(file_path)
        log_message("🎯 Linting completed", "SUCCESS")
        
    except json.JSONDecodeError:
        log_message("Invalid JSON input - running in manual mode", "WARNING")
        # Could still work if file path is provided as argument
        if len(sys.argv) > 1:
            lint_file(sys.argv[1])
    except Exception as e:
        log_message(f"Unexpected error: {e}", "ERROR")
        return

if __name__ == "__main__":
    main()