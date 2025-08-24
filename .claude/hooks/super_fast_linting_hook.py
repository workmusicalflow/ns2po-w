#!/usr/bin/env python3
"""
Super Fast Linting Hook for NS2PO Platform
Ultra-optimized hook with intelligent caching, parallelization, and performance monitoring.
"""
import json
import sys
import os
import subprocess
import hashlib
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Tuple

# Performance tracking
PERFORMANCE_LOG = "/tmp/claude_hook_performance.log"

def log_performance(operation: str, duration: float, file_path: str):
    """Log performance metrics for analysis."""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(PERFORMANCE_LOG, "a") as f:
        f.write(f"{timestamp} | {operation:<15} | {duration:>6.3f}s | {file_path}\n")

def log_message(message: str, level: str = "INFO"):
    """Log messages with proper formatting."""
    icons = {"INFO": "ℹ️", "SUCCESS": "✅", "WARNING": "⚠️", "ERROR": "❌", "PERF": "🚀"}
    print(f"{icons.get(level, 'ℹ️')} {message}")

def get_file_hash(file_path: str) -> Optional[str]:
    """Generate MD5 hash for file content caching."""
    try:
        if not os.path.exists(file_path):
            return None
        with open(file_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    except Exception:
        return None

def is_file_cached_and_valid(file_path: str, cache_dir: str) -> bool:
    """Check if file is already processed and unchanged."""
    file_hash = get_file_hash(file_path)
    if not file_hash:
        return False
    
    cache_file = Path(cache_dir) / f"{Path(file_path).name}.{file_hash}.cache"
    return cache_file.exists()

def mark_file_cached(file_path: str, cache_dir: str):
    """Mark file as successfully processed."""
    file_hash = get_file_hash(file_path)
    if not file_hash:
        return
    
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = Path(cache_dir) / f"{Path(file_path).name}.{file_hash}.cache"
    cache_file.touch()
    
    # Clean old cache files for this file
    file_name = Path(file_path).name
    for old_cache in Path(cache_dir).glob(f"{file_name}.*.cache"):
        if old_cache != cache_file:
            old_cache.unlink(missing_ok=True)

def is_relevant_file(file_path: str) -> bool:
    """Optimized file relevance check."""
    if not file_path:
        return False
    
    # Quick extension check
    relevant_exts = {'.ts', '.tsx', '.js', '.jsx', '.vue'}
    if not any(file_path.endswith(ext) for ext in relevant_exts):
        return False
    
    # Optimized skip directories check
    skip_patterns = {'/node_modules/', '/dist/', '/build/', '/.next/', '/.turbo/', '/.git/', '/coverage/'}
    if any(pattern in file_path for pattern in skip_patterns):
        return False
    
    return True

def get_project_context(file_path: str) -> Tuple[str, str, str]:
    """Get project context with caching support."""
    project_root = "/Users/ns2poportable/Desktop/ns2po-w"
    
    if "/apps/election-mvp/" in file_path:
        work_dir = f"{project_root}/apps/election-mvp"
        cache_dir = f"{work_dir}/.claude-cache"
        context = "election-mvp"
    elif "/packages/ui/" in file_path:
        work_dir = f"{project_root}/packages/ui"
        cache_dir = f"{work_dir}/.claude-cache"
        context = "ui-package"
    else:
        work_dir = project_root
        cache_dir = f"{work_dir}/.claude-cache"
        context = "root"
    
    return work_dir, cache_dir, context

def run_command_fast(cmd: List[str], cwd: str, timeout: int = 15) -> Optional[subprocess.CompletedProcess]:
    """Optimized command execution with shorter timeout."""
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
        log_message(f"Command timed out ({timeout}s): {' '.join(cmd)}", "WARNING")
        return None
    except Exception as e:
        log_message(f"Command failed: {' '.join(cmd)} - {e}", "ERROR")
        return None

def lint_file_task(tool: str, file_path: str, work_dir: str) -> Tuple[str, bool, str]:
    """Individual linting task for parallel execution."""
    start_time = time.time()
    
    if tool == "eslint":
        result = run_command_fast(
            ["pnpm", "exec", "eslint", "--fix", "--cache", file_path],
            work_dir
        )
        success = result and result.returncode in [0, 1]  # 0=no issues, 1=fixed issues
        output = result.stdout if result else "Command failed"
        
    elif tool == "prettier":
        result = run_command_fast(
            ["pnpm", "exec", "prettier", "--write", "--cache", file_path],
            work_dir
        )
        success = result and result.returncode == 0
        output = "Formatted" if success else (result.stderr if result else "Command failed")
        
    elif tool == "typescript":
        if not file_path.endswith(('.ts', '.tsx')):
            return tool, True, "Skipped (not TypeScript)"
        
        result = run_command_fast(
            ["pnpm", "exec", "tsc", "--noEmit", "--skipLibCheck", "--pretty"],
            work_dir
        )
        success = result and result.returncode == 0
        
        if success:
            output = "No type errors"
        elif result:
            # Filter only relevant errors for this file
            lines = result.stdout.split('\n')
            relevant_lines = [line for line in lines if file_path in line or 'error TS' in line]
            output = '\n'.join(relevant_lines[:3]) if relevant_lines else "Type errors found"
        else:
            output = "Command failed"
    
    duration = time.time() - start_time
    log_performance(f"{tool}_check", duration, file_path)
    
    return tool, success, output

def lint_file_parallel(file_path: str) -> bool:
    """Ultra-fast parallel linting of a single file."""
    if not is_relevant_file(file_path):
        return True
    
    if not os.path.exists(file_path):
        log_message(f"File not found: {file_path}", "WARNING")
        return True
    
    work_dir, cache_dir, context = get_project_context(file_path)
    
    # Check cache first
    if is_file_cached_and_valid(file_path, cache_dir):
        log_message(f"🚀 CACHED: {file_path} (skipped)", "PERF")
        return True
    
    log_message(f"🔍 Fast Linting: {file_path} ({context})")
    start_time = time.time()
    
    # Check if pnpm is available once
    pnpm_check = run_command_fast(["pnpm", "--version"], work_dir, timeout=3)
    if not pnpm_check or pnpm_check.returncode != 0:
        log_message("pnpm not available - skipping linting", "WARNING")
        return True
    
    # Parallel execution of linting tools
    tools_to_run = ["eslint", "prettier", "typescript"]
    results = {}
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_tool = {
            executor.submit(lint_file_task, tool, file_path, work_dir): tool
            for tool in tools_to_run
        }
        
        for future in as_completed(future_to_tool):
            tool, success, output = future.result()
            results[tool] = (success, output)
    
    # Process results
    overall_success = True
    for tool, (success, output) in results.items():
        if success:
            log_message(f"{tool.capitalize()}: ✅ {output}", "SUCCESS")
        else:
            log_message(f"{tool.capitalize()}: ⚠️ {output}", "WARNING")
            if tool == "eslint":  # ESLint issues are not blocking
                continue
            overall_success = False
    
    total_duration = time.time() - start_time
    log_performance("total_lint", total_duration, file_path)
    
    # Mark as cached if successful
    if overall_success:
        mark_file_cached(file_path, cache_dir)
    
    log_message(f"🎯 Completed in {total_duration:.2f}s", "PERF")
    return overall_success

def cleanup_old_caches():
    """Clean up old cache files (older than 7 days)."""
    try:
        project_root = "/Users/ns2poportable/Desktop/ns2po-w"
        cache_dirs = [
            f"{project_root}/.claude-cache",
            f"{project_root}/apps/election-mvp/.claude-cache",
            f"{project_root}/packages/ui/.claude-cache"
        ]
        
        cutoff_time = time.time() - (7 * 24 * 60 * 60)  # 7 days
        
        for cache_dir in cache_dirs:
            if os.path.exists(cache_dir):
                for cache_file in Path(cache_dir).glob("*.cache"):
                    if cache_file.stat().st_mtime < cutoff_time:
                        cache_file.unlink(missing_ok=True)
    except Exception:
        pass  # Silent cleanup failure

def main():
    """Main execution with enhanced error handling and performance tracking."""
    overall_start = time.time()
    
    try:
        # Parse input
        if not sys.stdin.isatty():
            input_data = json.load(sys.stdin)
            tool_input = input_data.get('tool_input', {})
            file_path = tool_input.get('file_path', '')
        else:
            # Manual execution
            file_path = sys.argv[1] if len(sys.argv) > 1 else ''
        
        if not file_path:
            log_message("No file path provided", "INFO")
            return
        
        # Cleanup old caches periodically
        cleanup_old_caches()
        
        # Execute fast linting
        success = lint_file_parallel(file_path)
        
        overall_duration = time.time() - overall_start
        log_performance("hook_total", overall_duration, file_path)
        
        if success:
            log_message(f"🚀 Super Fast Linting completed in {overall_duration:.2f}s", "SUCCESS")
        else:
            log_message(f"⚠️ Linting completed with issues in {overall_duration:.2f}s", "WARNING")
        
    except json.JSONDecodeError:
        log_message("Invalid JSON input - running in manual mode", "WARNING")
        if len(sys.argv) > 1:
            lint_file_parallel(sys.argv[1])
    except Exception as e:
        log_message(f"Unexpected error: {e}", "ERROR")

if __name__ == "__main__":
    main()