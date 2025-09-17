# Claude Context Updater v2

Hook autonome qui met à jour automatiquement le fichier `CLAUDE.md` avec le contexte du projet.

## ✅ Fonctionnalités

- **Détection automatique** du type de projet (Node, Python, monorepo, etc.)
- **Status Git** en temps réel (branche, commits récents, fichiers modifiés)
- **Services découverts** automatiquement depuis les variables d'environnement
- **Commandes disponibles** extraites de package.json, Makefile, etc.
- **Health checks** (TypeScript, dépendances, TODOs)
- **Activité récente** du projet

## 🚀 Installation

Le hook est déjà configuré dans `.claude/settings.json` pour se lancer à chaque session.

## ⚙️ Configuration

Modifiez `.claude/hooks/context.json` pour personnaliser :

```json
{
  "context_updater": {
    "enabled": true,
    "sections": [
      {"id": "project_info", "enabled": true},
      {"id": "git_status", "enabled": true},
      {"id": "environment", "enabled": true}
    ]
  }
}
```

## 🔧 Utilisation

### Automatique
Le hook se lance automatiquement à chaque démarrage de session Claude Code.

### Manuel
```bash
python3 .claude/hooks/claude_context_updater_v2.py
```

## 📝 Sortie

Le contenu est ajouté dans `CLAUDE.md` entre les marqueurs :
```markdown
<!-- DYNAMIC_CONTENT_START -->
[Contenu auto-généré]
<!-- DYNAMIC_CONTENT_END -->
```

## 🎯 Avantages vs v1

- **Universel** : S'adapte à tout type de projet
- **Autonome** : Aucun hardcoding spécifique
- **Performant** : Cache intelligent
- **Configurable** : Sections activables/désactivables

Le système détecte automatiquement Turso, Airtable, Cloudinary et autres services sans configuration manuelle.