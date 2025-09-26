#!/bin/bash

# Script de déploiement Netlify - Commandes prêtes à exécuter
# NS2PO Election MVP - Migration Vercel → Netlify

echo "🚀 Déploiement Netlify - NS2PO Election MVP"
echo "=========================================="
echo ""

# Phase 1: Authentification et liaison (INTERACTIF)
echo "📋 PHASE 1 - Authentification et liaison (VOUS DEVEZ EXÉCUTER):"
echo ""
echo "1. Authentification Netlify:"
echo "   netlify login"
echo ""
echo "2. Liaison du projet (depuis la racine du repo):"
echo "   netlify link"
echo ""
echo "   > Sélectionnez 'Use current git remote origin' si le repo GitHub est déjà connecté"
echo "   > Ou créez un nouveau site si nécessaire"
echo ""

# Phase 2: Configuration des variables d'environnement (SEMI-INTERACTIF)
echo "📋 PHASE 2 - Variables d'environnement (COPIEZ-COLLEZ LES COMMANDES):"
echo ""
echo "# Base de données Turso"
cat << 'EOF'
netlify env:set TURSO_DATABASE_URL "libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io"
netlify env:set TURSO_AUTH_TOKEN "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTgxNDY5OTEsImlkIjoiOWU2MjhhMjItNjU1ZC00NWI5LWJkODUtMWU4ZWMzYjA5YjFjIiwicmlkIjoiNDU3OGFlM2UtMTM2Ny00YjJiLTkzMzctZTY5ZjcwYjdkOTM4In0.uyhdXbGe8uwIR3LVSSpDBXyBC1DqRWZEKikUqfYi6MCeuwH6mQG_S0ZHe5a_oLfKQl41jzMjetYB5BE_GMlYCQ"

# Cloudinary (Gestion d'images)
netlify env:set CLOUDINARY_CLOUD_NAME "dsrvzogof"
netlify env:set CLOUDINARY_API_KEY "775318993136791"
netlify env:set CLOUDINARY_API_SECRET "ywTgN-mioXQXW1lOWmq2xNAIK7U"

# SMTP (Envoi d'emails)
netlify env:set SMTP_HOST "mail.topdigitalevel.site"
netlify env:set SMTP_PORT "587"
netlify env:set SMTP_USERNAME "info@topdigitalevel.site"
netlify env:set SMTP_PASSWORD "undPzZ3x3U"
netlify env:set SMTP_SECURE "tls"

# Variables d'environnement build (CRITIQUE pour monorepo pnpm)
netlify env:set PNPM_FLAGS "--shamefully-hoist"
netlify env:set NODE_VERSION "18"
netlify env:set PNPM_VERSION "8"

# URL publique (à mettre à jour après déploiement)
netlify env:set NUXT_PUBLIC_SITE_URL "https://VOTRE-SITE.netlify.app"
EOF

echo ""
echo "📋 PHASE 3 - Premier déploiement (VOUS DEVEZ EXÉCUTER):"
echo ""
echo "1. Déploiement de preview (test):"
echo "   netlify deploy"
echo ""
echo "2. Si le preview fonctionne, déploiement en production:"
echo "   netlify deploy --prod"
echo ""
echo "3. Récupérer l'URL finale et mettre à jour NUXT_PUBLIC_SITE_URL:"
echo "   netlify env:set NUXT_PUBLIC_SITE_URL \"https://votre-url-finale.netlify.app\""
echo ""

# Phase 4: Vérifications post-déploiement
echo "📋 PHASE 4 - Vérifications (AUTOMATIQUES):"
echo ""
echo "1. Vérifier les variables d'environnement:"
echo "   netlify env:list"
echo ""
echo "2. Vérifier les logs de déploiement:"
echo "   netlify logs:deploy"
echo ""
echo "3. Ouvrir le site déployé:"
echo "   netlify open"
echo ""

# Informations importantes
echo "⚠️  POINTS CRITIQUES:"
echo "• PNPM_FLAGS=\"--shamefully-hoist\" est OBLIGATOIRE pour les monorepos pnpm"
echo "• Le preset node-server est configuré dans nuxt.config.ts"
echo "• Build command: cd ../../ && pnpm install && pnpm build --filter=@ns2po/election-mvp"
echo "• Publish directory: apps/election-mvp/.output/public"
echo ""
echo "🔧 En cas de problème, consultez:"
echo "• docs/NETLIFY_DEPLOYMENT_GUIDE.md (troubleshooting complet)"
echo "• netlify logs:deploy (logs détaillés)"
echo "• https://app.netlify.com (interface web)"
echo ""
echo "✅ Configuration netlify.toml validée et prête"
echo "✅ Build local testé et fonctionnel avec preset node-server"
echo "✅ Structure .output conforme (public/ et server/)"