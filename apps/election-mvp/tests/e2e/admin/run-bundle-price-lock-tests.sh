#!/bin/bash

##############################################################################
# 🧪 Script d'Exécution Automatisée - Bundle Price Lock Tests
#
# Capture automatique des sorties dans fichiers horodatés
# Génération rapport synthétique JSON + Markdown
##############################################################################

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_FILE="$SCRIPT_DIR/bundles-price-lock.spec.ts"
RESULTS_DIR="$SCRIPT_DIR/test-results-bundle-price-lock"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

##############################################################################
# Fonction: Exécuter tests pour un browser
##############################################################################
run_browser_tests() {
  local browser=$1
  local output_file="$RESULTS_DIR/${TIMESTAMP}-${browser}.txt"
  local json_file="$RESULTS_DIR/${TIMESTAMP}-${browser}.json"

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🧪 Exécution: ${browser}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # Métadonnées
  cat > "$output_file" <<EOF
════════════════════════════════════════════════════════════════════════
🧪 BUNDLE PRICE LOCK - Résultats Tests E2E
════════════════════════════════════════════════════════════════════════

Browser:    ${browser}
Timestamp:  $(date +"%Y-%m-%d %H:%M:%S")
Test File:  bundles-price-lock.spec.ts
Strategy:   Découpage par Browser (10 tests)

════════════════════════════════════════════════════════════════════════

EOF

  # Exécution tests avec capture sortie
  local start_time=$(date +%s)

  if pnpm exec playwright test "$TEST_FILE" \
    --project="$browser" \
    --reporter=line \
    >> "$output_file" 2>&1; then

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo -e "${GREEN}✅ ${browser}: SUCCÈS (${duration}s)${NC}"

    # Ajouter résumé
    cat >> "$output_file" <<EOF

════════════════════════════════════════════════════════════════════════
✅ RÉSULTAT: SUCCÈS
════════════════════════════════════════════════════════════════════════

Durée:      ${duration}s
Browser:    ${browser}
Status:     PASSED

EOF

    # JSON pour parsing
    cat > "$json_file" <<EOF
{
  "browser": "$browser",
  "timestamp": "$TIMESTAMP",
  "duration": $duration,
  "status": "passed",
  "file": "$(basename "$output_file")"
}
EOF

    return 0
  else
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo -e "${RED}❌ ${browser}: ÉCHEC (${duration}s)${NC}"

    # Ajouter résumé échec
    cat >> "$output_file" <<EOF

════════════════════════════════════════════════════════════════════════
❌ RÉSULTAT: ÉCHEC
════════════════════════════════════════════════════════════════════════

Durée:      ${duration}s
Browser:    ${browser}
Status:     FAILED

⚠️  Consulter la sortie ci-dessus pour détails des échecs

EOF

    # JSON pour parsing
    cat > "$json_file" <<EOF
{
  "browser": "$browser",
  "timestamp": "$TIMESTAMP",
  "duration": $duration,
  "status": "failed",
  "file": "$(basename "$output_file")"
}
EOF

    return 1
  fi
}

##############################################################################
# Fonction: Générer rapport synthétique
##############################################################################
generate_report() {
  local report_file="$RESULTS_DIR/${TIMESTAMP}-RAPPORT.md"

  echo -e "${BLUE}📊 Génération rapport synthétique...${NC}"

  cat > "$report_file" <<EOF
# 📊 Rapport Tests Bundle Price Lock

**Date**: $(date +"%Y-%m-%d %H:%M:%S")
**Session**: ${TIMESTAMP}
**Feature**: Bundle Price Lock (Pareto 80/20)

---

## 📈 Résultats par Browser

EOF

  # Parser les JSON results
  local total_tests=0
  local passed_browsers=0
  local failed_browsers=0

  for json_file in "$RESULTS_DIR/${TIMESTAMP}"-*.json; do
    if [ -f "$json_file" ]; then
      local browser=$(grep -o '"browser": "[^"]*"' "$json_file" | cut -d'"' -f4)
      local status=$(grep -o '"status": "[^"]*"' "$json_file" | cut -d'"' -f4)
      local duration=$(grep -o '"duration": [0-9]*' "$json_file" | grep -o '[0-9]*')
      local output_file=$(grep -o '"file": "[^"]*"' "$json_file" | cut -d'"' -f4)

      if [ "$status" = "passed" ]; then
        echo "### ✅ ${browser} - SUCCÈS" >> "$report_file"
        ((passed_browsers++))
      else
        echo "### ❌ ${browser} - ÉCHEC" >> "$report_file"
        ((failed_browsers++))
      fi

      echo "" >> "$report_file"
      echo "- **Durée**: ${duration}s" >> "$report_file"
      echo "- **Fichier**: \`${output_file}\`" >> "$report_file"
      echo "" >> "$report_file"

      ((total_tests++))
    fi
  done

  # Synthèse globale
  cat >> "$report_file" <<EOF

---

## 📋 Synthèse Globale

| Métrique | Valeur |
|----------|--------|
| Browsers testés | ${total_tests} |
| ✅ Succès | ${passed_browsers} |
| ❌ Échecs | ${failed_browsers} |
| 📁 Répertoire | \`test-results-bundle-price-lock/\` |

---

## 📂 Fichiers Générés

EOF

  # Lister tous les fichiers de cette session
  for file in "$RESULTS_DIR/${TIMESTAMP}"-*; do
    if [ -f "$file" ]; then
      echo "- \`$(basename "$file")\`" >> "$report_file"
    fi
  done

  cat >> "$report_file" <<EOF

---

## 🔍 Analyse des Résultats

Pour analyser un fichier spécifique :

\`\`\`bash
cat test-results-bundle-price-lock/${TIMESTAMP}-chromium.txt
\`\`\`

Pour voir uniquement les échecs :

\`\`\`bash
grep -E "✗|Error|Expected" test-results-bundle-price-lock/${TIMESTAMP}-chromium.txt
\`\`\`

---

**Généré par**: \`run-bundle-price-lock-tests.sh\`
EOF

  echo -e "${GREEN}✅ Rapport généré: ${report_file}${NC}"
  echo "$report_file"
}

##############################################################################
# MENU PRINCIPAL
##############################################################################
main() {
  echo ""
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}   🧪 BUNDLE PRICE LOCK - Test Runner Automatisé          ${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo ""

  # Créer répertoire résultats si nécessaire
  mkdir -p "$RESULTS_DIR"

  # Menu de sélection
  echo "Quelle stratégie d'exécution ?"
  echo ""
  echo "  1) Chromium uniquement (10 tests, ~3min)"
  echo "  2) Firefox uniquement (10 tests, ~3min)"
  echo "  3) Mobile Chrome uniquement (10 tests, ~3min)"
  echo "  4) Tous les browsers séquentiellement (30 tests, ~10min)"
  echo "  5) Mode Debug (Chromium avec Playwright Inspector)"
  echo "  6) Quitter"
  echo ""
  read -p "Votre choix [1-6]: " choice
  echo ""

  case $choice in
    1)
      run_browser_tests "chromium"
      generate_report
      ;;
    2)
      run_browser_tests "firefox"
      generate_report
      ;;
    3)
      run_browser_tests "mobile-chrome"
      generate_report
      ;;
    4)
      echo -e "${YELLOW}⏳ Exécution séquentielle de tous les browsers...${NC}"
      echo ""
      run_browser_tests "chromium"
      echo ""
      run_browser_tests "firefox"
      echo ""
      run_browser_tests "mobile-chrome"
      echo ""
      generate_report
      ;;
    5)
      echo -e "${YELLOW}🐛 Lancement mode Debug (Playwright Inspector)...${NC}"
      PWDEBUG=1 pnpm exec playwright test "$TEST_FILE" --project=chromium
      ;;
    6)
      echo -e "${YELLOW}👋 Au revoir !${NC}"
      exit 0
      ;;
    *)
      echo -e "${RED}❌ Choix invalide${NC}"
      exit 1
      ;;
  esac

  echo ""
  echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}   ✅ Exécution terminée                                    ${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "📁 Résultats sauvegardés dans: ${BLUE}test-results-bundle-price-lock/${NC}"
  echo -e "📊 Rapport: ${BLUE}${TIMESTAMP}-RAPPORT.md${NC}"
  echo ""
}

# Exécuter menu principal
main
