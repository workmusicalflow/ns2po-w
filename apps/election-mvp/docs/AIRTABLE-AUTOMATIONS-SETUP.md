# Guide de Configuration des Automations Airtable Campaign Bundles

Ce guide détaille la configuration manuelle des automations Airtable pour le système Campaign Bundles de NS2PO.

## 📋 Vue d'ensemble

Les automations Airtable permettent de synchroniser automatiquement les données entre Airtable et l'application frontend. Elles déclenchent des webhooks vers l'API Nuxt pour :

- ✅ Invalidation du cache lors de modifications
- ✅ Recalcul automatique des totaux
- ✅ Synchronisation frontend en temps réel
- ✅ Notifications de nouveaux bundles

## 🔧 Prérequis

1. ✅ Tables CampaignBundles et BundleProducts créées
2. ✅ API routes `/api/campaign-bundles/*` déployées
3. ✅ Variables d'environnement configurées :
   ```bash
   NUXT_PUBLIC_SITE_URL=https://votre-domaine.vercel.app
   ```

## 🤖 Automation 1 : Invalidation Cache Bundle

### Déclencheur
- **Type** : Record updated (Enregistrement mis à jour)
- **Table** : CampaignBundles
- **Conditions** : L'un des champs suivants change :
  - `is_active`
  - `estimated_total`
  - `popularity`

### Actions

#### Action 1 : Webhook Invalidation
- **Type** : Send webhook
- **URL** : `${NUXT_PUBLIC_SITE_URL}/api/campaign-bundles/invalidate-cache`
- **Method** : POST
- **Headers** :
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body** :
  ```json
  {
    "bundle_id": "{{bundle_id}}",
    "record_id": "{{AIRTABLE_RECORD_ID}}",
    "trigger": "bundle_updated"
  }
  ```

#### Action 2 : Update Record
- **Table** : CampaignBundles
- **Record** : Current record
- **Fields** :
  - `last_cache_invalidation` = `{{NOW}}`
  - `sync_status` = `pending`

---

## 🧮 Automation 2 : Recalcul Totaux Bundle

### Déclencheur
- **Type** : Record updated (Enregistrement mis à jour)
- **Table** : BundleProducts
- **Conditions** : L'un des champs suivants change :
  - `base_price`
  - `quantity`

### Actions

#### Action 1 : Webhook Recalcul
- **Type** : Send webhook
- **URL** : `${NUXT_PUBLIC_SITE_URL}/api/campaign-bundles/recalculate-totals`
- **Method** : POST
- **Headers** :
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body** :
  ```json
  {
    "bundle_product_id": "{{AIRTABLE_RECORD_ID}}",
    "campaign_bundle_ids": "{{campaign_bundle}}",
    "trigger": "product_updated"
  }
  ```

---

## 🔄 Automation 3 : Synchronisation Frontend

### Déclencheur
- **Type** : Record updated (Enregistrement mis à jour)
- **Table** : CampaignBundles
- **Conditions** : Le champ `sync_status` passe à `pending`

### Actions

#### Action 1 : Webhook Sync Frontend
- **Type** : Send webhook
- **URL** : `${NUXT_PUBLIC_SITE_URL}/api/campaign-bundles/sync-frontend`
- **Method** : POST
- **Headers** :
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body** :
  ```json
  {
    "bundle_data": {
      "id": "{{AIRTABLE_RECORD_ID}}",
      "bundle_id": "{{bundle_id}}",
      "name": "{{name}}",
      "estimated_total": "{{estimated_total}}",
      "is_active": "{{is_active}}",
      "is_featured": "{{is_featured}}"
    },
    "operation": "sync_cache",
    "timestamp": "{{NOW}}"
  }
  ```

---

## 🆕 Automation 4 : Notification Nouveau Bundle

### Déclencheur
- **Type** : Record created (Enregistrement créé)
- **Table** : CampaignBundles

### Actions

#### Action 1 : Slack Notification (Optionnel)
- **Type** : Send to Slack
- **Channel** : #ns2po-updates
- **Message** :
  ```
  🎯 Nouveau pack de campagne créé: {{name}} ({{target_audience}}, {{estimated_total}} FCFA)
  ```

#### Action 2 : Webhook Nouveau Bundle
- **Type** : Send webhook
- **URL** : `${NUXT_PUBLIC_SITE_URL}/api/campaign-bundles/webhook/new-bundle`
- **Method** : POST
- **Headers** :
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body** :
  ```json
  {
    "bundle_id": "{{bundle_id}}",
    "name": "{{name}}",
    "target_audience": "{{target_audience}}",
    "estimated_total": "{{estimated_total}}"
  }
  ```

---

## 📝 Instructions de Configuration

### Étape 1 : Accéder aux Automations
1. Ouvrir la base Airtable NS2PO
2. Cliquer sur "Automations" dans la barre latérale
3. Cliquer sur "Create automation"

### Étape 2 : Configuration Générale
Pour chaque automation :

1. **Nommer l'automation** avec le nom indiqué ci-dessus
2. **Configurer le déclencheur** :
   - Sélectionner la table
   - Définir les conditions
   - Tester le déclencheur
3. **Ajouter les actions** dans l'ordre indiqué
4. **Tester l'automation** complète
5. **Activer l'automation**

### Étape 3 : Configuration des Webhooks
Pour chaque webhook :

1. **URL** : Remplacer `${NUXT_PUBLIC_SITE_URL}` par l'URL réelle
2. **Headers** : Copier exactement les headers JSON
3. **Body** : Copier le JSON en remplaçant les variables Airtable
4. **Test** : Utiliser le bouton "Test action"

### Étape 4 : Variables Airtable
Les variables suivantes sont disponibles dans Airtable :

- `{{AIRTABLE_RECORD_ID}}` : ID unique de l'enregistrement
- `{{NOW}}` : Timestamp actuel ISO
- `{{bundle_id}}` : Valeur du champ bundle_id
- `{{name}}` : Valeur du champ name
- etc. (tous les champs de la table)

---

## 🧪 Tests et Validation

### Test 1 : Invalidation Cache
1. Modifier le champ `estimated_total` d'un bundle
2. Vérifier que `last_cache_invalidation` se met à jour
3. Vérifier les logs de l'API `/api/campaign-bundles/invalidate-cache`

### Test 2 : Recalcul Totaux
1. Modifier le `base_price` d'un BundleProduct
2. Vérifier les logs de l'API `/api/campaign-bundles/recalculate-totals`
3. Vérifier que le total du bundle parent est recalculé

### Test 3 : Sync Frontend
1. Changer `sync_status` d'un bundle à `pending`
2. Vérifier les logs de l'API `/api/campaign-bundles/sync-frontend`
3. Vérifier que le statut repasse à `synced`

### Test 4 : Nouveau Bundle
1. Créer un nouveau CampaignBundle
2. Vérifier la notification Slack (si configurée)
3. Vérifier les logs de l'API `/api/campaign-bundles/webhook/new-bundle`

---

## 🚨 Dépannage

### Erreur 404 sur les Webhooks
- ✅ Vérifier que l'URL est correcte et accessible
- ✅ Vérifier que les routes API sont déployées
- ✅ Tester manuellement l'endpoint avec curl

### Erreur 500 sur les Webhooks
- ✅ Vérifier les logs Vercel/Nuxt
- ✅ Vérifier le format JSON du body
- ✅ Vérifier les variables d'environnement

### Automation ne se déclenche pas
- ✅ Vérifier les conditions du déclencheur
- ✅ Tester le déclencheur individuellement
- ✅ Vérifier que l'automation est active

### Variables Airtable incorrectes
- ✅ Utiliser l'outil de test d'Airtable
- ✅ Vérifier l'orthographe des noms de champs
- ✅ Utiliser `{{AIRTABLE_RECORD_ID}}` pour l'ID système

---

## 📊 Monitoring et Logs

### Dashboard Airtable
- Consulter l'onglet "Activity" des automations
- Vérifier les exécutions récentes
- Analyser les erreurs d'exécution

### Logs API
```bash
# Vérifier les logs Vercel
vercel logs --follow

# Ou dans l'interface Vercel
https://vercel.com/dashboard > Project > Functions
```

### Métriques de Performance
- Temps d'exécution des webhooks
- Taux de succès des automations
- Fréquence d'invalidation cache

---

## ✅ Checklist de Configuration

- [ ] Automation 1 : Invalidation Cache configurée et testée
- [ ] Automation 2 : Recalcul Totaux configurée et testée
- [ ] Automation 3 : Sync Frontend configurée et testée
- [ ] Automation 4 : Notification Nouveau Bundle configurée et testée
- [ ] Variables d'environnement vérifiées
- [ ] Tests end-to-end effectués
- [ ] Monitoring en place
- [ ] Documentation équipe partagée

---

## 🔗 Ressources

- [Documentation Airtable Automations](https://support.airtable.com/docs/getting-started-with-airtable-automations)
- [Webhook Testing Tool](https://webhook.site)
- [API Documentation NS2PO](/api/campaign-bundles)

Une fois toutes les automations configurées, le système Campaign Bundles sera entièrement synchronisé entre Airtable et l'application frontend !