/**
 * Schéma Airtable pour la Gestion d'Assets NS2PO
 * 
 * Tables optimisées pour workflow développeur et non-développeur
 * Configuration à appliquer dans la base Airtable
 */

export const AIRTABLE_SCHEMA = {
  // =====================================
  // CAMPAIGN BUNDLES MANAGEMENT
  // =====================================

  // Table principale des packs de campagne
  CampaignBundles: {
    tableName: 'CampaignBundles',
    description: 'Gestion des packs de campagne pré-configurés NS2PO',
    fields: {
      // Identifiants
      name: {
        type: 'singleLineText',
        description: 'Nom du pack (ex: Pack Argent)',
        required: true
      },

      bundle_id: {
        type: 'singleLineText',
        description: 'ID unique du bundle (ex: pack-argent-001)',
        required: true
      },

      description: {
        type: 'longText',
        description: 'Description marketing du pack'
      },

      // Ciblage et positionnement
      target_audience: {
        type: 'singleSelect',
        options: [
          { name: 'local', color: 'blueLight2' },
          { name: 'regional', color: 'greenLight2' },
          { name: 'national', color: 'purpleLight2' },
          { name: 'universal', color: 'orangeLight2' }
        ],
        description: 'Niveau de campagne ciblé'
      },

      budget_range: {
        type: 'singleSelect',
        options: [
          { name: 'starter', color: 'grayLight2' },
          { name: 'medium', color: 'yellowLight2' },
          { name: 'premium', color: 'redLight2' },
          { name: 'enterprise', color: 'purpleLight2' }
        ],
        description: 'Gamme budgétaire'
      },

      // Tarification
      estimated_total: {
        type: 'currency',
        description: 'Prix total estimé avec remise',
        symbol: 'FCFA',
        required: true
      },

      original_total: {
        type: 'currency',
        description: 'Prix original avant remise',
        symbol: 'FCFA'
      },

      savings: {
        type: 'currency',
        description: 'Montant d\'économie (original - estimé)',
        symbol: 'FCFA'
      },

      // Métriques et popularité
      popularity: {
        type: 'number',
        description: 'Score de popularité (0-100)',
        precision: 0
      },

      // Statuts et contrôles
      is_active: {
        type: 'checkbox',
        description: 'Pack visible et sélectionnable',
        defaultValue: true
      },

      is_featured: {
        type: 'checkbox',
        description: 'Pack mis en avant (badge populaire)'
      },

      // Tags et métadonnées
      tags: {
        type: 'multipleSelects',
        options: [
          { name: '5k-personnes', color: 'blueLight1' },
          { name: '10k-15k-personnes', color: 'greenLight1' },
          { name: '20k-30k-personnes', color: 'purpleLight1' },
          { name: 'campagne-locale', color: 'orangeLight1' },
          { name: 'départementale', color: 'yellowLight1' },
          { name: 'national', color: 'redLight1' },
          { name: 'budget-optimisé', color: 'grayLight1' },
          { name: 'prestige', color: 'purpleLight1' },
          { name: 'premium', color: 'redLight1' }
        ],
        description: 'Tags de classification et recherche'
      },

      // Relations
      bundle_products: {
        type: 'multipleRecordLinks',
        linkedTable: 'BundleProducts',
        description: 'Produits inclus dans ce pack'
      },

      // Timestamps
      created_time: {
        type: 'createdTime',
        description: 'Date de création automatique'
      },

      last_modified: {
        type: 'lastModifiedTime',
        description: 'Dernière modification automatique'
      },

      // Cache et synchronisation
      last_cache_invalidation: {
        type: 'dateTime',
        description: 'Dernière invalidation cache'
      },

      sync_status: {
        type: 'singleSelect',
        options: [
          { name: 'synced', color: 'greenBright' },
          { name: 'pending', color: 'yellowBright' },
          { name: 'error', color: 'redBright' }
        ],
        description: 'Statut de synchronisation avec frontend'
      }
    },

    // Vues optimisées pour la gestion
    views: {
      'Packs Actifs': {
        type: 'grid',
        filters: [{ field: 'is_active', operator: 'is', value: true }],
        sort: [{ field: 'popularity', direction: 'desc' }],
        fields: ['name', 'target_audience', 'budget_range', 'estimated_total', 'popularity', 'is_featured']
      },

      'Par Popularité': {
        type: 'grid',
        sort: [
          { field: 'is_featured', direction: 'desc' },
          { field: 'popularity', direction: 'desc' }
        ],
        fields: ['name', 'popularity', 'estimated_total', 'target_audience']
      },

      'Gestion Tarifs': {
        type: 'grid',
        fields: ['name', 'estimated_total', 'original_total', 'savings', 'last_modified'],
        sort: [{ field: 'estimated_total', direction: 'desc' }]
      },

      'Sync Status': {
        type: 'grid',
        filters: [{ field: 'sync_status', operator: 'is not', value: 'synced' }],
        fields: ['name', 'sync_status', 'last_cache_invalidation', 'last_modified']
      }
    }
  },

  // Table des produits dans les bundles
  BundleProducts: {
    tableName: 'BundleProducts',
    description: 'Produits inclus dans les packs de campagne avec quantités',
    fields: {
      // Identifiants
      product_name: {
        type: 'singleLineText',
        description: 'Nom du produit dans le bundle',
        required: true
      },

      product_id: {
        type: 'singleLineText',
        description: 'ID référence du produit',
        required: true
      },

      // Tarification
      base_price: {
        type: 'currency',
        description: 'Prix unitaire de base',
        symbol: 'FCFA',
        required: true
      },

      quantity: {
        type: 'number',
        description: 'Quantité incluse dans le pack',
        precision: 0,
        required: true
      },

      subtotal: {
        type: 'formula',
        description: 'Sous-total calculé (base_price * quantity)',
        formula: '{base_price} * {quantity}'
      },

      // Relations
      campaign_bundle: {
        type: 'multipleRecordLinks',
        linkedTable: 'CampaignBundles',
        description: 'Pack(s) contenant ce produit'
      },

      // Référence vers table Products existante (optionnel)
      linked_product: {
        type: 'multipleRecordLinks',
        linkedTable: 'Products',
        description: 'Lien vers le produit du catalogue principal'
      },

      // Métadonnées
      display_order: {
        type: 'number',
        description: 'Ordre d\'affichage dans le pack',
        precision: 0
      },

      // Timestamps
      created_time: {
        type: 'createdTime',
        description: 'Date de création automatique'
      },

      last_modified: {
        type: 'lastModifiedTime',
        description: 'Dernière modification automatique'
      }
    },

    // Vues optimisées
    views: {
      'Par Bundle': {
        type: 'grid',
        sort: [
          { field: 'campaign_bundle', direction: 'asc' },
          { field: 'display_order', direction: 'asc' }
        ],
        fields: ['product_name', 'campaign_bundle', 'quantity', 'base_price', 'subtotal']
      },

      'Prix Élevés': {
        type: 'grid',
        sort: [{ field: 'subtotal', direction: 'desc' }],
        fields: ['product_name', 'base_price', 'quantity', 'subtotal', 'campaign_bundle']
      },

      'Récent': {
        type: 'grid',
        sort: [{ field: 'last_modified', direction: 'desc' }],
        fields: ['product_name', 'campaign_bundle', 'last_modified']
      }
    }
  },

  // Table principale pour tous les assets
  Assets: {
    tableName: 'Assets',
    description: 'Gestion centralisée de tous les assets (produits, logos, backgrounds, icons)',
    fields: {
      // Identifiant et métadonnées de base
      name: {
        type: 'singleLineText',
        description: 'Nom descriptif de l\'asset',
        required: true
      },
      
      // Catégorisation automatique
      category: {
        type: 'singleSelect',
        options: [
          { name: 'products', color: 'blueLight2' },
          { name: 'logos', color: 'greenLight2' }, 
          { name: 'backgrounds', color: 'purpleLight2' },
          { name: 'icons', color: 'orangeLight2' }
        ],
        description: 'Catégorie principale (détectée automatiquement)'
      },
      
      subcategory: {
        type: 'singleSelect', 
        options: [
          // Products
          { name: 'textiles', color: 'blueLight1' },
          { name: 'gadgets', color: 'blueLight1' },
          { name: 'epi', color: 'blueLight1' },
          // Logos
          { name: 'client-samples', color: 'greenLight1' },
          { name: 'ns2po-branding', color: 'greenLight1' },
          // Backgrounds  
          { name: 'election-themes', color: 'purpleLight1' },
          { name: 'corporate-patterns', color: 'purpleLight1' },
          // Icons
          { name: 'ui-elements', color: 'orangeLight1' },
          { name: 'social-media', color: 'orangeLight1' }
        ],
        description: 'Sous-catégorie spécialisée'
      },

      // Intégration Cloudinary
      cloudinary_public_id: {
        type: 'singleLineText',
        description: 'Public ID Cloudinary (ex: ns2po/products/textile-tshirt-001)',
        required: true
      },

      cloudinary_url: {
        type: 'url',
        description: 'URL Cloudinary sécurisée',
        required: true
      },

      cloudinary_transformations: {
        type: 'longText',
        description: 'JSON des transformations disponibles (généré automatiquement)'
      },

      // Statut et workflow
      status: {
        type: 'singleSelect',
        options: [
          { name: 'active', color: 'greenBright' },
          { name: 'draft', color: 'yellowBright' },
          { name: 'archived', color: 'grayBright' },
          { name: 'processing', color: 'blueBright' }
        ],
        description: 'Statut de l\'asset dans le workflow'
      },

      // Métadonnées business (pour produits)
      price_base: {
        type: 'currency',
        description: 'Prix de base (pour assets produits)',
        symbol: 'FCFA'
      },

      min_quantity: {
        type: 'number',
        description: 'Quantité minimale de commande'
      },

      // Workflow et traçabilité  
      uploaded_by: {
        type: 'singleLineText',
        description: 'Utilisateur ayant uploadé l\'asset'
      },

      upload_source: {
        type: 'singleSelect',
        options: [
          { name: 'freepik', color: 'redLight2' },
          { name: 'custom', color: 'grayLight2' },
          { name: 'client', color: 'purpleLight2' }
        ],
        description: 'Source de l\'asset'
      },

      // Timestamps automatiques
      created_time: {
        type: 'createdTime',
        description: 'Date de création automatique'
      },

      last_modified: {
        type: 'lastModifiedTime',
        description: 'Dernière modification automatique'
      },

      // Relations
      products: {
        type: 'multipleRecordLinks',
        linkedTable: 'Products',
        description: 'Produits utilisant cet asset'
      },

      // Cache et performance
      last_cache_invalidation: {
        type: 'dateTime',
        description: 'Dernière invalidation cache Cloudinary'
      },

      sync_status: {
        type: 'singleSelect',
        options: [
          { name: 'synced', color: 'greenBright' },
          { name: 'pending', color: 'yellowBright' },
          { name: 'error', color: 'redBright' }
        ],
        description: 'Statut de synchronisation avec Turso'
      }
    },

    // Vues optimisées pour différents workflows
    views: {
      'Assets Actifs': {
        type: 'grid',
        filters: [{ field: 'status', operator: 'is', value: 'active' }],
        sort: [{ field: 'last_modified', direction: 'desc' }],
        fields: ['name', 'category', 'subcategory', 'cloudinary_url', 'status', 'last_modified']
      },

      'Galerie Produits': {
        type: 'gallery',
        filters: [{ field: 'category', operator: 'is', value: 'products' }],
        galleryOptions: {
          imageField: 'cloudinary_url',
          aspectRatio: 'square'
        }
      },

      'Upload Recent': {
        type: 'grid',
        sort: [{ field: 'created_time', direction: 'desc' }],
        fields: ['name', 'category', 'status', 'uploaded_by', 'created_time']
      },

      'Sync Errors': {
        type: 'grid',
        filters: [{ field: 'sync_status', operator: 'is', value: 'error' }],
        fields: ['name', 'sync_status', 'cloudinary_public_id', 'last_modified']
      }
    }
  },

  // Table de synchronisation avec Turso
  SyncLog: {
    tableName: 'SyncLog',
    description: 'Journal de synchronisation Airtable ↔ Turso',
    fields: {
      asset_id: {
        type: 'multipleRecordLinks',
        linkedTable: 'Assets',
        description: 'Asset synchronisé'
      },

      operation: {
        type: 'singleSelect',
        options: [
          { name: 'create', color: 'greenBright' },
          { name: 'update', color: 'blueBright' },
          { name: 'delete', color: 'redBright' }
        ],
        description: 'Type d\'opération'
      },

      turso_status: {
        type: 'singleSelect',
        options: [
          { name: 'success', color: 'greenBright' },
          { name: 'error', color: 'redBright' },
          { name: 'pending', color: 'yellowBright' }
        ],
        description: 'Statut dans Turso'
      },

      error_message: {
        type: 'longText',
        description: 'Message d\'erreur si applicable'
      },

      sync_timestamp: {
        type: 'dateTime',
        description: 'Horodatage de la synchronisation'
      }
    }
  }
};

/**
 * Configuration des Automations Airtable
 */
export const AIRTABLE_AUTOMATIONS = {
  // Automation 1: Invalidation cache sur update
  cacheInvalidation: {
    name: 'Cache Invalidation on Asset Update',
    trigger: {
      type: 'recordUpdated',
      table: 'Assets',
      conditions: ['cloudinary_url changed', 'status changed to active']
    },
    actions: [
      {
        type: 'webhook',
        url: '{{process.env.NUXT_PUBLIC_SITE_URL}}/api/assets/invalidate-cache',
        method: 'POST',
        payload: {
          public_id: '{{cloudinary_public_id}}',
          asset_id: '{{record_id}}'
        }
      },
      {
        type: 'updateRecord',
        fields: {
          last_cache_invalidation: '{{now}}',
          sync_status: 'pending'
        }
      }
    ]
  },

  // Automation 2: Sync vers Turso
  tursoSync: {
    name: 'Sync to Turso Database', 
    trigger: {
      type: 'recordUpdated',
      table: 'Assets',
      conditions: ['status changed to active', 'price_base changed']
    },
    actions: [
      {
        type: 'webhook',
        url: '{{process.env.NUXT_PUBLIC_SITE_URL}}/api/assets/sync-turso',
        method: 'POST',
        payload: {
          asset_data: '{{all_fields}}',
          operation: 'upsert'
        }
      }
    ]
  },

  // Automation 3: Notification upload
  uploadNotification: {
    name: 'New Asset Upload Notification',
    trigger: {
      type: 'recordCreated',
      table: 'Assets'
    },
    actions: [
      {
        type: 'slack',
        message: '🆕 Nouvel asset uploadé: {{name}} ({{category}}/{{subcategory}})'
      }
    ]
  },

  // =====================================
  // CAMPAIGN BUNDLES AUTOMATIONS
  // =====================================

  // Automation 4: Invalidation cache sur mise à jour bundle
  bundleCacheInvalidation: {
    name: 'Bundle Cache Invalidation on Update',
    trigger: {
      type: 'recordUpdated',
      table: 'CampaignBundles',
      conditions: ['is_active changed', 'estimated_total changed', 'popularity changed']
    },
    actions: [
      {
        type: 'webhook',
        url: '{{process.env.NUXT_PUBLIC_SITE_URL}}/api/campaign-bundles/invalidate-cache',
        method: 'POST',
        payload: {
          bundle_id: '{{bundle_id}}',
          record_id: '{{record_id}}',
          trigger: 'bundle_updated'
        }
      },
      {
        type: 'updateRecord',
        fields: {
          last_cache_invalidation: '{{now}}',
          sync_status: 'pending'
        }
      }
    ]
  },

  // Automation 5: Recalcul automatique des totaux bundle
  bundleTotalRecalculation: {
    name: 'Bundle Total Recalculation',
    trigger: {
      type: 'recordUpdated',
      table: 'BundleProducts',
      conditions: ['base_price changed', 'quantity changed']
    },
    actions: [
      {
        type: 'webhook',
        url: '{{process.env.NUXT_PUBLIC_SITE_URL}}/api/campaign-bundles/recalculate-totals',
        method: 'POST',
        payload: {
          bundle_product_id: '{{record_id}}',
          campaign_bundle_ids: '{{campaign_bundle}}',
          trigger: 'product_updated'
        }
      }
    ]
  },

  // Automation 6: Sync vers cache frontend
  bundleFrontendSync: {
    name: 'Bundle Frontend Cache Sync',
    trigger: {
      type: 'recordUpdated',
      table: 'CampaignBundles',
      conditions: ['sync_status changed to pending']
    },
    actions: [
      {
        type: 'webhook',
        url: '{{process.env.NUXT_PUBLIC_SITE_URL}}/api/campaign-bundles/sync-frontend',
        method: 'POST',
        payload: {
          bundle_data: '{{all_fields}}',
          operation: 'sync_cache',
          timestamp: '{{now}}'
        }
      }
    ]
  },

  // Automation 7: Notification nouveau pack créé
  newBundleNotification: {
    name: 'New Campaign Bundle Notification',
    trigger: {
      type: 'recordCreated',
      table: 'CampaignBundles'
    },
    actions: [
      {
        type: 'slack',
        message: '🎯 Nouveau pack de campagne créé: {{name}} ({{target_audience}}, {{estimated_total}} FCFA)'
      },
      {
        type: 'webhook',
        url: '{{process.env.NUXT_PUBLIC_SITE_URL}}/api/campaign-bundles/webhook/new-bundle',
        method: 'POST',
        payload: {
          bundle_id: '{{bundle_id}}',
          name: '{{name}}',
          target_audience: '{{target_audience}}',
          estimated_total: '{{estimated_total}}'
        }
      }
    ]
  }
};

/**
 * Scripts de création automatique des tables
 */
export const AIRTABLE_SETUP_SCRIPT = `
// Script à exécuter dans Airtable Scripting App
// Crée automatiquement les tables avec le bon schéma

const baseId = 'YOUR_BASE_ID';
const tables = ${JSON.stringify(AIRTABLE_SCHEMA, null, 2)};

async function createAllTables() {
  console.log('🚀 Création du schéma complet Airtable NS2PO...');

  try {
    // =====================================
    // CAMPAIGN BUNDLES TABLES
    // =====================================

    console.log('📦 Création des tables Campaign Bundles...');

    // 1. Création de la table CampaignBundles
    const campaignBundlesTable = await base.createTableAsync(
      tables.CampaignBundles.tableName,
      tables.CampaignBundles.fields
    );
    console.log('✅ Table CampaignBundles créée:', campaignBundlesTable.name);

    // 2. Création de la table BundleProducts
    const bundleProductsTable = await base.createTableAsync(
      tables.BundleProducts.tableName,
      tables.BundleProducts.fields
    );
    console.log('✅ Table BundleProducts créée:', bundleProductsTable.name);

    // =====================================
    // ASSET MANAGEMENT TABLES
    // =====================================

    console.log('🖼️ Création des tables Asset Management...');

    // 3. Création de la table Assets
    const assetsTable = await base.createTableAsync(
      tables.Assets.tableName,
      tables.Assets.fields
    );
    console.log('✅ Table Assets créée:', assetsTable.name);

    // 4. Création de la table SyncLog
    const syncLogTable = await base.createTableAsync(
      tables.SyncLog.tableName,
      tables.SyncLog.fields
    );
    console.log('✅ Table SyncLog créée:', syncLogTable.name);

    // =====================================
    // CONFIGURATION DES VUES
    // =====================================

    console.log('👁️ Configuration des vues optimisées...');

    // Vues pour CampaignBundles
    for (const [viewName, viewConfig] of Object.entries(tables.CampaignBundles.views)) {
      try {
        await campaignBundlesTable.createViewAsync(viewName, viewConfig.type, {
          visibleFields: viewConfig.fields?.map(f => campaignBundlesTable.getFieldByName(f)),
          sorts: viewConfig.sort?.map(s => ({
            field: campaignBundlesTable.getFieldByName(s.field),
            direction: s.direction
          }))
        });
        console.log('📋 Vue CampaignBundles créée:', viewName);
      } catch (err) {
        console.warn('⚠️ Échec création vue:', viewName, err.message);
      }
    }

    // Vues pour BundleProducts
    for (const [viewName, viewConfig] of Object.entries(tables.BundleProducts.views)) {
      try {
        await bundleProductsTable.createViewAsync(viewName, viewConfig.type, {
          visibleFields: viewConfig.fields?.map(f => bundleProductsTable.getFieldByName(f)),
          sorts: viewConfig.sort?.map(s => ({
            field: bundleProductsTable.getFieldByName(s.field),
            direction: s.direction
          }))
        });
        console.log('📋 Vue BundleProducts créée:', viewName);
      } catch (err) {
        console.warn('⚠️ Échec création vue:', viewName, err.message);
      }
    }

    console.log('🎉 Setup complet terminé avec succès !');
    console.log('📊 Tables créées:');
    console.log('   - CampaignBundles (' + Object.keys(tables.CampaignBundles.fields).length + ' champs)');
    console.log('   - BundleProducts (' + Object.keys(tables.BundleProducts.fields).length + ' champs)');
    console.log('   - Assets (' + Object.keys(tables.Assets.fields).length + ' champs)');
    console.log('   - SyncLog (' + Object.keys(tables.SyncLog.fields).length + ' champs)');

  } catch (error) {
    console.error('❌ Erreur lors du setup:', error);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le setup complet
createAllTables();
`;