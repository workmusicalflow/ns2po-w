#!/usr/bin/env python3

"""
Hook de session NS2PO minimaliste
Affiche uniquement les informations essentielles
"""

import sys
import os

def main():
    project_dir = os.environ.get('CLAUDE_PROJECT_DIR', '.')

    print("\n🚀 NS2PO Election MVP - Session démarrée")
    print("📁 Projet: " + os.path.basename(project_dir))
    print("💡 Rappel: Utiliser `mcp__serena` pour navigation code")
    print("✅ Hook activé\n")

    return 0

if __name__ == "__main__":
    sys.exit(main())