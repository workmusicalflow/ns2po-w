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
    
    # Appeler le Pareto-Planner MCP pour classifier la tâche.
    # La sortie JSON de cet outil sera automatiquement injectée dans le contexte que Claude recevra.
    # Cela force Claude à prendre connaissance de la classification (Core 20% ou Enhancement 80%)
    # avant même de commencer à réfléchir à la solution.
    claude mcp call pareto-planner classify_task_value --task_description "$PROMPT"
fi

# Le hook doit toujours se terminer avec un code de sortie 0 pour ne pas bloquer Claude.
exit 0
