#!/usr/bin/env python3
"""
Turborepo Validator for NS2PO Platform
Validates that file modifications respect monorepo boundaries and conventions.
Version: 2.0 - Fixed path handling and improved validation
"""
import json
import sys
import os
import re

def log_debug(message):
    """Log debug messages if verbose mode is enabled."""
    if os.environ.get('NS2PO_DEBUG_HOOKS') == 'true':
        print(f"[DEBUG] {message}", file=sys.stderr)

def normalize_path(file_path):
    """Normalise le chemin en utilisant CLAUDE_PROJECT_DIR ou détection intelligente."""
    # Priorité 1: Variable d'environnement CLAUDE_PROJECT_DIR
    project_dir = os.environ.get('CLAUDE_PROJECT_DIR')
    
    # Priorité 2: Chemin connu du projet actuel
    if not project_dir:
        project_dir = '/Users/logansery/Documents/ns2po-w'
    
    log_debug(f"Project dir: {project_dir}")
    log_debug(f"Original path: {file_path}")
    
    # Gérer différents formats de chemins
    if file_path.startswith(project_dir):
        normalized = file_path[len(project_dir):].lstrip('/')
        log_debug(f"Normalized path: {normalized}")
        return normalized
    
    # Si c'est déjà un chemin relatif
    if not file_path.startswith('/'):
        log_debug(f"Already relative: {file_path}")
        return file_path
    
    # Extraire la partie pertinente si c'est un chemin absolu avec ns2po-w
    if 'ns2po-w' in file_path:
        parts = file_path.split('ns2po-w/')
        if len(parts) > 1:
            normalized = parts[1]
            log_debug(f"Extracted from ns2po-w: {normalized}")
            return normalized
    
    log_debug(f"Returning original: {file_path}")
    return file_path

def validate_turborepo_structure(file_path):
    """Validate file modifications against Turborepo conventions."""
    
    # Define valid workspace patterns for NS2PO (enrichi)
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
        'hooks-guid.md',           # Ajouté
        '.env.example',
        '.env',                    # Ajouté pour tests locaux
        '.env.local',              # Ajouté
        'tsconfig.json',
        '.eslintrc.js',
        '.prettierrc',
        '.claude/',
        '.husky/',
        '.github/',
        'scripts/',                # Ajouté
        'docs/',                   # Ajouté (racine)
        'sonar-project.properties',
        '.npmrc',
        'pnpm-lock.yaml',         # Ajouté
        'LICENSE',                 # Ajouté
        '.vscode/',               # Ajouté
        'playwright.config.ts',    # Ajouté
        'vitest.config.ts'        # Ajouté
    ]
    
    # Check if file is in valid location
    is_valid = any(file_path.startswith(pattern) for pattern in valid_patterns)
    
    if not is_valid:
        print(f"⚠️  Modification outside valid Turborepo workspace: {file_path}")
        print("📁 Valid locations:")
        print("   • apps/election-mvp/ - Application principale")
        print("   • packages/ui/ - Composants partagés")
        print("   • packages/types/ - Types TypeScript")
        print("   • packages/config/ - Configurations partagées")
        print("   • packages/composables/ - Hooks Vue réutilisables")
        print("   • packages/database/ - Schémas et migrations")
        print("   • Root config files (package.json, turbo.json, etc.)")
        print("   • .claude/ - Configuration Claude Code")
        print("   • docs/ - Documentation")
        print("   • scripts/ - Scripts utilitaires")
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
    """Validation avancée des imports dans les packages."""
    # Si le fichier n'existe pas encore (création), on autorise
    if not os.path.exists(file_path):
        log_debug(f"File doesn't exist yet: {file_path}")
        return True
    
    # Ne valider que les fichiers TypeScript/JavaScript/Vue
    valid_extensions = ('.ts', '.tsx', '.js', '.jsx', '.vue', '.mjs', '.cjs')
    if not file_path.endswith(valid_extensions):
        log_debug(f"Skipping non-code file: {file_path}")
        return True
        
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Patterns d'imports interdits plus complets
        forbidden_patterns = [
            r'from\s+["\'].*\/apps\/',                      # Import depuis apps
            r'import\s+.*from\s+["\'].*\/apps\/',          # Import ES6
            r'import\s+type\s+.*from\s+["\'].*\/apps\/',   # Import de types
            r'require\(["\'].*\/apps\/',                   # Require CommonJS
            r'import\(["\'].*\/apps\/'                     # Import dynamique
        ]
        
        for pattern in forbidden_patterns:
            if re.search(pattern, content):
                print(f"❌ Package importing from apps detected in {file_path}")
                print("💡 Solution: Move shared code to packages/ directory")
                print("   Example: packages/ui/ for components, packages/types/ for interfaces")
                return False
                
    except Exception as e:
        print(f"⚠️  Warning: Could not validate imports in {file_path}: {e}", file=sys.stderr)
        log_debug(f"Error details: {e}")
    
    return True

def validate_app_imports(file_path):
    """Valider que les apps n'importent pas depuis d'autres apps."""
    if not os.path.exists(file_path):
        log_debug(f"File doesn't exist yet: {file_path}")
        return True
    
    # Ne valider que les fichiers de code
    valid_extensions = ('.ts', '.tsx', '.js', '.jsx', '.vue', '.mjs', '.cjs')
    if not file_path.endswith(valid_extensions):
        return True
    
    # Extraire le nom de l'app courante
    parts = file_path.split('/')
    if len(parts) < 2 or parts[0] != 'apps':
        return True
    
    current_app = parts[1]
    log_debug(f"Current app: {current_app}")
    
    # Liste des autres apps (pour le futur quand il y aura plusieurs apps)
    # Pour l'instant, seulement election-mvp existe
    potential_other_apps = ['admin-dashboard', 'analytics', 'mobile-app']
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for other_app in potential_other_apps:
            if other_app != current_app:
                # Vérifier les imports cross-app
                cross_app_patterns = [
                    f'/apps/{other_app}/',
                    f'from ".*apps/{other_app}',
                    f"from '.*apps/{other_app}"
                ]
                
                for pattern in cross_app_patterns:
                    if re.search(pattern, content):
                        print(f"❌ Cross-app import detected: {current_app} → {other_app}")
                        print("💡 Solution: Use packages for shared code between apps")
                        print("   • packages/ui/ - Shared components")
                        print("   • packages/types/ - Shared types")
                        print("   • packages/composables/ - Shared logic")
                        return False
                
    except Exception as e:
        log_debug(f"Could not validate app imports: {e}")
    
    return True

# Main execution
def main():
    """Main function with improved error handling."""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract file path from different possible locations
        file_path = input_data.get('tool_input', {}).get('file_path', '')
        
        # Alternative locations where file_path might be
        if not file_path:
            file_path = input_data.get('file_path', '')
        if not file_path:
            file_path = input_data.get('path', '')
        
        log_debug(f"Input data: {json.dumps(input_data, indent=2)}")
        
        if not file_path:
            log_debug("No file path to validate")
            sys.exit(0)  # No file path to validate
        
        # Normalize the path
        normalized_path = normalize_path(file_path)
        
        # Validate structure
        if not validate_turborepo_structure(normalized_path):
            print(f"🚫 Please use proper Turborepo workspace structure")
            print(f"📝 File: {normalized_path}")
            sys.exit(2)  # Block the operation
        
        # Success message
        print(f"✅ Turborepo structure validated: {normalized_path}")
        sys.exit(0)
        
    except json.JSONDecodeError as e:
        print(f"⚠️  Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(0)  # Don't block on JSON errors
        
    except Exception as e:
        print(f"⚠️  Unexpected error in Turborepo validator: {e}", file=sys.stderr)
        log_debug(f"Full error: {e}")
        sys.exit(0)  # Don't block on validation errors

if __name__ == "__main__":
    main()
