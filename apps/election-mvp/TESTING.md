# Guide de Tests Manuel - Système de Suivi

## Tests E2E Manuels du Système de Suivi

### Prérequis
- Application en cours d'exécution (`pnpm dev`)
- Base de données Turso connectée
- SMTP configuré pour les emails

### Test 1: Page de Suivi avec Référence Valide

**Objectif**: Vérifier que la page de suivi affiche correctement les informations d'une commande

**Étapes**:
1. Créer une pré-commande via l'API ou l'interface
2. Noter la référence générée (format: `ORDER_[timestamp]_[code]`)
3. Naviguer vers `/suivi/[référence]`
4. Vérifier l'affichage des informations:
   - Référence de commande
   - Timeline des événements
   - Informations de contact
   - Statut actuel

**Résultat attendu**: Page complète avec toutes les informations

### Test 2: Page de Suivi avec Référence Invalide

**Objectif**: Vérifier la gestion des erreurs pour les références inexistantes

**Étapes**:
1. Naviguer vers `/suivi/INVALID_REF_123`
2. Vérifier l'affichage du message d'erreur
3. Vérifier la présence d'informations de contact

**Résultat attendu**: Message d'erreur approprié avec options de contact

### Test 3: Responsivité Mobile

**Objectif**: Vérifier l'adaptation mobile de la page de suivi

**Étapes**:
1. Ouvrir la page de suivi sur mobile ou réduire la fenêtre
2. Vérifier l'adaptation du layout
3. Tester la lisibilité du contenu
4. Vérifier la timeline sur petit écran

**Résultat attendu**: Interface optimisée pour mobile

### Test 4: Composant TrackingTimeline

**Objectif**: Vérifier le fonctionnement du composant timeline

**Étapes**:
1. Accéder à une commande avec des événements
2. Vérifier l'affichage chronologique
3. Vérifier les icônes et couleurs
4. Tester différents statuts

**Résultat attendu**: Timeline claire et informative

### Test 5: Flux Complet Pré-commande → Suivi

**Objectif**: Tester le parcours utilisateur complet

**Étapes**:
1. Créer une nouvelle pré-commande
2. Noter la référence retournée
3. Vérifier la réception de l'email de confirmation
4. Accéder à la page de suivi via le lien email
5. Vérifier la cohérence des informations

**Résultat attendu**: Parcours fluide et informations cohérentes

### Test 6: Performance et Accessibilité

**Objectif**: Vérifier les aspects non-fonctionnels

**Étapes**:
1. Mesurer le temps de chargement (< 3s)
2. Tester la navigation au clavier
3. Vérifier les contrastes de couleur
4. Tester avec un lecteur d'écran

**Résultat attendu**: Performance acceptable et accessibilité conforme

## API Tests Manuel

### Test API: GET /api/orders/track/[reference]

```bash
# Test avec référence valide
curl -X GET "http://localhost:3000/api/orders/track/ORDER_1735095600000_ABC123XYZ"

# Test avec référence invalide
curl -X GET "http://localhost:3000/api/orders/track/INVALID_REF"
```

### Test API: POST /api/preorder/submit

```bash
curl -X POST "http://localhost:3000/api/preorder/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User"
    },
    "items": [
      {
        "id": "test-product",
        "quantity": 10,
        "totalPrice": 50000
      }
    ],
    "agreedToTerms": true,
    "paymentMethod": "commercial_contact"
  }'
```

## Checklist de Validation

### ✅ Fonctionnalités Critiques
- [ ] Page de suivi accessible via URL directe
- [ ] Affichage correct des informations de commande
- [ ] Gestion des erreurs pour références invalides
- [ ] Timeline visuelle fonctionnelle
- [ ] Emails de notification envoyés
- [ ] Responsivité mobile optimisée

### ✅ Intégrations
- [ ] Base de données Turso connectée
- [ ] Service email SMTP fonctionnel
- [ ] APIs de pré-commande opérationnelles
- [ ] Composants UI réutilisables

### ✅ Performance
- [ ] Temps de chargement < 3 secondes
- [ ] Gestion des erreurs réseau
- [ ] Indicateurs de chargement appropriés

### ✅ Accessibilité
- [ ] Navigation clavier complète
- [ ] Contrastes conformes WCAG
- [ ] Textes alternatifs présents
- [ ] Structure sémantique correcte

## Note Technique

Le système de tests E2E avec Playwright a rencontré des conflits de version dans l'environnement monorepo. Les tests manuels documentés ci-dessus couvrent l'essentiel des cas d'usage critiques.

Pour les tests automatisés futurs, considérer:
- Cypress comme alternative à Playwright
- Tests unitaires avec Vitest pour les composants
- Tests d'intégration API avec Supertest