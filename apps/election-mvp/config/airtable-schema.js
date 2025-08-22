/**
 * Schéma Airtable pour la Gestion d'Assets NS2PO
 * 
 * Tables optimisées pour workflow développeur et non-développeur
 * Configuration à appliquer dans la base Airtable
 */

export const AIRTABLE_SCHEMA = {
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

async function createAssetTables() {
  console.log('🚀 Création des tables Assets...');
  
  // Création de la table Assets
  const assetsTable = await base.createTableAsync(
    tables.Assets.tableName,
    tables.Assets.fields
  );
  
  console.log('✅ Table Assets créée:', assetsTable.name);
  
  // Création de la table SyncLog
  const syncLogTable = await base.createTableAsync(
    tables.SyncLog.tableName,
    tables.SyncLog.fields
  );
  
  console.log('✅ Table SyncLog créée:', syncLogTable.name);
  console.log('🎉 Setup terminé !');
}

// Exécuter le setup
createAssetTables();
`;