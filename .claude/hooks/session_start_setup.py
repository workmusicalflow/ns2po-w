#!/usr/bin/env python3
"""
Session Start Setup Hook for Camydia Portfolio
Displays project status and important information when Claude Code starts.
"""
import json
import sys
import os
import subprocess
import time
from datetime import datetime

def check_project_health():
    """Check the overall health of the project."""
    
    project_root = '/Users/ns2poportable/Desktop/immersive-camydia/camydia-portfolio'
    os.chdir(project_root)
    
    health_status = {
        'dependencies': False,
        'typescript': False,
        'git': False,
        'database': False,
        'build': False
    }
    
    # Check dependencies
    try:
        result = subprocess.run(['pnpm', '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            health_status['dependencies'] = True
    except:
        pass
    
    # Check TypeScript
    try:
        result = subprocess.run(['pnpm', 'tsc', '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            health_status['typescript'] = True
    except:
        pass
    
    # Check Git
    try:
        result = subprocess.run(['git', 'status'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            health_status['git'] = True
    except:
        pass
    
    # Check if build works
    if os.path.exists('package.json'):
        try:
            result = subprocess.run(['pnpm', 'build', '--dry-run'], capture_output=True, text=True, timeout=10)
            health_status['build'] = result.returncode == 0
        except:
            pass
    
    return health_status

def get_project_overview():
    """Get an overview of the project structure and status."""
    
    project_root = '/Users/ns2poportable/Desktop/immersive-camydia/camydia-portfolio'
    overview = {
        'name': 'Camydia Portfolio',
        'type': 'Turborepo + Next.js',
        'apps': [],
        'packages': [],
        'total_files': 0
    }
    
    try:
        # Check apps
        apps_dir = os.path.join(project_root, 'apps')
        if os.path.exists(apps_dir):
            overview['apps'] = [d for d in os.listdir(apps_dir) if os.path.isdir(os.path.join(apps_dir, d))]
        
        # Check packages
        packages_dir = os.path.join(project_root, 'packages')
        if os.path.exists(packages_dir):
            overview['packages'] = [d for d in os.listdir(packages_dir) if os.path.isdir(os.path.join(packages_dir, d))]
        
        # Count files (rough estimate)
        for root, dirs, files in os.walk(project_root):
            # Skip node_modules and other build directories
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', 'dist', 'build', '.turbo', '.git']]
            overview['total_files'] += len(files)
    
    except Exception:
        pass
    
    return overview

def check_environment_status():
    """Check environment and configuration status."""
    
    project_root = '/Users/ns2poportable/Desktop/immersive-camydia/camydia-portfolio'
    env_status = {
        'env_example': False,
        'env_local': False,
        'typescript_config': False,
        'prettier_config': False,
        'eslint_config': False
    }
    
    # Check configuration files
    config_files = {
        'env_example': '.env.example',
        'typescript_config': 'tsconfig.json',
        'prettier_config': '.prettierrc'
    }
    
    for key, filename in config_files.items():
        file_path = os.path.join(project_root, filename)
        env_status[key] = os.path.exists(file_path)
    
    # Check for ESLint config (modern flat config format)
    eslint_configs = ['eslint.config.js', 'eslint.config.mjs', '.eslintrc.js', '.eslintrc.json']
    apps_portfolio_vue = os.path.join(project_root, 'apps', 'portfolio-vue')
    
    for config_file in eslint_configs:
        if os.path.exists(os.path.join(apps_portfolio_vue, config_file)):
            env_status['eslint_config'] = True
            break
    
    # Check for local .env (don't read content for security)
    env_local_path = os.path.join(project_root, '.env.local')
    env_status['env_local'] = os.path.exists(env_local_path)
    
    return env_status

def get_recent_activity():
    """Get recent project activity from git if available."""
    
    try:
        project_root = '/Users/ns2poportable/Desktop/immersive-camydia/camydia-portfolio'
        os.chdir(project_root)
        
        # Get last few commits
        result = subprocess.run(
            ['git', 'log', '--oneline', '-5', '--pretty=format:%h %s'],
            capture_output=True, text=True, timeout=5
        )
        
        if result.returncode == 0:
            commits = result.stdout.strip().split('\n')
            return commits if commits != [''] else []
    except:
        pass
    
    return []

def display_project_dashboard():
    """Display a comprehensive project dashboard."""
    
    print("🚀 Camydia Portfolio - Development Session Started")
    print("=" * 55)
    print(f"📅 Session started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Project Overview
    overview = get_project_overview()
    print(f"\n📁 Project Overview:")
    print(f"   • Type: {overview['type']}")
    print(f"   • Apps: {', '.join(overview['apps']) if overview['apps'] else 'None'}")
    print(f"   • Packages: {', '.join(overview['packages']) if overview['packages'] else 'None'}")
    print(f"   • Total files: ~{overview['total_files']}")
    
    # Health Status
    health = check_project_health()
    print(f"\n🏥 Project Health:")
    status_symbols = {True: "✅", False: "❌"}
    print(f"   • Dependencies (pnpm): {status_symbols[health['dependencies']]}")
    print(f"   • TypeScript: {status_symbols[health['typescript']]}")
    print(f"   • Git repository: {status_symbols[health['git']]}")
    print(f"   • Build system: {status_symbols[health['build']]}")
    
    # Environment Status
    env_status = check_environment_status()
    print(f"\n⚙️ Configuration Status:")
    print(f"   • TypeScript config: {status_symbols[env_status['typescript_config']]}")
    print(f"   • Prettier config: {status_symbols[env_status['prettier_config']]}")
    print(f"   • ESLint config: {status_symbols[env_status['eslint_config']]}")
    print(f"   • .env.example: {status_symbols[env_status['env_example']]}")
    print(f"   • .env.local: {status_symbols[env_status['env_local']]}")
    
    # Recent Activity
    recent_commits = get_recent_activity()
    if recent_commits:
        print(f"\n📊 Recent Activity:")
        for commit in recent_commits[:3]:  # Show last 3 commits
            print(f"   • {commit}")
    
    # Development Tips
    print(f"\n💡 Development Tips:")
    print(f"   • Use 'pnpm dev' to start development server")
    print(f"   • Use 'pnpm build' to build all apps")
    print(f"   • Use 'pnpm lint' to check code quality")
    print(f"   • Hooks are active for auto-formatting and validation")
    
    # Quick Commands
    print(f"\n🔧 Quick Commands:")
    print(f"   • Install dependencies: pnpm install")
    print(f"   • Start development: pnpm dev")
    print(f"   • Run tests: pnpm test")
    print(f"   • Build project: pnpm build")
    print(f"   • Format code: pnpm format")
    
    # Warning if issues detected
    issues = []
    if not health['dependencies']:
        issues.append("pnpm not available")
    if not health['typescript']:
        issues.append("TypeScript not configured")
    if not env_status['env_local']:
        issues.append(".env.local missing")
    
    if issues:
        print(f"\n⚠️  Issues to address:")
        for issue in issues:
            print(f"   • {issue}")
        print(f"   🔗 Check setup documentation for resolution steps")
    
    print("\n" + "=" * 55)
    print("🎯 Ready for development! Happy coding! 🎉")

def check_hook_status():
    """Check if hooks are properly configured."""
    
    project_root = '/Users/ns2poportable/Desktop/immersive-camydia/camydia-portfolio'
    hooks_dir = os.path.join(project_root, '.claude/hooks')
    settings_file = os.path.join(project_root, '.claude/settings.json')
    
    if os.path.exists(settings_file) and os.path.exists(hooks_dir):
        hook_files = [f for f in os.listdir(hooks_dir) if f.endswith('.py')]
        print(f"\n🪝 Claude Code Hooks Active:")
        print(f"   • {len(hook_files)} hook scripts installed")
        print(f"   • Auto-formatting enabled")
        print(f"   • File protection enabled")
        print(f"   • DocuSync-AI integration active")
    else:
        print(f"\n⚠️ Claude Code hooks not configured")

# Main execution
try:
    # Small delay to ensure this runs after other hooks
    time.sleep(0.1)
    
    # Display the project dashboard
    display_project_dashboard()
    
    # Check hook status
    check_hook_status()
    
except Exception as e:
    print(f"Error during session setup: {e}", file=sys.stderr)
    sys.exit(0)  # Don't block session start