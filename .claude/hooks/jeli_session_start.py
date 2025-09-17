#!/usr/bin/env python3
"""
Session Start Dashboard for JELI Platform
Displays project status and important information when Claude Code starts.
"""
import json
import sys
import os
import subprocess
import time
from datetime import datetime

def check_project_health():
    """Check the overall health of the JELI project."""
    
    project_root = '/Users/logansery/Documents/jeli-app'
    os.chdir(project_root)
    
    health_status = {
        'pnpm': False,
        'typescript': False,
        'git': False,
        'postgresql': False,
        'redis': False,
        'orange_sms': False,
        'whatsapp': False,
        'bmi_ci': False,
        'prisma': False
    }
    
    # Check pnpm
    try:
        result = subprocess.run(['pnpm', '--version'], capture_output=True, text=True, timeout=5)
        health_status['pnpm'] = result.returncode == 0
    except:
        pass
    
    # Check TypeScript
    try:
        result = subprocess.run(['pnpm', 'tsc', '--version'], capture_output=True, text=True, timeout=5)
        health_status['typescript'] = result.returncode == 0
    except:
        pass
    
    # Check Git
    try:
        result = subprocess.run(['git', 'status'], capture_output=True, text=True, timeout=5)
        health_status['git'] = result.returncode == 0
    except:
        pass
    
    # Check Prisma
    try:
        result = subprocess.run(['pnpm', 'prisma', '--version'], capture_output=True, text=True, timeout=5)
        health_status['prisma'] = result.returncode == 0
    except:
        pass
    
    # Check for environment configuration
    env_files = ['.env.local', '.env']
    for env_file in env_files:
        if os.path.exists(env_file):
            try:
                with open(env_file, 'r') as f:
                    env_content = f.read()
                    health_status['postgresql'] = 'DATABASE_URL' in env_content
                    health_status['redis'] = 'REDIS_URL' in env_content
                    health_status['orange_sms'] = 'ORANGE_SMS_CLIENT_ID' in env_content
                    health_status['whatsapp'] = 'WHATSAPP_PHONE_NUMBER_ID' in env_content
                    health_status['bmi_ci'] = 'BMI_CI_MERCHANT_ID' in env_content
                    break
            except:
                pass
    
    return health_status

def get_project_overview():
    """Get an overview of the JELI project structure."""
    
    project_root = '/Users/logansery/Documents/jeli-app'
    overview = {
        'name': 'JELI Platform - B2B SaaS PWA E-Commerce',
        'type': 'Nx Monorepo + NestJS + Nuxt 3',
        'architecture': 'Multi-tenant SaaS + PWA Offline-First',
        'apps': [],
        'packages': [],
        'modules': [],
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
        
        # Check API modules
        api_src = os.path.join(project_root, 'apps/api/src')
        if os.path.exists(api_src):
            modules = [d for d in os.listdir(api_src) 
                      if os.path.isdir(os.path.join(api_src, d)) and not d.startswith('.')]
            overview['modules'] = modules[:10]  # Show first 10 modules
        
        # Count files (rough estimate)
        for root, dirs, files in os.walk(project_root):
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.nuxt', 
                                                    'dist', 'build', '.nx', '.git']]
            overview['total_files'] += len(files)
    
    except:
        pass
    
    return overview

def check_pwa_status():
    """Check PWA and offline-first capabilities status."""
    
    pwa_status = {
        'service_worker': False,
        'cache_strategies': False,
        'indexeddb': False,
        'network_detection': False,
        'compression': False
    }
    
    project_root = '/Users/logansery/Documents/jeli-app'
    
    # Check for Service Worker
    sw_files = [
        'apps/web/src/public/sw.js',
        'apps/web/src/public/sw/service-worker.js'
    ]
    for sw_file in sw_files:
        if os.path.exists(os.path.join(project_root, sw_file)):
            pwa_status['service_worker'] = True
            break
    
    # Check for offline composables
    offline_dir = os.path.join(project_root, 'apps/web/src/composables/offline')
    if os.path.exists(offline_dir):
        offline_files = os.listdir(offline_dir)
        pwa_status['cache_strategies'] = 'useOfflineCache.ts' in offline_files
        pwa_status['indexeddb'] = 'useOfflineContacts.ts' in offline_files
        pwa_status['compression'] = 'useImageOptimization.ts' in offline_files
    
    # Check for network detection
    composables_dir = os.path.join(project_root, 'apps/web/src/composables')
    if os.path.exists(composables_dir):
        pwa_status['network_detection'] = os.path.exists(
            os.path.join(composables_dir, 'useNetworkQuality.ts')
        )
    
    return pwa_status

def get_recent_activity():
    """Get recent project activity from git."""
    
    try:
        project_root = '/Users/logansery/Documents/jeli-app'
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

def check_docker_services():
    """Check if Docker services are running."""
    
    services_status = {
        'postgresql': False,
        'redis': False,
        'pgadmin': False
    }
    
    try:
        # Check docker containers
        result = subprocess.run(
            ['docker', 'ps', '--format', '{{.Names}}'],
            capture_output=True, text=True, timeout=5
        )
        
        if result.returncode == 0:
            running_containers = result.stdout.strip().split('\n')
            services_status['postgresql'] = any('postgres' in c.lower() for c in running_containers)
            services_status['redis'] = any('redis' in c.lower() for c in running_containers)
            services_status['pgadmin'] = any('pgadmin' in c.lower() for c in running_containers)
    except:
        pass
    
    return services_status

def display_jeli_dashboard():
    """Display comprehensive JELI project dashboard."""

    print("🚀 JELI Platform - MVP PRODUCTION-READY 2025")
    print("=" * 70)
    print(f"📅 Session: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 MISSION: Transformation Prototype → Produit SaaS Production-Ready")
    
    # Project Overview
    overview = get_project_overview()
    print(f"\n📁 Vue d'ensemble du projet:")
    print(f"   • Type: {overview['type']}")
    print(f"   • Architecture: {overview['architecture']}")
    print(f"   • Apps: {', '.join(overview['apps']) if overview['apps'] else 'Non configuré'}")
    print(f"   • Packages: {', '.join(overview['packages']) if overview['packages'] else 'Non configuré'}")
    if overview['modules']:
        print(f"   • Modules API: {len(overview['modules'])}+ ({', '.join(overview['modules'][:5])}...)")
    print(f"   • Fichiers: ~{overview['total_files']:,}")
    
    # Health Status
    health = check_project_health()
    print(f"\n🏥 Santé du projet:")
    status_symbols = {True: "✅", False: "❌"}
    print(f"   • pnpm: {status_symbols[health['pnpm']]}")
    print(f"   • TypeScript: {status_symbols[health['typescript']]}")
    print(f"   • Git: {status_symbols[health['git']]}")
    print(f"   • Prisma: {status_symbols[health['prisma']]}")
    print(f"   • PostgreSQL: {status_symbols[health['postgresql']]}")
    print(f"   • Redis: {status_symbols[health['redis']]}")
    
    # External APIs Status
    print(f"\n🔌 APIs Externes:")
    print(f"   • Orange SMS API: {status_symbols[health['orange_sms']]}")
    print(f"   • WhatsApp Business: {status_symbols[health['whatsapp']]}")
    print(f"   • BMI-CI PaySecureHub: {status_symbols[health['bmi_ci']]}")
    
    # Docker Services
    docker_services = check_docker_services()
    print(f"\n🐳 Services Docker:")
    print(f"   • PostgreSQL: {status_symbols[docker_services['postgresql']]}")
    print(f"   • Redis: {status_symbols[docker_services['redis']]}")
    print(f"   • pgAdmin: {status_symbols[docker_services['pgadmin']]}")
    
    # PWA Status
    pwa = check_pwa_status()
    print(f"\n📱 PWA & Offline Status:")
    print(f"   • Service Worker: {status_symbols[pwa['service_worker']]}")
    print(f"   • Cache Strategies: {status_symbols[pwa['cache_strategies']]}")
    print(f"   • IndexedDB: {status_symbols[pwa['indexeddb']]}")
    print(f"   • Network Detection: {status_symbols[pwa['network_detection']]}")
    print(f"   • Image Compression: {status_symbols[pwa['compression']]}")
    
    # Recent Activity
    recent_commits = get_recent_activity()
    if recent_commits:
        print(f"\n📊 Activité récente:")
        for commit in recent_commits[:3]:
            print(f"   • {commit}")
    
    # Key Features
    print(f"\n🎯 Features Clés:")
    print(f"   • Multi-tenant SaaS avec isolation complète")
    print(f"   • Communication SMS/WhatsApp intégrée")
    print(f"   • Paiements mobile money (Orange, Wave, Moov, MTN)")
    print(f"   • PWA offline-first optimisée Afrique")
    print(f"   • Parcours digitalisation < 5 minutes")
    print(f"   • QR Codes & Short Links (jeli.ci/boutique)")
    
    # Development Commands
    print(f"\n🔧 Commandes essentielles:")
    print(f"   • pnpm dev:full     - Démarrer tous les services")
    print(f"   • pnpm dev:api      - API NestJS uniquement")
    print(f"   • pnpm dev:web      - Frontend Nuxt uniquement")
    print(f"   • pnpm dev:pwa      - PWA avec HTTPS")
    print(f"   • pnpm test         - Exécuter tous les tests")
    print(f"   • pnpm lint:fix     - Corriger le linting")
    
    # Database Commands
    print(f"\n💾 Commandes base de données:")
    print(f"   • pnpm db:migrate   - Appliquer les migrations")
    print(f"   • pnpm db:generate  - Générer le client Prisma")
    print(f"   • pnpm db:studio    - Interface Prisma Studio")
    print(f"   • pnpm db:seed      - Peupler la base")
    print(f"   • pnpm db:reset     - Reset complet + seed")
    
    # Issues to address
    issues = []
    if not health['pnpm']:
        issues.append("pnpm non disponible - installer avec: npm install -g pnpm@8.15.0")
    if not health['postgresql']:
        issues.append("PostgreSQL non configuré - vérifier DATABASE_URL dans .env")
    if not health['redis']:
        issues.append("Redis non configuré - vérifier REDIS_URL dans .env")
    if not health['orange_sms']:
        issues.append("Orange SMS non configuré - ajouter ORANGE_SMS_CLIENT_ID dans .env")
    if not health['whatsapp']:
        issues.append("WhatsApp non configuré - ajouter WHATSAPP_PHONE_NUMBER_ID dans .env")
    if not docker_services['postgresql'] and not docker_services['redis']:
        issues.append("Services Docker non démarrés - exécuter: pnpm docker:up")
    
    if issues:
        print(f"\n⚠️  Points à traiter:")
        for issue in issues:
            print(f"   • {issue}")
    
    # Innovation Principles
    print(f"\n💡 Principes Innovation Frugale:")
    print(f"   • Offline-first pour connectivité intermittente")
    print(f"   • Compression automatique (WebP 70%, max 800px)")
    print(f"   • Performance sur appareils bas de gamme")
    print(f"   • Interface iconographique (alphabétisation limitée)")
    print(f"   • Transformer les contraintes en avantages")
    
    # Architecture Cloud Recommandée (Post-Analyse Experte)
    print(f"\n🚀 Architecture Cloud Recommandée (Post-Analyse Experte):")
    print(f"   • Frontend + API: Railway.app full-stack")
    print(f"   • CDN Global: Cloudflare (PoP Afrique optimaux)")
    print(f"   • Justification: Coûts -40%, simplicité opérationnelle, stabilité")
    print(f"   • Alternative hybride Vercel rejetée: complexité + surcoûts cachés")

    # MVP Production-Ready Status
    print(f"\n🏭 MVP Production-Ready Status (15% complété):")
    print(f"   • 🔴 Infrastructure DNS/SSL: À configurer")
    print(f"   • 🔴 Orange Money Production: Sandbox → Production")
    print(f"   • 🔴 WhatsApp Business Prod: Tests → Comptes officiels")
    print(f"   • 🔴 Monitoring & Alertes: Sentry + métriques business")
    print(f"   • 🟢 TenantFactory + Multi-tenant: Implémenté")
    print(f"   • 🟢 PWA Offline-First: Service Worker + cache")
    
    # MCP Servers - Production-Ready Priorities
    print(f"\n🤖 MCP Servers Production-Ready:")
    print(f"   • task-master (roadmap MVP production-ready) ⭐⭐⭐")
    print(f"   • serena (refactoring production) ⭐⭐")
    print(f"   • playwright (tests E2E multi-tenant) ⭐⭐")
    print(f"   • eslint-master + code-critique (qualité prod) ⭐")
    print(f"   • git-master (workflow releases) ⭐")
    print(f"   • perplexity-copilot, gpt5-copilot (architecture review)")

    # MVP Testability Target
    print(f"\n🎯 MVP Testability Target:")
    print(f"   • 10-15 restaurants ivoiriens en beta")
    print(f"   • Onboarding guidé < 5 minutes")
    print(f"   • Paiements Orange Money réels")
    print(f"   • WhatsApp notifications production")
    print(f"   • Métriques usage + feedback structuré")
    
    print("\n" + "=" * 70)
    print("🎯 Prêt pour le développement JELI! Bonne session! 🚀")

def check_task_master_status():
    """Check Task-Master project status with live data integration."""
    
    try:
        # Import and use the Task-Master bridge for live data
        from task_master_bridge import get_task_master_status
        
        # Get real-time status from Task-Master JSON data
        status = get_task_master_status()
        
        # Display Task-Master status with live data
        print(f"\n📋 Task-Master: {status['project_name']}")
        print(f"   • Total Tasks: {status['total_tasks']} (5 phases)")
        print(f"   • Progression: {status['completed_tasks']}/{status['total_tasks']} complétées")
        print(f"   • Phase Actuelle: {status['current_phase']}")
        print(f"   • Phase Progress: {status['current_phase_progress']}")
        print(f"   • Prochaine Tâche: {status['next_task']}")
        
        if status['in_progress_count'] > 0:
            print(f"   • En Cours: {status['in_progress_count']} tâche(s)")
        
        # Display current phase focus - MVP Production-Ready
        print(f"\n🎯 Context Engineering 100% Aligné:")
        print("   • Objectif: Prototype → SaaS testable utilisateurs externes")
        print("   • Périmètre: Infrastructure + Production + Beta Tests")
        print("   • Quality Gates: Monitoring + Tests E2E + Sécurité audit")
        print("   • Success Metrics: 10-15 PME africaines onboardées")

        # MVP Production-Ready phases
        print("\n🏗️ Phases MVP Production-Ready:")
        print("   • PHASE 1: Infrastructure Foundation (DNS, Domaines, APIs Prod)")
        print("   • PHASE 2: Monitoring & UX/UI Production-Ready")
        print("   • PHASE 3: Tests Automatisés & CI/CD Robuste")
        print("   • PHASE 4: Sécurité & Conformité + Support Client")
        print("   • PHASE 5: Tests Beta Utilisateurs + Go-Live Commercial")

        # Insights from expert consultations
        print("\n💡 Insights Consultations Expertes:")
        print("   • Architecture: Railway full-stack > hybride Vercel")
        print("   • Performance: Cache Cloudflare + optimisations offline-first")
        print("   • Coûts: Simplicité opérationnelle = compétitivité économique")
        print("   • Afrique: Contraintes transformées en avantages concurrentiels")
        
        # Show data source for transparency
        data_source = status.get('data_source', 'unknown')
        if data_source == 'live_data':
            print(f"\n🔄 Données: Synchronisées avec Task-Master (source: {data_source})")
        elif data_source == 'fallback_data':
            print(f"\n⚠️  Données: Mode dégradé - fichier Task-Master non accessible")
        
        return True
        
    except ImportError:
        # Fallback if bridge module not available
        print("\n📋 Task-Master: JELI MVP Production-Ready 2025")
        print("   • Total Tasks: 10 (5 phases)")
        print("   • Progression Globale: 15% Production-Ready")
        print("   • Phase Actuelle: PHASE 1 - Infrastructure Foundation")
        print("   • Prochaine Tâche: PHASE 1.1 - Infrastructure DNS & Domaines")
        print("   • En Cours: 0 tâche(s)")

        print("\n🎯 Context Engineering 100% Aligné:")
        print("   • Objectif: Prototype → SaaS testable utilisateurs externes")
        print("   • Périmètre: Infrastructure + Production + Beta Tests")
        print("   • Quality Gates: Monitoring + Tests E2E + Sécurité audit")
        print("   • Success Metrics: 10-15 PME africaines onboardées")

        print("\n🏗️ Phases MVP Production-Ready:")
        print("   • PHASE 1: Infrastructure Foundation (DNS, Domaines, APIs Prod)")
        print("   • PHASE 2: Monitoring & UX/UI Production-Ready")
        print("   • PHASE 4: Sécurité & Conformité + Support Client")
        print("   • PHASE 5: Tests Beta + Go-Live Commercial")

        print("\n🔄 Données: Fallback mode - Task-Master bridge indisponible")
        return False

    except Exception as e:
        # Graceful fallback for any other error
        print(f"\n📋 Task-Master: JELI MVP Production-Ready 2025")
        print("   • Total Tasks: 10 tâches")
        print("   • Progression: 15% Production-Ready")
        print("   • Phase: PHASE 1 - Infrastructure Foundation")
        print("   • Focus: DNS + APIs Production + Monitoring")
        print(f"   • Erreur: {str(e)[:50]}...")
        return False

def check_hook_configuration():
    """Check if Claude Code hooks are properly configured."""
    
    project_root = '/Users/logansery/Documents/jeli-app'
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
                                if 'jeli_session_start.py' in command:
                                    active_hooks.append('Session Dashboard')
                                elif 'post-code-check.sh' in command:
                                    active_hooks.append('Code Quality Check')
                                elif 'check-code-quality.sh' in command:
                                    active_hooks.append('Quality Analysis')
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
    
    # Display the JELI dashboard
    display_jeli_dashboard()
    
    # Check Task-Master status
    check_task_master_status()
    
    # Check hook configuration
    check_hook_configuration()
    
except Exception as e:
    print(f"Erreur lors du démarrage de session: {e}", file=sys.stderr)
    sys.exit(0)  # Don't block session start