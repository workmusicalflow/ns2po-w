#!/bin/bash

# Script simple pour configurer les variables d'environnement Vercel
# Compatible avec macOS et bash/zsh

echo "🚀 Configuration des variables d'environnement Vercel"
echo "====================================================="
echo ""
echo "Les variables manquantes d'après 'vercel pull' :"
echo ""

# Liste des variables à ajouter
cat << 'EOF'
Variables à ajouter via 'vercel env add' :

1. TURSO_DATABASE_URL
   Valeur: libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io
   Environnements: Production, Preview, Development

2. TURSO_AUTH_TOKEN
   Valeur: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTgxNDY5OTEsImlkIjoiOWU2MjhhMjItNjU1ZC00NWI5LWJkODUtMWU4ZWMzYjA5YjFjIiwicmlkIjoiNDU3OGFlM2UtMTM2Ny00YjJiLTkzMzctZTY5ZjcwYjdkOTM4In0.uyhdXbGe8uwIR3LVSSpDBXyBC1DqRWZEKikUqfYi6MCeuwH6mQG_S0ZHe5a_oLfKQl41jzMjetYB5BE_GMlYCQ
   Environnements: Production, Preview, Development

3. CLOUDINARY_CLOUD_NAME
   Valeur: dsrvzogof
   Environnements: Production, Preview, Development

4. CLOUDINARY_API_KEY
   Valeur: 775318993136791
   Environnements: Production, Preview, Development

5. CLOUDINARY_API_SECRET
   Valeur: ywTgN-mioXQXW1lOWmq2xNAIK7U
   Environnements: Production, Preview, Development

6. SMTP_HOST
   Valeur: mail.topdigitalevel.site
   Environnements: Production, Preview, Development

7. SMTP_PORT
   Valeur: 587
   Environnements: Production, Preview, Development

8. SMTP_USERNAME
   Valeur: info@topdigitalevel.site
   Environnements: Production, Preview, Development

9. SMTP_PASSWORD
   Valeur: undPzZ3x3U
   Environnements: Production, Preview, Development

10. SMTP_SECURE
    Valeur: tls
    Environnements: Production, Preview, Development

11. NUXT_PUBLIC_SITE_URL
    Valeur: https://ns2po-e.vercel.app
    Environnements: Production, Preview, Development

EOF

echo ""
echo "📋 Commandes à exécuter une par une :"
echo ""
echo "vercel env add  # Puis répondez avec TURSO_DATABASE_URL, la valeur, et Production, Preview, Development"
echo "vercel env add  # Puis répondez avec TURSO_AUTH_TOKEN, la valeur, et Production, Preview, Development"
echo "vercel env add  # Puis répondez avec CLOUDINARY_CLOUD_NAME, la valeur, et Production, Preview, Development"
echo "vercel env add  # Et ainsi de suite pour chaque variable..."
echo ""
echo "✅ Une fois terminé, synchronisez avec :"
echo "vercel env pull .env.local"
echo ""
echo "🚀 Puis continuez avec le déploiement :"
echo "vercel build --prod"
echo "vercel deploy --prebuilt --prod"