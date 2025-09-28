# Plans de Fallback - Déploiement NS2PO Election MVP

## 🚨 SITUATION CRITIQUE CONFIRMÉE

**Performance actuelle INACCEPTABLE:**
- Local (Turso): 1.68 req/s, 2.97s/requête
- Railway (fallback): 0.61 req/s, 8.2s/requête
- **Objectif**: >20 req/s, <500ms

**Problème identifié:** Architecture Nuxt/SSR sur-dimensionnée

---

## PLAN A - RAILWAY (ÉCHEC CONFIRMÉ)

**Status:** 🔴 ÉCHEC - Performance critique atteinte
- ✅ Déploiement technique réussi
- ❌ Performance inacceptable: 0.61 req/s
- ⚠️ Turso non configuré aggrave la situation

**Dockerfile validé et réutilisable** ✅

---

## PLAN B - RENDER.COM (ACTIVATION IMMÉDIATE)

### Configuration Render

```yaml
# render.yaml - À créer dans la racine du projet
services:
  - type: web
    name: ns2po-election-mvp
    env: docker
    dockerfilePath: ./Dockerfile
    plan: starter
    region: frankfurt  # Europe pour latence optimale
    scaling:
      minInstances: 1
      maxInstances: 3
    envVars:
      - key: NODE_ENV
        value: production
      - key: NITRO_PRESET
        value: node-server
      - key: PORT
        value: 3000
      - key: NUXT_HOST
        value: 0.0.0.0
      # Variables Turso
      - key: TURSO_DATABASE_URL
        value: libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io
      - key: TURSO_AUTH_TOKEN
        fromSecret: turso-auth-token
      # Variables Cloudinary
      - key: CLOUDINARY_CLOUD_NAME
        value: dsrvzogof
      - key: CLOUDINARY_API_KEY
        fromSecret: cloudinary-api-key
      - key: CLOUDINARY_API_SECRET
        fromSecret: cloudinary-api-secret
      # Variables SMTP
      - key: SMTP_HOST
        value: mail.topdigitalevel.site
      - key: SMTP_PORT
        value: 587
      - key: SMTP_USERNAME
        value: info@topdigitalevel.site
      - key: SMTP_PASSWORD
        fromSecret: smtp-password
      - key: SMTP_SECURE
        value: tls

buildCommand: echo "Using Dockerfile"
startCommand: echo "Using Dockerfile CMD"
```

### Déploiement Render
```bash
# 1. Connexion Render
# Aller sur https://dashboard.render.com/
# Connect GitHub repository: workmusicalflow/ns2po-w

# 2. Configuration service
# Type: Web Service
# Repository: workmusicalflow/ns2po-w
# Branch: main
# Runtime: Docker
# Root Directory: (vide - racine)
# Dockerfile: ./Dockerfile

# 3. Variables secrets à configurer manuellement:
# - turso-auth-token: [token complet depuis .env]
# - cloudinary-api-key: 775318993136791
# - cloudinary-api-secret: ywTgN-mioXQXW1lOWmq2xNAIK7U
# - smtp-password: undPzZ3x3U
```

### Avantages Render
- **Performance**: Containers optimisés vs Railway
- **Coût**: Plan gratuit 750h/mois (suffisant MVP)
- **Simplicité**: GitHub auto-deploy
- **Monitoring**: Métriques intégrées
- **SSL**: Automatique

---

## PLAN C - FLY.IO (FALLBACK ULTIME)

### Configuration Fly.io

```toml
# fly.toml - À créer dans la racine
app = "ns2po-election-mvp"
primary_region = "cdg" # Paris - optimisé Europe

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  NITRO_PRESET = "node-server"
  PORT = "3000"
  NUXT_HOST = "0.0.0.0"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  max_machines_running = 3

[[vm]]
  memory = '512mb'
  cpu_kind = 'performance'
```

### Déploiement Fly.io
```bash
# 1. Installation CLI
# brew install flyctl  # macOS
# curl -L https://fly.io/install.sh | sh  # Linux

# 2. Authentification
flyctl auth login

# 3. Lancement projet
flyctl launch --dockerfile --name ns2po-election-mvp --region cdg --ha=false

# 4. Configuration variables
flyctl secrets set TURSO_DATABASE_URL="libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io"
flyctl secrets set TURSO_AUTH_TOKEN="[token-depuis-.env]"
flyctl secrets set CLOUDINARY_CLOUD_NAME="dsrvzogof"
flyctl secrets set CLOUDINARY_API_KEY="775318993136791"
flyctl secrets set CLOUDINARY_API_SECRET="ywTgN-mioXQXW1lOWmq2xNAIK7U"
flyctl secrets set SMTP_HOST="mail.topdigitalevel.site"
flyctl secrets set SMTP_PORT="587"
flyctl secrets set SMTP_USERNAME="info@topdigitalevel.site"
flyctl secrets set SMTP_PASSWORD="undPzZ3x3U"
flyctl secrets set SMTP_SECURE="tls"

# 5. Déploiement
flyctl deploy --ha=false
```

### Avantages Fly.io
- **Performance**: Edge compute global
- **Latence**: Machines géographiquement proches
- **Scaling**: Auto-scaling intelligent
- **Coût**: Pay-per-use précis

---

## CRITÈRES DE DÉCLENCHEMENT

### Déclenchement Plan B (Render.com) - ✅ ATTEINTS
- [x] Railway performance < 5 req/s (actuel: 0.61 req/s)
- [x] Railway latence > 5s (actuel: 8.2s)
- [x] Memory leaks suspectés (Perplexity alert)
- [x] Performance locale insuffisante (1.68 req/s)

### Déclenchement Plan C (Fly.io) - Conditions
- [ ] Render.com échec de déploiement
- [ ] Render.com performance < Plan B
- [ ] Besoin edge computing spécifique

---

## PROCÉDURE D'URGENCE - ACTIVATION IMMÉDIATE

### Étapes recommandées (ordre priorité):

1. **IMMÉDIAT - Plan B Render.com**
   - Créer compte Render: https://dashboard.render.com/
   - Connecter repository GitHub
   - Configurer service avec render.yaml
   - Test performance attendue: 5-15 req/s

2. **SI ÉCHEC - Plan C Fly.io**
   - Installation CLI + authentification
   - Configuration fly.toml
   - Déploiement avec secrets
   - Test performance attendue: 10-25 req/s

3. **PARALLÈLE - Optimisation architecture**
   - Audit bundle size Nuxt
   - Investigation SSR → SPA/SSG
   - Optimisation TanStack Query
   - Profiling performance détaillé

---

## MONITORING POST-MIGRATION

### Métriques de succès
- **Performance**: >10 req/s (2x minimum actuel)
- **Latence**: <1s moyenne, <3s max
- **Disponibilité**: >99.5%
- **Memory**: Stable <300MB

### Outils monitoring
- Render/Fly.io métriques natives
- Google Analytics performance
- Custom API monitoring endpoints
- AlertManager pour déclenchements

---

## ROLLBACK STRATEGY

En cas d'échec migration:
1. **Rollback Railway**: `railway rollback [deployment-id]`
2. **Configuration DNS**: Retour domaine précédent
3. **Monitoring**: Vérification santé services
4. **Communication**: Notification utilisateurs si nécessaire

---

**Conclusion**: Migration Plan B (Render.com) recommandée **IMMÉDIATEMENT** vu les critères dépassés.