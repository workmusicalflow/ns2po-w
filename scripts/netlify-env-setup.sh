#!/bin/bash

# Script d'aide pour configurer les variables d'environnement Netlify
# Compatible avec Netlify CLI et interface web

echo "🚀 Configuration des variables d'environnement Netlify"
echo "======================================================"
echo ""

# Variables d'environnement à configurer
cat << 'EOF'
📋 Variables d'environnement à ajouter dans Netlify :

=== Base de données Turso ===
TURSO_DATABASE_URL
Valeur: libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io

TURSO_AUTH_TOKEN
Valeur: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTgxNDY5OTEsImlkIjoiOWU2MjhhMjItNjU1ZC00NWI5LWJkODUtMWU4ZWMzYjA5YjFjIiwicmlkIjoiNDU3OGFlM2UtMTM2Ny00YjJiLTkzMzctZTY5ZjcwYjdkOTM4In0.uyhdXbGe8uwIR3LVSSpDBXyBC1DqRWZEKikUqfYi6MCeuwH6mQG_S0ZHe5a_oLfKQl41jzMjetYB5BE_GMlYCQ

=== Cloudinary (Gestion d'images) ===
CLOUDINARY_CLOUD_NAME
Valeur: dsrvzogof

CLOUDINARY_API_KEY
Valeur: 775318993136791

CLOUDINARY_API_SECRET
Valeur: ywTgN-mioXQXW1lOWmq2xNAIK7U

=== SMTP (Envoi d'emails) ===
SMTP_HOST
Valeur: mail.topdigitalevel.site

SMTP_PORT
Valeur: 587

SMTP_USERNAME
Valeur: info@topdigitalevel.site

SMTP_PASSWORD
Valeur: undPzZ3x3U

SMTP_SECURE
Valeur: tls

=== Application ===
NUXT_PUBLIC_SITE_URL
Valeur: [URL Netlify à définir après déploiement]

EOF

echo ""
echo "🎯 Instructions de configuration :"
echo ""
echo "1. Interface Web Netlify :"
echo "   - Connectez-vous à https://app.netlify.com"
echo "   - Sélectionnez votre site ns2po-w"
echo "   - Allez dans Site settings > Environment variables"
echo "   - Ajoutez chaque variable une par une"
echo ""
echo "2. Netlify CLI (si installé) :"
echo "   npm install -g netlify-cli"
echo "   netlify login"
echo "   netlify link"
echo "   netlify env:set VAR_NAME 'VAR_VALUE'"
echo ""
echo "3. Après configuration :"
echo "   - Déclenchez un nouveau déploiement"
echo "   - Mettez à jour NUXT_PUBLIC_SITE_URL avec l'URL Netlify finale"
echo ""
echo "✅ Fichier netlify.toml déjà configuré pour le monorepo"
echo "📂 Répertoire de build : apps/election-mvp"
echo "🏗️  Commande de build : pnpm build --filter=@ns2po/election-mvp"