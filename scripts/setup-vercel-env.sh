#!/bin/bash

# Script d'automatisation pour ajouter les variables d'environnement Vercel
# Usage: ./scripts/setup-vercel-env.sh

set -e

echo "🚀 Configuration automatique des variables d'environnement Vercel"
echo "=================================================="

# Vérifier si nous sommes dans le bon répertoire
if [ ! -f "vercel.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Définir les variables d'environnement
declare -A ENV_VARS=(
    ["TURSO_DATABASE_URL"]="libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io"
    ["TURSO_AUTH_TOKEN"]="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTgxNDY5OTEsImlkIjoiOWU2MjhhMjItNjU1ZC00NWI5LWJkODUtMWU4ZWMzYjA5YjFjIiwicmlkIjoiNDU3OGFlM2UtMTM2Ny00YjJiLTkzMzctZTY5ZjcwYjdkOTM4In0.uyhdXbGe8uwIR3LVSSpDBXyBC1DqRWZEKikUqfYi6MCeuwH6mQG_S0ZHe5a_oLfKQl41jzMjetYB5BE_GMlYCQ"
    ["CLOUDINARY_CLOUD_NAME"]="dsrvzogof"
    ["CLOUDINARY_API_KEY"]="775318993136791"
    ["CLOUDINARY_API_SECRET"]="ywTgN-mioXQXW1lOWmq2xNAIK7U"
    ["SMTP_HOST"]="mail.topdigitalevel.site"
    ["SMTP_PORT"]="587"
    ["SMTP_USERNAME"]="info@topdigitalevel.site"
    ["SMTP_PASSWORD"]="undPzZ3x3U"
    ["SMTP_SECURE"]="tls"
    ["NUXT_PUBLIC_SITE_URL"]="https://ns2po-e.vercel.app"
)

# Fonction pour ajouter une variable d'environnement
add_env_var() {
    local var_name="$1"
    local var_value="$2"

    echo "📝 Ajout de $var_name..."

    # Utiliser expect pour automatiser les réponses interactives
    expect << EOF
spawn vercel env add
expect "What's the name of the variable?"
send "$var_name\r"
expect "What's the value of $var_name?"
send "$var_value\r"
expect "Add $var_name to which Environments"
send "Production, Preview, Development\r"
expect eof
EOF

    if [ $? -eq 0 ]; then
        echo "✅ $var_name ajoutée avec succès"
    else
        echo "❌ Erreur lors de l'ajout de $var_name"
    fi
}

# Vérifier si expect est installé
if ! command -v expect &> /dev/null; then
    echo "❌ Le programme 'expect' n'est pas installé."
    echo "📦 Installation avec Homebrew..."
    brew install expect
fi

# Vérifier si nous sommes connectés à Vercel
echo "🔐 Vérification de l'authentification Vercel..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Vercel. Exécutez 'vercel login' d'abord."
    exit 1
fi

# Vérifier si le projet est lié
echo "🔗 Vérification du lien avec le projet Vercel..."
if [ ! -f ".vercel/project.json" ]; then
    echo "❌ Le projet n'est pas lié à Vercel. Exécutez 'vercel link' d'abord."
    exit 1
fi

echo ""
echo "🚀 Début de l'ajout des variables d'environnement..."
echo ""

# Ajouter chaque variable d'environnement
for var_name in "${!ENV_VARS[@]}"; do
    add_env_var "$var_name" "${ENV_VARS[$var_name]}"
    echo ""
    sleep 1  # Petite pause pour éviter les conflits
done

echo ""
echo "✅ Configuration terminée !"
echo "🔄 Synchronisation des variables d'environnement locales..."

# Synchroniser les variables d'environnement
vercel env pull .env.local

echo ""
echo "✅ Toutes les variables d'environnement ont été configurées avec succès !"
echo "📋 Vous pouvez maintenant exécuter:"
echo "   vercel build --prod"
echo "   vercel deploy --prebuilt --prod"