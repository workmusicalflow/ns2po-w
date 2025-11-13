#!/bin/bash

# ==============================================================================
# Script de Test API Production - POST /api/quotes/send
# ==============================================================================
#
# Usage: ./scripts/test-production-quote-api.sh
#
# Objectif: Tester l'endpoint production Railway pour génération PDF + envoi email
# Prérequis: Déploiement Railway effectif + variables env configurées
#
# ==============================================================================

set -e

echo "🧪 Test API Production - NS2PO Quote Email + PDF"
echo "=================================================="
echo ""

# Configuration
PRODUCTION_URL="${PRODUCTION_URL:-https://nuxt-app-production-8b86.up.railway.app}"
API_ENDPOINT="$PRODUCTION_URL/api/quotes/send"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📍 Endpoint testé: $API_ENDPOINT"
echo ""

# Payload de test (sans champ organization - refactor effectué)
PAYLOAD='{
  "clientName": "Marie Koné",
  "clientEmail": "test@ns2po-demo.com",
  "clientPhone": "+225 07 89 12 34 56",
  "reference": "PROD-TEST-'$(date +%s)'",
  "items": [
    {
      "name": "T-Shirts personnalisés - Coton Premium",
      "imageUrl": "https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/tshirt-001.jpg",
      "customization": "Impression logo recto-verso, tailles variées (S-XXL)",
      "quantity": 100,
      "unitPrice": 3500,
      "totalPrice": 350000
    },
    {
      "name": "Casquettes brodées - Qualité Premium",
      "imageUrl": "https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/casquette-001.jpg",
      "customization": "Logo brodé 3D sur visière, réglable",
      "quantity": 50,
      "unitPrice": 2500,
      "totalPrice": 125000
    },
    {
      "name": "Stylos publicitaires - Métal Premium",
      "imageUrl": "https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/stylo-001.jpg",
      "customization": "Gravure laser nom candidat",
      "quantity": 500,
      "unitPrice": 850,
      "totalPrice": 425000
    }
  ],
  "subtotal": 900000,
  "discount": 0,
  "tax": 162000,
  "total": 1062000,
  "logoUrl": "https://res.cloudinary.com/dsrvzogof/image/upload/w_200,c_fit,q_auto,f_auto/v1759082596/logo-ns2po-mailing_vzelsq.png"
}'

echo "📦 Payload de test:"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""

echo "⏱️  Démarrage requête HTTP POST..."
START_TIME=$(date +%s%3N)

# Exécution avec mesure timing + HTTP status
RESPONSE=$(curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}s" \
  -s)

END_TIME=$(date +%s%3N)
ELAPSED_MS=$((END_TIME - START_TIME))

# Extraction HTTP status et timing
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
TIME_TOTAL=$(echo "$RESPONSE" | grep "TIME_TOTAL:" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d' | sed '/TIME_TOTAL:/d')

echo ""
echo "✅ Requête terminée"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Affichage résultats
echo ""
echo "📊 Résultats HTTP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Status Code:        $HTTP_STATUS"
echo "Temps total:        $TIME_TOTAL (${ELAPSED_MS}ms mesuré)"
echo ""

echo "📄 Réponse API:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

# Validation critères succès
echo "🎯 Validation Critères de Succès"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SUCCESS=true

# 1. HTTP 200
if [ "$HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ HTTP 200 OK${NC}"
else
  echo -e "${RED}❌ HTTP $HTTP_STATUS (attendu: 200)${NC}"
  SUCCESS=false
fi

# 2. Performance < 1000ms (tolérance production)
if [ "$ELAPSED_MS" -lt 1000 ]; then
  echo -e "${GREEN}✅ Performance < 1s (${ELAPSED_MS}ms)${NC}"
elif [ "$ELAPSED_MS" -lt 2000 ]; then
  echo -e "${YELLOW}⚠️  Performance acceptable (${ELAPSED_MS}ms) - peut s'améliorer après warm-up${NC}"
else
  echo -e "${RED}❌ Performance lente (${ELAPSED_MS}ms > 2s)${NC}"
  SUCCESS=false
fi

# 3. JSON valide avec champs requis
if echo "$RESPONSE_BODY" | jq -e '.success' >/dev/null 2>&1; then
  SUCCESS_FIELD=$(echo "$RESPONSE_BODY" | jq -r '.success')
  if [ "$SUCCESS_FIELD" = "true" ]; then
    echo -e "${GREEN}✅ Champ 'success: true' présent${NC}"

    # Vérifier emailId (Resend)
    if echo "$RESPONSE_BODY" | jq -e '.emailId' >/dev/null 2>&1; then
      EMAIL_ID=$(echo "$RESPONSE_BODY" | jq -r '.emailId')
      echo -e "${GREEN}✅ Email envoyé (ID: $EMAIL_ID)${NC}"
    else
      echo -e "${YELLOW}⚠️  Pas d'emailId retourné (vérifier Resend domain)${NC}"
    fi

    # Vérifier taille PDF
    if echo "$RESPONSE_BODY" | jq -e '.pdfSize' >/dev/null 2>&1; then
      PDF_SIZE=$(echo "$RESPONSE_BODY" | jq -r '.pdfSize')
      PDF_SIZE_KB=$((PDF_SIZE / 1024))
      echo -e "${GREEN}✅ PDF généré (${PDF_SIZE_KB} KB)${NC}"
    fi

  else
    echo -e "${RED}❌ Champ 'success: false'${NC}"
    SUCCESS=false
  fi
else
  echo -e "${RED}❌ Réponse JSON invalide ou manquante${NC}"
  SUCCESS=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Résumé final
if [ "$SUCCESS" = true ]; then
  echo -e "${GREEN}🎉 TEST RÉUSSI - API Production Opérationnelle${NC}"
  echo ""
  echo "Prochaines étapes:"
  echo "1. Vérifier inbox email test@ns2po-demo.com (ou votre email de test)"
  echo "2. Valider réception email avec PDF attaché"
  echo "3. Monitoring Railway: railway logs --follow"
  echo "4. Monitoring Resend: https://resend.com/emails"
  exit 0
else
  echo -e "${RED}❌ TEST ÉCHOUÉ - Vérifier logs Railway${NC}"
  echo ""
  echo "Debugging:"
  echo "1. Railway logs: railway logs --follow"
  echo "2. Vérifier variables env (RESEND_API_KEY, RESEND_FROM_EMAIL)"
  echo "3. Vérifier domaine Resend (reachup.site vérifié?)"
  exit 1
fi
