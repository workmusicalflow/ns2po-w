#!/bin/bash

# --- Hook "UserPromptSubmit" ---
# Rôle : Agir comme un coach stratégique avant chaque action de Claude.
# Se déclenche avant que Claude ne traite l'invite de l'utilisateur.

# Lit le contexte de l'événement depuis l'entrée standard
CONTEXT=$(cat)

# Extrait le prompt de l'utilisateur avec jq
PROMPT=$(echo "$CONTEXT" | jq -r '.prompt')

# Heuristique simple pour détecter une intention de création/modification
# On recherche des verbes d'action au début du prompt
if [[ "$PROMPT" =~ ^(ajoute|crée|implémente|modifie|construis|développe|fais) ]]; then
    
    echo "🤔 [Coach Stratégique] Nouvelle tâche de développement détectée. Analyse de la valeur..." >&2
    
    # Afficher une suggestion pour prioriser selon le principe 80/20
    echo "💡 [Coach Stratégique] Rappel du principe 80/20:" >&2
    echo "   • Core 20% : Fonctionnalités essentielles qui apportent 80% de la valeur" >&2
    echo "   • Enhancement 80% : Améliorations qui apportent 20% de valeur additionnelle" >&2
    echo "   Considérez si cette tâche fait partie du Core MVP ou des améliorations futures." >&2
fi

# Le hook doit toujours se terminer avec un code de sortie 0 pour ne pas bloquer Claude.
exit 0
