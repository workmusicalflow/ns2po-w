#!/usr/bin/env python3
"""
Session Start Dashboard for NS2PO Platform
Displays project status and important information when Claude Code starts.
"""
import json
import sys
import os
import subprocess
import time
from datetime import datetime

def check_project_health():
    """Check the overall health of the NS2PO project."""

    project_root = '/Users/logansery/Documents/ns2po-w'
    os.chdir(project_root)

    health_status = {
        'pnpm': False,
        'typescript': False,
        'git': False,
        'nuxt': False,
        'turso': False,
        'airtable': False,
        'cloudinary': False,
        'vercel': False
    }

    # Check pnpm
    try:
        result = subprocess.run(['pnpm', '--version'], capture_output=True, text=True, timeout=5)
        health_status['pnpm'] = result.returncode == 0
    except:
        pass

    # Check TypeScript
    try:
        result = subprocess.run(['pnpm', 'exec', 'tsc', '--version'], capture_output=True, text=True, timeout=5)
        health_status['typescript'] = result.returncode == 0
    except:
        pass

    # Check Git
    try:
        result = subprocess.run(['git', 'status'], capture_output=True, text=True, timeout=5)
        health_status['git'] = result.returncode == 0
    except:
        pass

    # Check Nuxt
    try:
        result = subprocess.run(['pnpm', 'exec', 'nuxt', '--version'], capture_output=True, text=True, timeout=5)
        health_status['nuxt'] = result.returncode == 0
    except:
        pass

    # Check for environment configuration
    env_files = ['.env', '.env.example', 'apps/election-mvp/.env']
    for env_file in env_files:
        if os.path.exists(env_file):
            try:
                with open(env_file, 'r') as f:
                    env_content = f.read()
                    health_status['turso'] = 'TURSO_DATABASE_URL' in env_content
                    health_status['airtable'] = 'AIRTABLE_API_KEY' in env_content
                    health_status['cloudinary'] = 'CLOUDINARY_CLOUD_NAME' in env_content
                    health_status['vercel'] = 'VERCEL_' in env_content
                    break
            except:
                pass

    return health_status

def get_project_overview():
    """Get an overview of the NS2PO project structure."""

    project_root = '/Users/logansery/Documents/ns2po-w'
    overview = {
        'name': 'NS2PO Élections MVP - Plateforme de Gadgets Électoraux',
        'type': 'Monorepo Turborepo + Nuxt 3 + Vue.js',
        'architecture': 'MVP Election Campaign Platform',
        'apps': [],
        'packages': [],
        'total_files': 0
    }

    try:
        # Check apps
        apps_dir = os.path.join(project_root, 'apps')
        if os.path.exists(apps_dir):
            overview['apps'] = [d for d in os.listdir(apps_dir)
                              if os.path.isdir(os.path.join(apps_dir, d))]

        # Check packages
        packages_dir = os.path.join(project_root, 'packages')
        if os.path.exists(packages_dir):
            overview['packages'] = [d for d in os.listdir(packages_dir)
                                  if os.path.isdir(os.path.join(packages_dir, d))]

        # Count files (rough estimate)
        for root, dirs, files in os.walk(project_root):
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.nuxt',
                                                    'dist', 'build', '.nx', '.git', 'temp-renamed-assets']]
            overview['total_files'] += len(files)

    except:
        pass

    return overview

def check_campaign_bundles_status():
    """Check campaign bundles configuration and data status."""

    bundles_status = {
        'data_file': False,
        'composable': False,
        'ui_components': False,
        'total_bundles': 0,
        'active_bundles': 0
    }

    project_root = '/Users/logansery/Documents/ns2po-w'

    # Check for campaign bundles data file
    bundles_data_file = os.path.join(project_root, 'packages/types/src/campaign-bundles-data.ts')
    if os.path.exists(bundles_data_file):
        bundles_status['data_file'] = True
        try:
            with open(bundles_data_file, 'r') as f:
                content = f.read()
                # Count bundle definitions
                bundles_status['total_bundles'] = content.count('const ') - content.count('const createBundleProduct')
        except:
            pass

    # Check for composable
    composable_file = os.path.join(project_root, 'apps/election-mvp/composables/useCampaignBundles.ts')
    if os.path.exists(composable_file):
        bundles_status['composable'] = True

    # Check for UI components
    bundle_selector = os.path.join(project_root, 'packages/ui/src/components/BundleSelector.vue')
    if os.path.exists(bundle_selector):
        bundles_status['ui_components'] = True

    return bundles_status

def get_recent_activity():
    """Get recent project activity from git."""

    try:
        project_root = '/Users/logansery/Documents/ns2po-w'
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

def check_deployment_status():
    """Check deployment readiness and Vercel status."""

    deployment_status = {
        'vercel_config': False,
        'build_command': False,
        'env_vars': False,
        'domain_ready': False
    }

    project_root = '/Users/logansery/Documents/ns2po-w'

    # Check vercel.json
    vercel_config = os.path.join(project_root, 'vercel.json')
    if os.path.exists(vercel_config):
        deployment_status['vercel_config'] = True

    # Check package.json for build commands
    package_json = os.path.join(project_root, 'apps/election-mvp/package.json')
    if os.path.exists(package_json):
        try:
            with open(package_json, 'r') as f:
                content = json.load(f)
                scripts = content.get('scripts', {})
                deployment_status['build_command'] = 'build' in scripts
        except:
            pass

    # Check environment variables
    env_example = os.path.join(project_root, 'apps/election-mvp/.env.example')
    if os.path.exists(env_example):
        deployment_status['env_vars'] = True

    return deployment_status

def display_ns2po_dashboard():
    """Display comprehensive NS2PO project dashboard."""

    print("🚀 NS2PO ÉLECTIONS MVP - PLATEFORME GADGETS ÉLECTORAUX")
    print("=" * 70)
    print(f"📅 Session: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 MISSION: MVP Election Campaign Platform - Sprint Correction Itérative")

    # Project Overview
    overview = get_project_overview()
    print(f"\n📁 Vue d'ensemble du projet:")
    print(f"   • Type: {overview['type']}")
    print(f"   • Architecture: {overview['architecture']}")
    print(f"   • Apps: {', '.join(overview['apps']) if overview['apps'] else 'Non configuré'}")
    print(f"   • Packages: {', '.join(overview['packages']) if overview['packages'] else 'Non configuré'}")
    print(f"   • Fichiers: ~{overview['total_files']:,}")

    # Health Status
    health = check_project_health()
    print(f"\n🏥 Santé du projet:")
    status_symbols = {True: "✅", False: "❌"}
    print(f"   • pnpm: {status_symbols[health['pnpm']]}")
    print(f"   • TypeScript: {status_symbols[health['typescript']]}")
    print(f"   • Git: {status_symbols[health['git']]}")
    print(f"   • Nuxt 3: {status_symbols[health['nuxt']]}")

    # External Services Status
    print(f"\n🔌 Services Externes:")
    print(f"   • Turso DB: {status_symbols[health['turso']]}")
    print(f"   • Airtable API: {status_symbols[health['airtable']]}")
    print(f"   • Cloudinary: {status_symbols[health['cloudinary']]}")
    print(f"   • Vercel: {status_symbols[health['vercel']]}")

    # Campaign Bundles Status
    bundles = check_campaign_bundles_status()
    print(f"\n📦 Packs de Campagne:")
    print(f"   • Fichier de données: {status_symbols[bundles['data_file']]}")
    print(f"   • Composable Vue: {status_symbols[bundles['composable']]}")
    print(f"   • Composants UI: {status_symbols[bundles['ui_components']]}")
    print(f"   • Total bundles: {bundles['total_bundles']}")

    # Deployment Status
    deployment = check_deployment_status()
    print(f"\n🚀 État Déploiement:")
    print(f"   • Config Vercel: {status_symbols[deployment['vercel_config']]}")
    print(f"   • Commande Build: {status_symbols[deployment['build_command']]}")
    print(f"   • Variables Env: {status_symbols[deployment['env_vars']]}")

    # Recent Activity
    recent_commits = get_recent_activity()
    if recent_commits:
        print(f"\n📊 Activité récente:")
        for commit in recent_commits[:3]:
            print(f"   • {commit}")

    # Key Features
    print(f"\n🎯 Features Clés MVP:")
    print(f"   • Catalogue produits électoraux (Airtable)")
    print(f"   • Personnalisation logos temps réel")
    print(f"   • Génération devis PDF automatique")
    print(f"   • Packs campagne pré-configurés")
    print(f"   • Upload images Cloudinary optimisé")
    print(f"   • Interface responsive mobile-first")

    # Current Sprint Focus
    print(f"\n🎯 Sprint Actuel - Correction Itérative:")
    print(f"   • Simplifier packs campagne: 8 → 3 packs")
    print(f"   • Pack Argent: 5K personnes ciblées")
    print(f"   • Pack Or: 10-15K personnes ciblées")
    print(f"   • Pack Platinium: 20-30K personnes ciblées")
    print(f"   • Optimiser conversion utilisateur")
    print(f"   • Améliorer expérience sélection")

    # Development Commands
    print(f"\n🔧 Commandes essentielles:")
    print(f"   • pnpm install       - Installation dépendances")
    print(f"   • pnpm dev           - Démarrage développement")
    print(f"   • pnpm build         - Build production")
    print(f"   • pnpm lint          - Vérification code")
    print(f"   • pnpm test          - Tests unitaires/E2E")
    print(f"   • pnpm type-check    - Vérification TypeScript")

    # File Locations
    print(f"\n📂 Fichiers Importants:")
    print(f"   • Bundles: packages/types/src/campaign-bundles-data.ts")
    print(f"   • Composable: apps/election-mvp/composables/useCampaignBundles.ts")
    print(f"   • UI Bundle: packages/ui/src/components/BundleSelector.vue")
    print(f"   • Config: apps/election-mvp/nuxt.config.ts")
    print(f"   • Airtable: apps/election-mvp/services/airtable.ts")

    # Issues to address
    issues = []
    if not health['pnpm']:
        issues.append("pnpm non disponible - installer avec: npm install -g pnpm@latest")
    if not health['turso']:
        issues.append("Turso non configuré - vérifier TURSO_DATABASE_URL dans .env")
    if not health['airtable']:
        issues.append("Airtable non configuré - vérifier AIRTABLE_API_KEY dans .env")
    if not health['cloudinary']:
        issues.append("Cloudinary non configuré - vérifier CLOUDINARY_CLOUD_NAME dans .env")
    if bundles['total_bundles'] > 3:
        issues.append("Simplifier bundles: réduire de 8 à 3 packs de campagne")

    if issues:
        print(f"\n⚠️  Points à traiter:")
        for issue in issues:
            print(f"   • {issue}")

    # Architecture Stack
    print(f"\n🏗️ Stack Technique:")
    print(f"   • Frontend: Nuxt 3 + Vue.js + TypeScript")
    print(f"   • UI: Tailwind CSS + HeadlessUI")
    print(f"   • Database: Turso (SQLite) + Airtable")
    print(f"   • Images: Cloudinary SDK")
    print(f"   • Deploy: Vercel Edge")
    print(f"   • Monorepo: Turborepo + pnpm workspaces")

def check_task_master_status():
    """Check Task-Master status for NS2PO project."""

    try:
        project_root = '/Users/logansery/Documents/ns2po-w'
        task_master_file = os.path.join(project_root, '.claude-task-master/tasks.json')

        if os.path.exists(task_master_file):
            with open(task_master_file, 'r') as f:
                data = json.load(f)

            total_tasks = len(data.get('tasks', []))
            completed = len([t for t in data.get('tasks', []) if t.get('status') == 'completed'])
            in_progress = len([t for t in data.get('tasks', []) if t.get('status') == 'in_progress'])
            pending = len([t for t in data.get('tasks', []) if t.get('status') == 'pending'])

            print(f"\n📋 Task-Master: {data.get('name', 'NS2PO Sprint')}")
            print(f"   • Total tâches: {total_tasks}")
            print(f"   • Complétées: {completed}")
            print(f"   • En cours: {in_progress}")
            print(f"   • En attente: {pending}")
            print(f"   • Progression: {(completed/total_tasks*100):.0f}%" if total_tasks > 0 else "   • Progression: 0%")

            # Show next task
            next_task = None
            for task in data.get('tasks', []):
                if task.get('status') == 'pending':
                    next_task = task
                    break

            if next_task:
                print(f"   • Prochaine tâche: {next_task.get('title', 'N/A')}")
            elif in_progress > 0:
                current_task = next((t for t in data.get('tasks', []) if t.get('status') == 'in_progress'), None)
                if current_task:
                    print(f"   • Tâche actuelle: {current_task.get('title', 'N/A')}")

            return True
        else:
            print(f"\n📋 Task-Master: Sprint Correction Itérative")
            print(f"   • Status: Non initialisé")
            print(f"   • Objectif: Simplifier packs campagne (8→3)")
            print(f"   • Commande: Utiliser mcp__task-master__initialize_project")
            return False

    except Exception as e:
        print(f"\n📋 Task-Master: Erreur de lecture")
        print(f"   • Erreur: {str(e)[:50]}...")
        return False

def check_hook_configuration():
    """Check if Claude Code hooks are properly configured."""

    project_root = '/Users/logansery/Documents/ns2po-w'
    hooks_dir = os.path.join(project_root, '.claude/hooks')
    settings_file = os.path.join(project_root, '.claude/settings.json')

    # Count configured hooks
    configured_hooks = 0
    active_hooks = []

    try:
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings = json.load(f)
                hooks_config = settings.get('hooks', {})

                for hook_type, hooks_list in hooks_config.items():
                    for hook_group in hooks_list:
                        configured_hooks += len(hook_group.get('hooks', []))
                        for hook in hook_group.get('hooks', []):
                            if hook.get('type') == 'command':
                                command = hook.get('command', '')
                                if 'ns2po_session_start.py' in command:
                                    active_hooks.append('NS2PO Dashboard')
                                elif 'quality-check' in command:
                                    active_hooks.append('Quality Check')
    except:
        pass

    # Count available hook files
    available_hooks = 0
    if os.path.exists(hooks_dir):
        hook_files = [f for f in os.listdir(hooks_dir)
                     if (f.endswith('.py') or f.endswith('.sh')) and not f.endswith('.disabled')]
        available_hooks = len(hook_files)

    if configured_hooks > 0 or available_hooks > 0:
        print(f"\n🪝 Hooks Claude Code:")
        print(f"   • {configured_hooks} hooks configurés")
        print(f"   • {available_hooks} fichiers de hook disponibles")

        if active_hooks:
            print(f"   • Fonctionnalités: {', '.join(active_hooks)}")

# Main execution
try:
    # Small delay to ensure proper display
    time.sleep(0.1)

    # Display the NS2PO dashboard
    display_ns2po_dashboard()

    # Check Task-Master status
    check_task_master_status()

    # Check hook configuration
    check_hook_configuration()

    print("\n" + "=" * 70)
    print("🎯 Prêt pour le sprint NS2PO! Bonne session! 🚀")

except Exception as e:
    print(f"Erreur lors du démarrage de session: {e}", file=sys.stderr)
    sys.exit(0)  # Don't block session start