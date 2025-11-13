#!/bin/bash
# Script de test API /api/quotes/send
# Usage: bash scripts/test-api-send-quote.sh

set -e

API_URL="${API_URL:-http://localhost:3003}"
ENDPOINT="/api/quotes/send"

echo "🧪 Test API: POST $API_URL$ENDPOINT"
echo ""

# Payload JSON (données mock réalistes)
PAYLOAD='{
  "reference": "DEV-2025-API-TEST",
  "clientName": "Marie Koné",
  "clientEmail": "m.kone@example.ci",
  "clientPhone": "+225 07 99 88 77 66",
  "clientOrganization": "Coalition Pour le Changement",
  "items": [
    {
      "name": "T-Shirts personnalisés Premium",
      "customization": "Impression 4 couleurs recto-verso + logo brodé col",
      "quantity": 1000,
      "unitPrice": 4500,
      "totalPrice": 4500000,
      "imageUrl": "https://res.cloudinary.com/dsrvzogof/image/upload/v1/products/tshirt-premium.jpg"
    },
    {
      "name": "Casquettes brodées Deluxe",
      "customization": "Broderie 3D premium + visière renforcée",
      "quantity": 500,
      "unitPrice": 3500,
      "totalPrice": 1750000,
      "imageUrl": "https://res.cloudinary.com/dsrvzogof/image/upload/v1/products/cap-deluxe.jpg"
    }
  ],
  "subtotal": 6250000,
  "discount": 312500,
  "discountPercent": 5,
  "tax": 1068750,
  "total": 7006250,
  "logoUrl": "https://res.cloudinary.com/dsrvzogof/image/upload/v1/ns2po/logo-ns2po.png"
}'

echo "📋 Envoi requête..."
echo ""

# Mesurer timing
START_TIME=$(date +%s%3N)

# Appel API avec curl
RESPONSE=$(curl -X POST "$API_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}s" \
  -s \
  2>&1)

END_TIME=$(date +%s%3N)
ELAPSED_TIME=$((END_TIME - START_TIME))

# Extraire HTTP status et timing
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
TIME_TOTAL=$(echo "$RESPONSE" | grep "TIME_TOTAL:" | cut -d: -f2)

# Extraire body (enlever les métadonnées)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/,$d')

echo "📊 Résultats:"
echo ""
echo "  • HTTP Status: $HTTP_STATUS"
echo "  • Temps total: ${ELAPSED_TIME}ms (curl: $TIME_TOTAL)"
echo ""

# Validation
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ API fonctionne correctement!"
  echo ""
  echo "📧 Réponse API:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""

  # Validation performance
  if [ "$ELAPSED_TIME" -lt 600 ]; then
    echo "⏱️  Performance OK: ${ELAPSED_TIME}ms < 600ms"
  else
    echo "⚠️  Performance lente: ${ELAPSED_TIME}ms > 600ms"
  fi

  exit 0
else
  echo "❌ Erreur API!"
  echo ""
  echo "Réponse brute:"
  echo "$BODY"
  exit 1
fi
