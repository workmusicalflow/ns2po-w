#!/usr/bin/env python3
"""
NS2PO Platform Session Start Dashboard
Architecture inspirée de JELI avec adaptations spécifiques NS2PO
Version: 1.0 | Date: 2025-01-16
"""
import json
import sys
import os
import subprocess
import time
from datetime import datetime
from pathlib import Path

def get_project_root():
    """Get the project root directory from environment or fallback."""
    return os.environ.get('CLAUDE_PROJECT_DIR', '/Users/logansery/Documents/ns2po-w')

def check_project_health():
    """Check the overall health of the NS2PO project."""
    
    project_root = get_project_root()
    
    health_status = {
        'pnpm': False,
        'typescript': False,
        'git': False,
        'cloudinary': False,
        'turso': False,
        'smtp': False
    }
    
    # Check pnpm
    try:
        result = subprocess.run(['pnpm', '--version'], capture_output=True, text=True, timeout=5, cwd=project_root)
        health_status['pnpm'] = result.returncode == 0
    except:
        pass
    
    # Check TypeScript
    try:
        result = subprocess.run(['pnpm', 'exec', 'tsc', '--version'], capture_output=True, text=True, timeout=5, cwd=project_root)
        health_status['typescript'] = result.returncode == 0
    except:
        pass
    
    # Check Git
    try:
        result = subprocess.run(['git', 'status'], capture_output=True, text=True, timeout=5, cwd=project_root)
        health_status['git'] = result.returncode == 0
    except:
        pass
    
    # Check for environment configuration
    env_files = ['.env.local', '.env']
    for env_file in env_files:
        env_path = os.path.join(project_root, 'apps/election-mvp', env_file)
        if os.path.exists(env_path):
            try:
                with open(env_path, 'r') as f:
                    env_content = f.read()
                    health_status['cloudinary'] = 'CLOUDINARY_CLOUD_NAME' in env_content
                    health_status['turso'] = 'TURSO_DATABASE_URL' in env_content
                    health_status['smtp'] = 'SMTP_HOST' in env_content
                    break
            except:
                pass
    
    return health_status

def get_project_overview():
    """Get an overview of the NS2PO project structure."""
    
    project_root = get_project_root()
    overview = {
        'name': 'NS2PO Platform - Election MVP',
        'type': 'Turborepo Monorepo + Nuxt 3 + TypeScript',
        'architecture': 'Multi-package avec UI partagée',
        'apps': [],
        'packages': [],
        'total_files': 0,
        'bundles_count': 8  # Bundles statiques de fallback
    }
    
    try:
        # Check apps
        apps_dir = os.path.join(project_root, 'apps')
        if os.path.exists(apps_dir):
            overview['apps'] = [d for d in os.listdir(apps_dir) 
                              if os.path.isdir(os.path.join(apps_dir, d)) and not d.startswith('.')]
        
        # Check packages
        packages_dir = os.path.join(project_root, 'packages')
        if os.path.exists(packages_dir):
            overview['packages'] = [d for d in os.listdir(packages_dir) 
                                  if os.path.isdir(os.path.join(packages_dir, d)) and not d.startswith('.')]
        
        # Count files (rough estimate, exclude node_modules)
        for root, dirs, files in os.walk(project_root):
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.nuxt', 'dist', '.turbo', '.git']]
            overview['total_files'] += len(files)
    
    except:
        pass
    
    return overview

def check_code_quality():
    """Check code quality using local tools (ESLint, TypeScript)."""
    
    project_root = get_project_root()
    quality_status = {
        'typescript_errors': None,
        'eslint_issues': None,
        'tests_status': 'unknown'
    }
    
    try:
        # Check TypeScript errors
        app_path = os.path.join(project_root, 'apps/election-mvp')
        result = subprocess.run(
            ['pnpm', 'exec', 'tsc', '--noEmit', '--project', 'tsconfig.json'],
            capture_output=True, text=True, timeout=10, cwd=app_path
        )
        
        if result.returncode == 0:
            quality_status['typescript_errors'] = 0
        else:
            # Count errors in output
            error_lines = [line for line in result.stdout.split('\n') if 'error' in line.lower()]
            quality_status['typescript_errors'] = len(error_lines)
    except:
        pass
    
    try:
        # Check ESLint issues (if configured)
        result = subprocess.run(
            ['pnpm', 'lint', '--format', 'compact'],
            capture_output=True, text=True, timeout=10, cwd=project_root
        )
        
        if 'problems' in result.stdout.lower():
            # Extract problem count from ESLint output
            import re
            match = re.search(r'(\d+)\s+problems?', result.stdout)
            if match:
                quality_status['eslint_issues'] = int(match.group(1))
            else:
                quality_status['eslint_issues'] = 'unknown'
        elif result.returncode == 0:
            quality_status['eslint_issues'] = 0
    except:
        pass
    
    return quality_status

def get_recent_activity():
    """Get recent project activity from git."""
    
    try:
        project_root = get_project_root()
        
        # Get last few commits
        result = subprocess.run(
            ['git', 'log', '--oneline', '-5', '--pretty=format:%h %s'],
            capture_output=True, text=True, timeout=5, cwd=project_root
        )
        
        if result.returncode == 0:
            commits = result.stdout.strip().split('\n')
            return commits if commits != [''] else []
        
        return []
    except:
        return []

def get_git_status():
    """Get current git status with modified files."""
    
    try:
        project_root = get_project_root()
        
        # Get git status
        result = subprocess.run(
            ['git', 'status', '--short'],
            capture_output=True, text=True, timeout=5, cwd=project_root
        )
        
        if result.returncode == 0 and result.stdout:
            return result.stdout.strip().split('\n')[:10]  # Max 10 files
        
        return []
    except:
        return []

def check_mcp_servers():
    """Check status of MCP servers."""
    
    mcp_status = {
        'task-master': False,
        'airtable': False,
        'gemini-copilot': False,
        'gpt5-copilot': False,
        'git-master': False,
        'eslint-master': False,
        'docusync': False
    }
    
    # Simple check based on settings.json presence
    project_root = get_project_root()
    settings_path = os.path.join(project_root, '.claude/settings.json')
    
    if os.path.exists(settings_path):
        try:
            with open(settings_path, 'r') as f:
                settings = json.load(f)
                permissions = settings.get('permissions', {}).get('allow', [])
                
                for perm in permissions:
                    if 'task-master' in perm:
                        mcp_status['task-master'] = True
                    elif 'airtable' in perm:
                        mcp_status['airtable'] = True
                    elif 'gemini-copilot' in perm:
                        mcp_status['gemini-copilot'] = True
                    elif 'gpt5-copilot' in perm:
                        mcp_status['gpt5-copilot'] = True
                    elif 'git-master' in perm:
                        mcp_status['git-master'] = True
                    elif 'eslint-master' in perm:
                        mcp_status['eslint-master'] = True
                    elif 'docusync' in perm:
                        mcp_status['docusync'] = True
        except:
            pass
    
    return mcp_status

def display_ns2po_dashboard():
    """Display comprehensive NS2PO project dashboard."""
    
    print("\n" + "=" * 70)
    print("🚀 NS2PO Platform - Election MVP Dashboard")
    print("=" * 70)
    print(f"📅 Session: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Mission: Plateforme de gadgets personnalisés pour campagnes électorales")
    
    # Project Overview
    overview = get_project_overview()
    print(f"\n📁 Vue d'ensemble du projet:")
    print(f"   • Type: {overview['type']}")
    print(f"   • Architecture: {overview['architecture']}")
    print(f"   • Apps: {', '.join(overview['apps']) if overview['apps'] else 'Non trouvé'}")
    print(f"   • Packages: {', '.join(overview['packages']) if overview['packages'] else 'Non trouvé'}")
    print(f"   • Bundles configurés: {overview['bundles_count']} (fallback statique)")
    print(f"   • Total fichiers: ~{overview['total_files']:,}")
    
    # Health Status
    health = check_project_health()
    print(f"\n🏥 Santé du projet:")
    status_symbols = {True: "✅", False: "❌"}
    print(f"   • pnpm workspace: {status_symbols[health['pnpm']]}")
    print(f"   • TypeScript: {status_symbols[health['typescript']]}")
    print(f"   • Git: {status_symbols[health['git']]}")
    print(f"   • Cloudinary CDN: {status_symbols[health['cloudinary']]}")
    print(f"   • Turso Database: {status_symbols[health['turso']]}")
    print(f"   • SMTP Email: {status_symbols[health['smtp']]}")
    
    # Code Quality (sans SonarCloud)
    quality = check_code_quality()
    print(f"\n📊 Qualité du code (local):")
    
    if quality['typescript_errors'] is not None:
        if quality['typescript_errors'] == 0:
            print(f"   • TypeScript: ✅ Aucune erreur")
        else:
            print(f"   • TypeScript: ⚠️  {quality['typescript_errors']} erreur(s)")
    else:
        print(f"   • TypeScript: ⏸️  Non vérifié")
    
    if quality['eslint_issues'] is not None:
        if quality['eslint_issues'] == 0:
            print(f"   • ESLint: ✅ Code propre")
        elif isinstance(quality['eslint_issues'], int):
            print(f"   • ESLint: ⚠️  {quality['eslint_issues']} problème(s)")
        else:
            print(f"   • ESLint: ⏸️  État inconnu")
    else:
        print(f"   • ESLint: ⏸️  Non configuré")
    
    # MCP Servers Status
    mcp = check_mcp_servers()
    active_mcps = [name for name, status in mcp.items() if status]
    if active_mcps:
        print(f"\n🤖 MCP Servers actifs:")
        for server in active_mcps:
            print(f"   • {server}: ✅")
    
    # Git Status
    git_files = get_git_status()
    if git_files:
        print(f"\n📝 Fichiers modifiés (git status):")
        for file_status in git_files[:5]:  # Show max 5
            print(f"   {file_status}")
        if len(git_files) > 5:
            print(f"   ... et {len(git_files) - 5} autres")
    
    # Recent Activity
    recent_commits = get_recent_activity()
    if recent_commits:
        print(f"\n🕐 Activité récente (derniers commits):")
        for commit in recent_commits[:3]:
            print(f"   • {commit}")
    
    # Key Features NS2PO
    print(f"\n✨ Features Clés NS2PO:")
    print(f"   • Interface /devis multi-étapes")
    print(f"   • 8 bundles de campagne pré-configurés")
    print(f"   • Fallback intelligent API → Static")
    print(f"   • Personnalisation visuelle temps réel")
    print(f"   • Export PDF des devis")
    print(f"   • Mobile-first responsive design")
    
    # Development Commands
    print(f"\n🔧 Commandes essentielles:")
    print(f"   • pnpm dev          - Démarrer le serveur de développement")
    print(f"   • pnpm build        - Build de production")
    print(f"   • pnpm test         - Tests Vitest")
    print(f"   • pnpm lint         - Vérification ESLint")
    print(f"   • pnpm type-check   - Validation TypeScript")
    
    # Quality Commands
    print(f"\n✅ Commandes qualité:")
    print(f"   • pnpm lint:fix     - Corriger automatiquement le linting")
    print(f"   • pnpm test:e2e     - Tests E2E Playwright")
    print(f"   • pnpm test:watch   - Tests en mode watch")
    
    # Issues to address
    issues = []
    if not health['pnpm']:
        issues.append("pnpm non disponible - installer avec: npm install -g pnpm")
    if not health['cloudinary']:
        issues.append("Cloudinary non configuré - vérifier CLOUDINARY_CLOUD_NAME")
    if not health['turso']:
        issues.append("Turso non configuré - vérifier TURSO_DATABASE_URL")
    
    if quality['typescript_errors'] and quality['typescript_errors'] > 0:
        issues.append(f"TypeScript: {quality['typescript_errors']} erreur(s) à corriger")
    
    if issues:
        print(f"\n⚠️  Points d'attention:")
        for issue in issues:
            print(f"   • {issue}")
    
    # NS2PO Principles
    print(f"\n💡 Principes NS2PO:")
    print(f"   • Mobile-first, desktop-enhanced")
    print(f"   • Performance < 2s First Contentful Paint")
    print(f"   • Fallback intelligent pour résilience")
    print(f"   • TypeScript strict pour fiabilité")
    print(f"   • Architecture monorepo scalable")
    
    # POST-MIGRATION STATUS
    print(f"\n🚀 ARCHITECTURE POST-MIGRATION:")
    print(f"   • Status: ✅ MIGRATION AIRTABLE → TURSO 100% TERMINÉE")
    print(f"   • Base Turso: ns2po-election-mvp (10 tables opérationnelles)")
    print(f"   • Sources de données: Turso + Cloudinary Auto-discovery")
    print(f"   • Économies réalisées: 240€/an (abandon Airtable)")
    print(f"   • Commande task-master: pnpm exec task-master next-task")

    # Recommandations pour la session
    print(f"\n📋 Recommandations pour cette session:")

    if git_files:
        print(f"   1. Reviewer les changements non commités")

    if quality['typescript_errors'] and quality['typescript_errors'] > 0:
        print(f"   2. Corriger les erreurs TypeScript avec: pnpm type-check")

    if not health['turso']:
        print(f"   3. Configurer TURSO_DATABASE_URL (base existante découverte)")

    print(f"   • Utiliser task-master pour tracking migration: pnpm exec task-master status")
    print(f"   • Documentation migration: docs/MIGRATION-AIRTABLE-TURSO-PLAN.md")
    print(f"   • Sprint planning: docs/SPRINT-PLANNING-MIGRATION.md")
    
    print("\n" + "=" * 70)
    print("🎯 Prêt pour le développement NS2PO! Bonne session! 🚀")
    print("💡 Tip: Utilisez /help pour voir toutes les commandes disponibles")
    print("=" * 70 + "\n")

# Main execution
def main():
    """Main function with error handling."""
    try:
        # Read input from hook (required but not used for SessionStart)
        input_data = json.load(sys.stdin)
        
        # Small delay to ensure proper display
        time.sleep(0.1)
        
        # Display the NS2PO dashboard
        display_ns2po_dashboard()
        
    except Exception as e:
        # Graceful error handling - don't block session start
        print(f"⚠️  Hook SessionStart: {e}", file=sys.stderr)
    
    # Always exit successfully to not block Claude
    sys.exit(0)

if __name__ == "__main__":
    main()
