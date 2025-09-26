#!/bin/bash

# Script pour générer les commandes vercel env add
# Plus simple et plus fiable que l'automatisation avec expect

echo "🚀 Génération des commandes Vercel ENV"
echo "======================================="
echo ""
echo "Copiez et collez ces commandes une par une dans votre terminal :"
echo ""

# Variables d'environnement avec échappement correct
TURSO_DATABASE_URL="libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTgxNDY5OTEsImlkIjoiOWU2MjhhMjItNjU1ZC00NWI5LWJkODUtMWU4ZWMzYjA5YjFjIiwicmlkIjoiNDU3OGFlM2UtMTM2Ny00YjJiLTkzMzctZTY5ZjcwYjdkOTM4In0.uyhdXbGe8uwIR3LVSSpDBXyBC1DqRWZEKikUqfYi6MCeuwH6mQG_S0ZHe5a_oLfKQl41jzMjetYB5BE_GMlYCQ"
CLOUDINARY_CLOUD_NAME="dsrvzogof"
CLOUDINARY_API_KEY="775318993136791"
CLOUDINARY_API_SECRET="ywTgN-mioXQXW1lOWmq2xNAIK7U"
SMTP_HOST="mail.topdigitalevel.site"
SMTP_PORT="587"
SMTP_USERNAME="info@topdigitalevel.site"
SMTP_PASSWORD="undPzZ3x3U"
SMTP_SECURE="tls"
NUXT_PUBLIC_SITE_URL="https://ns2po-e.vercel.app"

# Variables d'environnement à configurer
VARS="TURSO_DATABASE_URL TURSO_AUTH_TOKEN CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET SMTP_HOST SMTP_PORT SMTP_USERNAME SMTP_PASSWORD SMTP_SECURE NUXT_PUBLIC_SITE_URL"

echo "📋 Commandes à exécuter une par une :"
echo ""

for var_name in $VARS; do
    eval var_value="\$$var_name"
    echo "# $var_name"
    echo "vercel env add"
    echo "# Répondez: $var_name"
    echo "# Répondez: $var_value"
    echo "# Répondez: Production, Preview, Development"
    echo ""
done

echo "✅ Une fois terminé, exécutez :"
echo "vercel env pull .env.local"