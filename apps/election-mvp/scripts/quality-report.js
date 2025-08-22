#!/usr/bin/env node

/**
 * Script de génération automatique de rapports de qualité de code
 * Utilise SonarCloud API pour récupérer les métriques et générer un rapport
 */

const fs = require('fs');
const path = require('path');

// Configuration SonarCloud
const SONAR_CONFIG = {
  baseUrl: 'https://sonarcloud.io/api',
  component: 'workmusicalflow_ns2po-w',
  organization: 'workmusicalflow',
  // Token sera récupéré depuis les variables d'environnement
  token: process.env.SONAR_TOKEN
};

/**
 * Récupère les métriques de qualité depuis SonarCloud
 */
async function fetchQualityMetrics() {
  const metricsEndpoint = `${SONAR_CONFIG.baseUrl}/measures/component`;
  const params = new URLSearchParams({
    component: SONAR_CONFIG.component,
    metricKeys: [
      'reliability_rating',
      'security_rating', 
      'sqale_rating',
      'coverage',
      'duplicated_lines_density',
      'ncloc',
      'bugs',
      'vulnerabilities',
      'code_smells',
      'security_hotspots'
    ].join(',')
  });

  try {
    const response = await fetch(`${metricsEndpoint}?${params}`, {
      headers: {
        'Authorization': `Bearer ${SONAR_CONFIG.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.component?.measures || [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des métriques:', error.message);
    return [];
  }
}

/**
 * Récupère les issues de qualité depuis SonarCloud
 */
async function fetchQualityIssues() {
  const issuesEndpoint = `${SONAR_CONFIG.baseUrl}/issues/search`;
  const params = new URLSearchParams({
    componentKeys: SONAR_CONFIG.component,
    organization: SONAR_CONFIG.organization,
    ps: 500 // Récupérer jusqu'à 500 issues
  });

  try {
    const response = await fetch(`${issuesEndpoint}?${params}`, {
      headers: {
        'Authorization': `Bearer ${SONAR_CONFIG.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.issues || [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des issues:', error.message);
    return [];
  }
}

/**
 * Transforme une note SonarCloud en emoji et description
 */
function getRatingDisplay(rating) {
  const ratings = {
    '1.0': { emoji: '🟢', label: 'A (Excellent)' },
    '2.0': { emoji: '🟡', label: 'B (Bon)' },
    '3.0': { emoji: '🟠', label: 'C (Moyen)' },
    '4.0': { emoji: '🔴', label: 'D (Mauvais)' },
    '5.0': { emoji: '⚫', label: 'E (Critique)' }
  };
  return ratings[rating] || { emoji: '❓', label: 'Inconnu' };
}

/**
 * Génère un rapport de qualité au format Markdown
 */
function generateQualityReport(metrics, issues) {
  const now = new Date();
  const reportDate = now.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Transformation des métriques
  const metricsMap = {};
  metrics.forEach(measure => {
    metricsMap[measure.metric] = measure.value;
  });

  // Analyse des issues par sévérité
  const issuesBySeverity = issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {});

  // Analyse des issues par type
  const issuesByType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});

  const reliabilityRating = getRatingDisplay(metricsMap.reliability_rating);
  const securityRating = getRatingDisplay(metricsMap.security_rating);
  const maintainabilityRating = getRatingDisplay(metricsMap.sqale_rating);

  const report = `# 📊 Rapport de Qualité de Code

**Généré le :** ${reportDate}  
**Projet :** NS2PO Election MVP  
**Branch :** main

## 🎯 Vue d'ensemble

### Notes de Qualité
- **Fiabilité :** ${reliabilityRating.emoji} ${reliabilityRating.label}
- **Sécurité :** ${securityRating.emoji} ${securityRating.label}  
- **Maintenabilité :** ${maintainabilityRating.emoji} ${maintainabilityRating.label}

### Métriques Clés
- **Lignes de code :** ${parseInt(metricsMap.ncloc || 0).toLocaleString('fr-FR')}
- **Couverture de tests :** ${metricsMap.coverage || '0'}%
- **Duplication :** ${metricsMap.duplicated_lines_density || '0'}%

## 🐛 Issues par Sévérité

| Sévérité | Nombre | Status |
|----------|--------|--------|
| BLOCKER | ${issuesBySeverity.BLOCKER || 0} | ${(issuesBySeverity.BLOCKER || 0) === 0 ? '✅' : '❌'} |
| CRITICAL | ${issuesBySeverity.CRITICAL || 0} | ${(issuesBySeverity.CRITICAL || 0) === 0 ? '✅' : '❌'} |
| MAJOR | ${issuesBySeverity.MAJOR || 0} | ${(issuesBySeverity.MAJOR || 0) === 0 ? '✅' : '⚠️'} |
| MINOR | ${issuesBySeverity.MINOR || 0} | ${(issuesBySeverity.MINOR || 0) <= 10 ? '✅' : '⚠️'} |
| INFO | ${issuesBySeverity.INFO || 0} | ℹ️ |

## 🔍 Issues par Type

| Type | Nombre |
|------|--------|
| BUG | ${issuesByType.BUG || 0} |
| VULNERABILITY | ${issuesByType.VULNERABILITY || 0} |
| CODE_SMELL | ${issuesByType.CODE_SMELL || 0} |
| SECURITY_HOTSPOT | ${issuesByType.SECURITY_HOTSPOT || 0} |

## 📈 Tendances et Recommandations

### ✅ Points Positifs
- ${(issuesBySeverity.CRITICAL || 0) === 0 ? 'Aucun problème CRITICAL' : 'Problèmes CRITICAL à traiter'}
- ${parseFloat(metricsMap.duplicated_lines_density || 0) < 5 ? 'Duplication de code acceptable' : 'Duplication élevée'}
- ${parseInt(metricsMap.ncloc || 0)} lignes de code au total

### 🎯 Actions Prioritaires
${(issuesBySeverity.BLOCKER || 0) > 0 ? '1. **URGENT:** Corriger les ' + issuesBySeverity.BLOCKER + ' problèmes BLOCKER\n' : ''}${(issuesBySeverity.CRITICAL || 0) > 0 ? '2. **URGENT:** Corriger les ' + issuesBySeverity.CRITICAL + ' problèmes CRITICAL\n' : ''}${(issuesBySeverity.MAJOR || 0) > 5 ? '3. Réduire les problèmes MAJOR (' + issuesBySeverity.MAJOR + ' actuellement)\n' : ''}${parseFloat(metricsMap.coverage || 0) < 80 ? '4. Améliorer la couverture de tests (actuellement ' + (metricsMap.coverage || 0) + '%)\n' : ''}

### 📊 Seuils de Qualité
- **Bugs :** ${parseInt(metricsMap.bugs || 0)} ${parseInt(metricsMap.bugs || 0) === 0 ? '✅' : '❌'}
- **Vulnérabilités :** ${parseInt(metricsMap.vulnerabilities || 0)} ${parseInt(metricsMap.vulnerabilities || 0) === 0 ? '✅' : '❌'}
- **Code smells :** ${parseInt(metricsMap.code_smells || 0)} ${parseInt(metricsMap.code_smells || 0) < 50 ? '✅' : '⚠️'}

---

*Rapport généré automatiquement via SonarCloud API*  
*Prochaine analyse : ${new Date(now.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}*
`;

  return report;
}

/**
 * Sauvegarde le rapport dans un fichier
 */
function saveReport(content) {
  const reportsDir = path.join(__dirname, '../quality-reports');
  
  // Créer le dossier s'il n'existe pas
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `quality-report-${timestamp}.md`;
  const filepath = path.join(reportsDir, filename);

  fs.writeFileSync(filepath, content, 'utf8');
  
  // Créer/mettre à jour le rapport latest
  const latestPath = path.join(reportsDir, 'latest.md');
  fs.writeFileSync(latestPath, content, 'utf8');

  return { filepath, filename };
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Génération du rapport de qualité de code...\n');

  if (!SONAR_CONFIG.token) {
    console.error('❌ Token SonarCloud manquant. Définissez SONAR_TOKEN dans les variables d\'environnement.');
    process.exit(1);
  }

  try {
    console.log('📊 Récupération des métriques SonarCloud...');
    const metrics = await fetchQualityMetrics();
    
    console.log('🐛 Récupération des issues...');
    const issues = await fetchQualityIssues();

    console.log('📝 Génération du rapport...');
    const report = generateQualityReport(metrics, issues);

    console.log('💾 Sauvegarde du rapport...');
    const { filepath, filename } = saveReport(report);

    console.log('\n✅ Rapport généré avec succès !');
    console.log(`📄 Fichier: ${filename}`);
    console.log(`📁 Chemin: ${filepath}`);
    
    // Afficher un résumé dans la console
    const issuesBySeverity = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Résumé:');
    console.log(`   Issues CRITICAL: ${issuesBySeverity.CRITICAL || 0}`);
    console.log(`   Issues MAJOR: ${issuesBySeverity.MAJOR || 0}`);
    console.log(`   Issues MINOR: ${issuesBySeverity.MINOR || 0}`);
    console.log(`   Total issues: ${issues.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération du rapport:', error.message);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  fetchQualityMetrics,
  fetchQualityIssues,
  generateQualityReport,
  saveReport
};