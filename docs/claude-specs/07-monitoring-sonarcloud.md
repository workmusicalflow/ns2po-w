# 🔍 Monitoring SonarCloud

## Configuration Projet SonarCloud

- **Projet** : `workmusicalflow_ns2po-w`
- **Organisation** : `workmusicalflow`
- **Token d'accès** : `e2f7e9976d2bfce91c1eb6de29b1118835d88884`

## 📊 Récupération des Issues SonarCloud

```bash
# Récupérer toutes les issues du projet
curl -H "Authorization: Bearer e2f7e9976d2bfce91c1eb6de29b1118835d88884" \
  "https://sonarcloud.io/api/issues/search?componentKeys=workmusicalflow_ns2po-w&organization=workmusicalflow&ps=500"

# Statut de la Quality Gate
curl -H "Authorization: Bearer e2f7e9976d2bfce91c1eb6de29b1118835d88884" \
  "https://sonarcloud.io/api/qualitygates/project_status?projectKey=workmusicalflow_ns2po-w"

# Métriques détaillées du projet
curl -H "Authorization: Bearer e2f7e9976d2bfce91c1eb6de29b1118835d88884" \
  "https://sonarcloud.io/api/measures/component?component=workmusicalflow_ns2po-w&metricKeys=alert_status,bugs,vulnerabilities,security_hotspots,code_smells,coverage,duplicated_lines_density,ncloc,complexity,cognitive_complexity,reliability_rating,security_rating,sqale_rating"
```

## 🎯 Analyse des Retours SonarCloud

### Métriques clés à surveiller
- `alert_status` : Statut global de la Quality Gate (OK/ERROR)
- `bugs` : Nombre de bugs détectés
- `vulnerabilities` : Vulnérabilités de sécurité
- `security_hotspots` : Points chauds de sécurité à revoir
- `code_smells` : Problèmes de maintenabilité
- `coverage` : Couverture de tests (%)
- `reliability_rating` : Note de fiabilité (1=A, 2=B, 3=C, 4=D, 5=E)
- `security_rating` : Note de sécurité (1=A, 2=B, 3=C, 4=D, 5=E)
- `sqale_rating` : Note de maintenabilité (1=A, 2=B, 3=C, 4=D, 5=E)

### Conditions Quality Gate
- `new_reliability_rating` : ≤ 1 (A) pour nouveau code
- `new_security_rating` : ≤ 1 (A) pour nouveau code
- `new_maintainability_rating` : ≤ 1 (A) pour nouveau code
- `new_coverage` : ≥ 80% pour nouveau code
- `new_duplicated_lines_density` : ≤ 3% pour nouveau code
- `new_security_hotspots_reviewed` : 100% pour nouveau code

### Types d'issues par priorité
1. **CRITICAL/BLOCKER** : Problèmes bloquants (vulnérabilités critiques)
2. **MAJOR** : Problèmes importants (bugs, accessibilité)
3. **MINOR** : Améliorations (code smells, optimisations)
4. **INFO** : Informations (TODO, commentaires)

### Focus sécurité MVP
- Vulnérabilités dans les uploads de fichiers
- Validation des entrées utilisateur
- Protection contre les injections (SQL, XSS)
- Gestion sécurisée des tokens et secrets

## 🔄 Workflow Post-Push SonarCloud

### Processus Automatisé Post-Commit

**Après chaque `git push origin main`** :

1. **Déclenchement automatique** des GitHub Actions workflows :
   - `Build and Quality Gate` : Build du projet + analyse SonarCloud
   - `Code Quality Check` : Vérifications qualité complémentaires

2. **Monitoring des workflows** :
   ```bash
   # Vérifier le statut des workflows en cours
   gh run list --limit 3

   # Surveiller un workflow spécifique
   gh run watch [RUN_ID]
   ```

3. **Récupération des nouvelles métriques SonarCloud** (après ~2-3 minutes) :
   ```bash
   # Status global de la Quality Gate
   curl -H "Authorization: Bearer e2f7e9976d2bfce91c1eb6de29b1118835d88884" \
     "https://sonarcloud.io/api/qualitygates/project_status?projectKey=workmusicalflow_ns2po-w"

   # Nouvelles issues détectées
   curl -H "Authorization: Bearer e2f7e9976d2bfce91c1eb6de29b1118835d88884" \
     "https://sonarcloud.io/api/issues/search?componentKeys=workmusicalflow_ns2po-w&organization=workmusicalflow&ps=500&createdAfter=$(date -d '10 minutes ago' -Iseconds)"
   ```

4. **Analyse des retours** :
   - ✅ **Quality Gate PASSED** : Continuer le développement
   - ❌ **Quality Gate FAILED** : Corriger les nouvelles issues avant de continuer
   - 📊 **Métriques améliorées** : Documenter les gains de qualité

### Cycle d'Amélioration Continue

**Chaque push** devient une opportunité d'amélioration :

1. **Corriger** les issues critiques/majeures détectées
2. **Commiter** les corrections avec un message descriptif
3. **Pusher** pour déclencher une nouvelle analyse
4. **Monitorer** l'évolution des métriques
5. **Répéter** jusqu'à obtenir une Quality Gate stable

**Objectif MVP** : Maintenir une Quality Gate ✅ **PASSED** en permanence