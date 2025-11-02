PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'CI',
    customer_type TEXT CHECK(customer_type IN ('individual', 'party', 'candidate', 'organization')) DEFAULT 'individual',
    tax_number TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    metadata TEXT, -- JSON pour informations supplémentaires
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, preferred_language TEXT DEFAULT 'fr', preferred_currency TEXT DEFAULT 'XOF', marketing_opt_in BOOLEAN DEFAULT FALSE, last_order_date DATETIME, total_orders_count INTEGER DEFAULT 0, total_spent_amount REAL DEFAULT 0, customer_segment TEXT);
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, -- ID Airtable
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    base_price REAL NOT NULL,
    min_quantity INTEGER DEFAULT 1,
    max_quantity INTEGER,
    unit TEXT DEFAULT 'pièce',
    production_time_days INTEGER DEFAULT 7,
    customizable BOOLEAN DEFAULT TRUE,
    materials TEXT, -- JSON array
    colors TEXT, -- JSON array
    sizes TEXT, -- JSON array
    image_url TEXT,
    gallery_urls TEXT, -- JSON array
    specifications TEXT, -- JSON
    is_active BOOLEAN DEFAULT TRUE,
    airtable_sync_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, reference TEXT, weight_grams INTEGER, length_cm REAL, width_cm REAL, height_cm REAL, volume_cm3 REAL, stock_quantity INTEGER DEFAULT 0, stock_threshold INTEGER DEFAULT 10, is_in_stock BOOLEAN DEFAULT TRUE, is_featured BOOLEAN DEFAULT FALSE, is_new BOOLEAN DEFAULT FALSE, popularity_score INTEGER DEFAULT 0, view_count INTEGER DEFAULT 0, order_count INTEGER DEFAULT 0, seo_title TEXT, seo_description TEXT, seo_keywords TEXT);
INSERT INTO products VALUES('textile-tshirt-001','T-shirt Classique','T-shirt 100% coton, disponible en plusieurs couleurs','TEXTILE','VETEMENT',1700,10,1000,'piece',7,1,'["100% Coton"]','["Blanc","Noir","Bleu","Rouge","Vert"]','["S","M","L","XL","XXL"]','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-tshirt-001.jpg','["https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-tshirt-001.jpg"]','{"poids":"180g/m²","col":"Ras du cou","manches":"Courtes","coupe":"Droite"}',1,'2025-08-23T00:23:43.747Z','2025-08-23T00:23:43.748Z','2025-09-24 12:04:20','AUTO-1758715460-rt-001',NULL,NULL,NULL,NULL,NULL,0,10,1,0,0,0,0,0,NULL,NULL,NULL);
INSERT INTO products VALUES('textile-polo-001','Polo Élégant','Polo professionnel en coton piqué','TEXTILE','VETEMENT',5850,5,500,'piece',10,1,'["Coton piqué 200g/m²"]','["Blanc","Marine","Gris","Noir"]','["S","M","L","XL","XXL"]','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-polo-001.jpg','["https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-polo-001.jpg"]','{"poids":"200g/m²","col":"Polo avec boutonnage","manches":"Courtes","coupe":"Ajustée"}',1,'2025-08-23T00:23:44.387Z','2025-08-23T00:23:44.387Z','2025-09-24 12:04:20','AUTO-1758715460-lo-001',NULL,NULL,NULL,NULL,NULL,0,10,1,0,0,0,0,0,NULL,NULL,NULL);
INSERT INTO products VALUES('textile-casquette-001','Casquette Publicitaire','Casquette ajustable avec visière incurvée - Testée par QA Production','ACCESSOIRE','COUVRE_CHEF',2500,20,2000,'piece',5,1,'["Coton/Polyester"]','["Blanc","Noir","Navy","Rouge","Beige"]','["Unique ajustable"]','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-casquette-001.jpg','["https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-casquette-001.jpg"]','{"fermeture":"Scratch ajustable","visiere":"Incurvée pré-formée","broderie":"Possible sur devant et côtés"}',1,'2025-08-23T00:23:44.786Z','2025-08-23T00:23:44.786Z','2025-09-24 12:04:20','AUTO-1758715460-te-001',NULL,NULL,NULL,NULL,NULL,0,10,1,0,0,0,0,0,NULL,NULL,NULL);
INSERT INTO products VALUES('prod_1758760484329_z9fqi3dp2','Drapeau en papier','Drapeaux papier sur tige en bois pour des décorations d''événements majeurs. ','cat_1758155269599_f9d615g9y',NULL,250,100,1000,'pièce',7,0,NULL,'[]','[]','https://res.cloudinary.com/dsrvzogof/image/upload/ns2po/products/file_kpbqwt','[]',NULL,1,NULL,'2025-09-25 00:34:44','2025-09-25 00:34:44','DRAPEAU-001',NULL,NULL,NULL,NULL,NULL,0,10,1,0,0,0,0,0,NULL,NULL,NULL);
INSERT INTO products VALUES('prod_1758763847187_9r8m61axy','Pin''s personnalisé','Le pin''s ou épinglette est un petit insigne, le plus souvent métallique, qui se fixe sur un vêtement. Le pin''s sert de signe distinctif, symbolisant alors une appartenance, un logo ou la commémoration d''un événement.','cat_1758155269599_f9d615g9y',NULL,300,100,1000,'pièce',7,0,NULL,'[]','[]','https://res.cloudinary.com/dsrvzogof/image/upload/products/yrk5zk0lozijndlnybxg','[]',NULL,1,NULL,'2025-09-25 01:30:47','2025-09-25 01:30:47','PINS-001',NULL,NULL,NULL,NULL,NULL,0,10,1,0,0,0,0,0,NULL,NULL,NULL);
INSERT INTO products VALUES('prod_1758773049222_aguwp0z5b','Foulard personnalisé','Foulard imprimé personnalisé.','textile',NULL,350,100,1000,'pièce',7,0,NULL,'[]','[]','https://res.cloudinary.com/dsrvzogof/image/upload/products/wrjeoiezixlnlap17nfp','[]',NULL,1,NULL,'2025-09-25 04:04:09','2025-09-25 04:04:09','FOURLARD-001',NULL,NULL,NULL,NULL,NULL,0,10,1,0,0,0,0,0,NULL,NULL,NULL);
CREATE TABLE IF NOT EXISTS pricing_rules (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    rule_type TEXT CHECK(rule_type IN ('volume_discount', 'customer_type_discount', 'seasonal_discount')) NOT NULL,
    condition_min_quantity INTEGER,
    condition_customer_type TEXT,
    condition_date_start DATETIME,
    condition_date_end DATETIME,
    discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed_amount')) NOT NULL,
    discount_value REAL NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id)
);
CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    customer_data TEXT NOT NULL, -- JSON snapshot du client
    items TEXT NOT NULL, -- JSON array des articles
    subtotal REAL NOT NULL,
    tax_rate REAL DEFAULT 0.18, -- 18% TVA Côte d'Ivoire
    tax_amount REAL NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT CHECK(status IN ('draft', 'sent', 'accepted', 'expired', 'converted')) DEFAULT 'draft',
    valid_until DATETIME,
    notes TEXT,
    metadata TEXT, -- JSON pour options additionnelles
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
);
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    quote_id TEXT, -- Référence au devis d'origine
    customer_id TEXT NOT NULL,
    customer_data TEXT NOT NULL, -- JSON snapshot du client
    items TEXT NOT NULL, -- JSON array des articles avec personnalisations
    subtotal REAL NOT NULL,
    tax_rate REAL DEFAULT 0.18,
    tax_amount REAL NOT NULL,
    shipping_cost REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    status TEXT CHECK(status IN ('pending_payment', 'paid', 'processing', 'production', 'shipping', 'delivered', 'cancelled')) DEFAULT 'pending_payment',
    payment_status TEXT CHECK(payment_status IN ('pending', 'partial', 'paid', 'refunded')) DEFAULT 'pending',
    payment_method TEXT,
    payment_reference TEXT,
    production_notes TEXT,
    shipping_address TEXT, -- JSON
    estimated_delivery_date DATETIME,
    actual_delivery_date DATETIME,
    notes TEXT,
    metadata TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, commercial_contact_provided BOOLEAN DEFAULT FALSE, commercial_instructions TEXT, follow_up_date DATETIME,
    FOREIGN KEY (quote_id) REFERENCES quotes (id),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
);
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('quote', 'preorder', 'custom', 'support', 'meeting')) NOT NULL,
    customer_data TEXT NOT NULL, -- JSON snapshot des infos client
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK(status IN ('new', 'assigned', 'in_progress', 'resolved', 'closed')) DEFAULT 'new',
    assigned_to TEXT, -- ID utilisateur admin
    related_quote_id TEXT,
    related_order_id TEXT,
    attachments TEXT, -- JSON array des URLs
    response_data TEXT, -- JSON des réponses
    resolved_at DATETIME,
    metadata TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (related_quote_id) REFERENCES quotes (id),
    FOREIGN KEY (related_order_id) REFERENCES orders (id)
);
INSERT INTO contacts VALUES('CONTACT_rccJ36tayZKL','quote','{"firstName":"Test","lastName":"User","email":"test@example.com","phone":"0777123456","organization":"Parti Démocratique Test"}','Demande de devis électoral - Test','Test de soumission email via API','high','new',NULL,NULL,NULL,'[]',NULL,NULL,'{"preferredContactMethod":"email","urgency":"normal","source":"website_form"}','2025-09-28T17:39:11.730Z','2025-09-28 17:39:12');
INSERT INTO contacts VALUES('CONTACT_yOZlee-dpjSr','quote','{"firstName":"LOGAN","lastName":"SERY","email":"studioabidjanpro1@gmail.com","phone":"+2250777104936","organization":"ISC"}','Demande de devis électoral - ISC',replace('Bonjour,\n\nJe souhaite recevoir un devis détaillé pour ma campagne électorale.\n\nOrganisation/Parti: ISC\nType de projet: Pack Campagne NS2PO\nBudget total estimé: 1 992 500 F CFA\n\nDétails de ma sélection:\n- T-shirt Classique (Qté: 1000, Prix: 1 700 000 F CFA)\n- Polo Élégant (Qté: 50, Prix: 292 500 F CFA)\n\nMerci de me recontacter rapidement pour finaliser cette demande.\n\nCordialement,\nLOGAN SERY','\n',char(10)),'high','new',NULL,NULL,NULL,'[]',NULL,NULL,'{"preferredContactMethod":"email","urgency":"normal","source":"website_form"}','2025-09-28T17:52:05.969Z','2025-09-28 17:52:06');
INSERT INTO contacts VALUES('CONTACT_1IXPCt-REdmF','quote','{"firstName":"LOGAN","lastName":"SERY","email":"studioabidjanpro1@gmail.com","phone":"+2250777104936","organization":"ISC"}','Demande de devis électoral - ISC',replace('Bonjour,\n\nJe souhaite recevoir un devis détaillé pour ma campagne électorale.\n\nOrganisation/Parti: ISC\nType de projet: Pack Campagne NS2PO\nBudget total estimé: 1 992 500 F CFA\n\nDétails de ma sélection:\n- T-shirt Classique (Qté: 1000, Prix: 1 700 000 F CFA)\n- Polo Élégant (Qté: 50, Prix: 292 500 F CFA)\n\nMerci de me recontacter rapidement pour finaliser cette demande.\n\nCordialement,\nLOGAN SERY','\n',char(10)),'high','new',NULL,NULL,NULL,'[]',NULL,NULL,'{"preferredContactMethod":"email","urgency":"normal","source":"website_form"}','2025-09-28T17:52:14.886Z','2025-09-28 17:52:15');
INSERT INTO contacts VALUES('CONTACT_n0bfkfhvYjvy','quote','{"firstName":"Test","lastName":"Railway","email":"test@railway.com","phone":"0777123456","organization":"Test Railway URL"}','Test URL Railway','Test de vérification URL Railway','high','new',NULL,NULL,NULL,'[]',NULL,NULL,'{"preferredContactMethod":"email","urgency":"normal","source":"website_form"}','2025-09-28T18:05:45.219Z','2025-09-28 18:05:45');
INSERT INTO contacts VALUES('CONTACT_ALNc6ytxtehN','quote','{"firstName":"Test","lastName":"Railway","email":"test@railway.com","phone":"0777123456","organization":"Test Railway URL"}','Test URL Railway','Test de vérification URL Railway','high','new',NULL,NULL,NULL,'[]',NULL,NULL,'{"preferredContactMethod":"email","urgency":"normal","source":"website_form"}','2025-09-28T18:07:54.391Z','2025-09-28 18:07:54');
INSERT INTO contacts VALUES('CONTACT_R_xqzrM7JHLV','quote','{"firstName":"Test","lastName":"Logo","email":"test-logo@ns2po.ci","phone":"0777123456","organization":"Test Logo NS2PO"}','Test Logo Email','Test pour vérifier que le logo NS2PO apparaît correctement dans le header des emails','high','new',NULL,NULL,NULL,'[]',NULL,NULL,'{"preferredContactMethod":"email","urgency":"normal","source":"website_form"}','2025-09-28T18:17:14.693Z','2025-09-28 18:17:14');
INSERT INTO contacts VALUES('CONTACT_Rrx9GdXnEnLr','quote','{"firstName":"LOGAN","lastName":"SERY","email":"studioabidjanpro1@gmail.com","phone":"+2250777104936","organization":"ISC"}','Demande de devis électoral - ISC',replace('Bonjour,\n\nJe souhaite recevoir un devis détaillé pour ma campagne électorale.\n\nOrganisation/Parti: ISC\nType de projet: Pack Campagne NS2PO\nBudget total estimé: 2 200 000 XOF\n\nDétails de ma sélection:\n- T-shirt Classique (Qté: 1000, Prix: 1 700 000 XOF)\n- Casquette Publicitaire (Qté: 100, Prix: 250 000 XOF)\n- Drapeau en papier (Qté: 1000, Prix: 250 000 XOF)\n\nMerci de me recontacter rapidement pour finaliser cette demande.\n\nCordialement,\nLOGAN SERY','\n',char(10)),'high','new',NULL,NULL,NULL,'[]',NULL,NULL,'{"preferredContactMethod":"email","urgency":"normal","source":"website_form"}','2025-09-28T19:08:36.262Z','2025-09-28 19:08:36');
CREATE TABLE IF NOT EXISTS product_customizations (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    customization_data TEXT NOT NULL, -- JSON avec logos, textes, couleurs, etc.
    preview_url TEXT, -- URL de l'image de prévisualisation
    production_files TEXT, -- JSON array des fichiers de production
    status TEXT CHECK(status IN ('pending', 'approved', 'in_production', 'completed')) DEFAULT 'pending',
    approved_at DATETIME,
    approved_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
);
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'manager', 'operator')) DEFAULT 'operator',
    permissions TEXT, -- JSON array des permissions
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS commercial_contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'sales', 'manager', 'support'
    mobile_phone TEXT NOT NULL,
    fixed_phone TEXT,
    email TEXT,
    specialties TEXT, -- JSON array des spécialités
    availability_hours TEXT, -- JSON avec horaires
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO commercial_contacts VALUES('COMM_001','Service Commercial NS2PO','sales','+2250575129737','+2252721248803','ns2pomail@ns2po.ci','["devis", "commandes", "paiements", "suivi"]','{"lundi_vendredi": "8h-17h", "samedi": "8h-12h", "dimanche": "fermé", "urgences": "24h/7j"}',1,'2025-08-21 01:44:11','2025-08-21 01:49:42');
INSERT INTO commercial_contacts VALUES('COMM_002','Manager Commercial','manager','+2250575129737','+2252721248803','mkonan@ns2po.ci','["grandes_commandes", "projets_speciaux", "partenariats"]','{"lundi_vendredi": "9h-16h", "weekend": "sur_rendez_vous"}',1,'2025-08-21 01:44:11','2025-08-21 01:49:43');
CREATE TABLE IF NOT EXISTS payment_instructions (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    instruction_type TEXT CHECK(instruction_type IN ('mobile_money', 'bank_transfer', 'cash', 'commercial_contact')) NOT NULL,
    contact_person TEXT, -- Référence au commercial assigné
    instructions TEXT NOT NULL, -- Instructions détaillées en JSON
    due_date DATETIME,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'XOF',
    reference TEXT UNIQUE NOT NULL,
    status TEXT CHECK(status IN ('sent', 'confirmed', 'completed', 'expired')) DEFAULT 'sent',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id)
);
CREATE TABLE IF NOT EXISTS campaign_bundles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT CHECK(target_audience IN ('local', 'regional', 'national', 'universal')) NOT NULL,
  base_price REAL NOT NULL DEFAULT 0,
  discount_percentage REAL DEFAULT 0 CHECK(discount_percentage >= 0 AND discount_percentage <= 100),
  final_price REAL GENERATED ALWAYS AS (base_price * (1 - discount_percentage / 100)) STORED,
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,
  features TEXT, -- JSON array of features
  metadata TEXT, -- JSON object for additional data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, version INTEGER DEFAULT 1 NOT NULL);
INSERT INTO campaign_bundles VALUES(1,'Pack Starter Local','Pack essentiel pour les campagnes locales avec les produits de base','local',1992500,0,1,1,'heroicons:flag','#C99A3B','["Idéal pour les campagnes municipales","Produits essentiels inclus","Personnalisation simple"]',NULL,'2025-09-17 15:12:54','2025-09-23 22:15:58',2);
INSERT INTO campaign_bundles VALUES(2,'Pack Pro Régional','Pack complet pour rayonner sur votre région avec variété de supports','regional',2200000,0,1,2,'heroicons:globe-alt','#6A2B3A','["Couverture régionale optimale","Large gamme de produits","Impact maximal"]',NULL,'2025-09-17 15:12:54','2025-09-25 18:48:33',23);
INSERT INTO campaign_bundles VALUES(3,'Pack Premium National','Solution complète pour les campagnes d''envergure nationale','national',4860000,0,1,3,'heroicons:star','#D4AF37','["Visibilité nationale","Tous les supports premium","Service prioritaire"]',NULL,'2025-09-17 15:12:54','2025-09-25 18:57:27',5);
CREATE TABLE IF NOT EXISTS bundle_pricing_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bundle_id INTEGER NOT NULL,
  min_quantity INTEGER NOT NULL CHECK(min_quantity > 0),
  max_quantity INTEGER, -- NULL pour illimité
  discount_percentage REAL NOT NULL CHECK(discount_percentage >= 0 AND discount_percentage <= 100),
  fixed_discount REAL, -- Alternative au pourcentage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bundle_id) REFERENCES campaign_bundles(id) ON DELETE CASCADE,
  UNIQUE(bundle_id, min_quantity)
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Contraintes
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
INSERT INTO categories VALUES('textile','TEXTILE','textile','Vêtements et textiles personnalisables',NULL,'shirt','#3B82F6',1,1,'2025-09-17 17:16:28','2025-09-25 21:40:41');
INSERT INTO categories VALUES('accessoire','ACCESSOIRE','accessoire','Accessoires et objets promotionnels',NULL,'cap','#10B981',2,1,'2025-09-17 17:16:28','2025-09-17 17:16:28');
INSERT INTO categories VALUES('bureau','BUREAU','bureau','Fournitures de bureau personnalisées',NULL,'pen','#F59E0B',3,1,'2025-09-17 17:16:28','2025-09-17 17:16:28');
INSERT INTO categories VALUES('vetement','VETEMENT','vetement','Vêtements personnalisables','textile','tshirt','#60A5FA',1,1,'2025-09-17 17:16:28','2025-09-17 17:16:28');
INSERT INTO categories VALUES('couvre-chef','COUVRE_CHEF','couvre-chef','Casquettes et chapeaux','accessoire','cap','#34D399',1,1,'2025-09-17 17:16:28','2025-09-17 17:16:28');
INSERT INTO categories VALUES('publicitaire','PUBLICITAIRE','publicitaire','Objets publicitaires','bureau','pen','#FBBF24',1,1,'2025-09-17 17:16:28','2025-09-17 17:16:28');
INSERT INTO categories VALUES('cat_1758155269599_f9d615g9y','ÉVÉNEMENTIEL','evenementiel','Produits pour événements et manifestations',NULL,'heroicons:star','#8B5CF6',4,1,'2025-09-18 00:27:49','2025-09-18 00:27:49');
CREATE TABLE IF NOT EXISTS quote_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  subcategory TEXT,
  base_price INTEGER NOT NULL DEFAULT 0, -- Prix en centimes XOF
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER NOT NULL DEFAULT 1000,
  unit TEXT NOT NULL DEFAULT 'pièce',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Draft')),
  tags TEXT DEFAULT '[]', -- JSON array
  image_url TEXT,
  gallery_urls TEXT DEFAULT '[]', -- JSON array
  specifications TEXT, -- JSON object
  production_time_days INTEGER DEFAULT 7,
  customizable BOOLEAN DEFAULT 1,
  materials TEXT,
  colors TEXT DEFAULT '[]', -- JSON array
  sizes TEXT DEFAULT '[]', -- JSON array
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'turso',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO quote_items VALUES('textile-tshirt-1','T-Shirt Personnalisé Premium','T-shirt 100% coton peigné, idéal campagne électorale avec impression logo/slogan','Textile','Vêtement',4500,50,2000,'pièce','Active','["textile","personnalisable","campagne","election"]','https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/tshirt-campagne','[]',NULL,5,1,'Coton 100% peigné, 160g/m²','["Blanc","Rouge","Bleu","Jaune","Vert","Orange"]','["XS","S","M","L","XL","XXL"]',1,1,1,'turso','2025-09-17 18:57:52','2025-09-17 18:57:52');
INSERT INTO quote_items VALUES('textile-casquette-1','Casquette Brodée Campagne','Casquette ajustable avec broderie personnalisée pour visibilité politique','Textile','Couvre-Chef',3200,25,1000,'pièce','Active','["textile","broderie","casquette","campagne","election"]','https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/casquette-campagne','[]',NULL,7,1,'Polyester/Coton, visière rigide','["Rouge","Bleu","Blanc","Jaune","Vert"]','["Unique ajustable"]',2,1,1,'turso','2025-09-17 18:57:52','2025-09-17 18:57:52');
INSERT INTO quote_items VALUES('accessoire-stylo-1','Stylo Publicitaire Premium','Stylo à bille avec gravure laser du nom/logo candidat','Accessoire','Bureau',350,100,10000,'pièce','Active','["accessoire","stylo","gravure","promotion","bureau"]','https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/stylo-grave','[]',NULL,3,1,'Plastique ABS, encre bleue','["Blanc","Bleu","Rouge","Noir"]','["Standard"]',3,0,1,'turso','2025-09-17 18:57:52','2025-09-17 18:57:52');
INSERT INTO quote_items VALUES('accessoire-porte-cles-1','Porte-clés Métal Personnalisé','Porte-clés métal avec logo en relief, idéal goodies campagne','Accessoire','Goodies',1200,50,5000,'pièce','Active','["accessoire","porte-cles","metal","goodies","campagne"]','https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/porte-cles-metal','[]',NULL,10,1,'Alliage zinc, finition nickel','["Argent","Or","Bronze"]','["5cm x 3cm"]',4,0,1,'turso','2025-09-17 18:57:52','2025-09-17 18:57:52');
INSERT INTO quote_items VALUES('visuel-affiche-1','Affiche Campagne A3','Affiche publicitaire format A3, papier couché brillant 350g','Visuel','Affichage',800,100,10000,'pièce','Active','["visuel","affiche","campagne","impression","A3"]','https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/affiche-a3','[]',NULL,2,1,'Papier couché brillant 350g/m²','["Standard CMJN"]','["A3 (29.7 x 42 cm)"]',5,1,1,'turso','2025-09-17 18:57:52','2025-09-17 18:57:52');
INSERT INTO quote_items VALUES('visuel-banderole-1','Banderole PVC Campagne','Banderole PVC résistante intérieur/extérieur avec œillets','Visuel','Signalétique',4500,5,100,'pièce','Active','["visuel","banderole","pvc","exterieur","signaletique"]','https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/banderole-pvc','[]',NULL,5,1,'PVC 440g/m², œillets métalliques','["Impression couleur"]','["2m x 0.8m","3m x 1m","4m x 1.2m"]',6,1,1,'turso','2025-09-17 18:57:52','2025-09-17 18:57:52');
CREATE TABLE IF NOT EXISTS realisations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT,
  cloudinary_public_ids TEXT DEFAULT '[]', -- JSON array de string
  product_ids TEXT DEFAULT '[]', -- JSON array de string (relations logiques vers products.id)
  category_ids TEXT DEFAULT '[]', -- JSON array de string (relations logiques vers categories.id)
  customization_option_ids TEXT DEFAULT '[]', -- JSON array de string
  tags TEXT DEFAULT '[]', -- JSON array de string
  is_featured BOOLEAN DEFAULT 0,
  order_position INTEGER DEFAULT 0, -- 'order' est réservé SQL
  is_active BOOLEAN DEFAULT 1,

  -- Champs HybridRealisation pour compatibilité API existante
  source TEXT CHECK(source IN ('airtable', 'cloudinary-auto-discovery', 'turso')) DEFAULT 'turso',
  cloudinary_urls TEXT, -- JSON array optionnel pour URLs générées
  cloudinary_metadata TEXT, -- JSON object optionnel avec metadata Cloudinary

  -- Audit trail
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Contraintes validation
  CONSTRAINT valid_json_arrays CHECK (
    json_valid(cloudinary_public_ids) AND
    json_valid(product_ids) AND
    json_valid(category_ids) AND
    json_valid(customization_option_ids) AND
    json_valid(tags)
  ),
  CONSTRAINT valid_cloudinary_metadata CHECK (
    cloudinary_metadata IS NULL OR json_valid(cloudinary_metadata)
  ),
  CONSTRAINT valid_cloudinary_urls CHECK (
    cloudinary_urls IS NULL OR json_valid(cloudinary_urls)
  )
);
CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        context TEXT,
        source TEXT,
        stack_trace TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        public_id TEXT NOT NULL UNIQUE,
        secure_url TEXT NOT NULL,
        url TEXT,
        format TEXT NOT NULL,
        resource_type TEXT NOT NULL DEFAULT 'image',
        bytes INTEGER NOT NULL DEFAULT 0,
        width INTEGER,
        height INTEGER,
        alt_text TEXT,
        caption TEXT,
        tags TEXT, -- JSON string pour les tags
        folder TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        is_deleted INTEGER NOT NULL DEFAULT 0
      );
INSERT INTO assets VALUES('asset_1758750946619_l2op9so2q','ns2po/gallery/creative/affiche-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755994791/ns2po/gallery/creative/affiche-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755994791/ns2po/gallery/creative/affiche-001.jpg','jpg','image',77092,520,520,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:46.619Z','2025-09-24T21:55:46.619Z',0);
INSERT INTO assets VALUES('asset_1758750947175_1vrg8nxop','ns2po/gallery/creative/affichebois-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755972506/ns2po/gallery/creative/affichebois-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755972506/ns2po/gallery/creative/affichebois-001.jpg','jpg','image',69140,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:47.175Z','2025-09-24T21:55:47.175Z',0);
INSERT INTO assets VALUES('asset_1758750947697_61jixdlg0','ns2po/gallery/creative/alumettes-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973368/ns2po/gallery/creative/alumettes-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973368/ns2po/gallery/creative/alumettes-001.jpg','jpg','image',47116,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:47.697Z','2025-09-24T21:55:47.697Z',0);
INSERT INTO assets VALUES('asset_1758750948241_ynugry44h','ns2po/gallery/creative/autocollant-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755972521/ns2po/gallery/creative/autocollant-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755972521/ns2po/gallery/creative/autocollant-001.jpg','jpg','image',69496,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:48.241Z','2025-09-24T21:55:48.241Z',0);
INSERT INTO assets VALUES('asset_1758750948761_lt429zvr2','ns2po/gallery/creative/banderole-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755994794/ns2po/gallery/creative/banderole-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755994794/ns2po/gallery/creative/banderole-001.jpg','jpg','image',40273,520,520,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:48.761Z','2025-09-24T21:55:48.761Z',0);
INSERT INTO assets VALUES('asset_1758750949308_507h2qujm','ns2po/gallery/creative/bodie-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973366/ns2po/gallery/creative/bodie-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973366/ns2po/gallery/creative/bodie-001.jpg','jpg','image',64279,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:49.308Z','2025-09-24T21:55:49.308Z',0);
INSERT INTO assets VALUES('asset_1758750949820_1448zolt6','ns2po/gallery/creative/bracelet-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755994792/ns2po/gallery/creative/bracelet-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755994792/ns2po/gallery/creative/bracelet-001.jpg','jpg','image',32534,520,520,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:49.820Z','2025-09-24T21:55:49.819Z',0);
INSERT INTO assets VALUES('asset_1758750950330_544v5lsum','ns2po/gallery/creative/calendrier-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973364/ns2po/gallery/creative/calendrier-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973364/ns2po/gallery/creative/calendrier-001.jpg','jpg','image',57289,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:50.330Z','2025-09-24T21:55:50.330Z',0);
INSERT INTO assets VALUES('asset_1758750950852_izwmew69d','ns2po/gallery/creative/casquette-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755994787/ns2po/gallery/creative/casquette-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755994787/ns2po/gallery/creative/casquette-001.jpg','jpg','image',39726,520,520,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:50.852Z','2025-09-24T21:55:50.852Z',0);
INSERT INTO assets VALUES('asset_1758750951372_hrllozv5a','ns2po/gallery/creative/dosbleu-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973043/ns2po/gallery/creative/dosbleu-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973043/ns2po/gallery/creative/dosbleu-001.jpg','jpg','image',121185,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:51.372Z','2025-09-24T21:55:51.372Z',0);
INSERT INTO assets VALUES('asset_1758750951894_qwzb8p8pe','ns2po/gallery/creative/drapeau-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973389/ns2po/gallery/creative/drapeau-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973389/ns2po/gallery/creative/drapeau-001.jpg','jpg','image',70080,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:51.894Z','2025-09-24T21:55:51.894Z',0);
INSERT INTO assets VALUES('asset_1758750952401_nlu33xtvb','ns2po/gallery/creative/flyer-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973391/ns2po/gallery/creative/flyer-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973391/ns2po/gallery/creative/flyer-001.jpg','jpg','image',41469,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:52.401Z','2025-09-24T21:55:52.401Z',0);
INSERT INTO assets VALUES('asset_1758750952929_ucfj77fka','ns2po/gallery/creative/foulard-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973408/ns2po/gallery/creative/foulard-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973408/ns2po/gallery/creative/foulard-001.jpg','jpg','image',39018,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:52.929Z','2025-09-24T21:55:52.929Z',0);
INSERT INTO assets VALUES('asset_1758750953445_fq2mvbnah','ns2po/gallery/creative/gobelet-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755994786/ns2po/gallery/creative/gobelet-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755994786/ns2po/gallery/creative/gobelet-001.jpg','jpg','image',28638,520,520,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:53.445Z','2025-09-24T21:55:53.445Z',0);
INSERT INTO assets VALUES('asset_1758750953965_wiwsmm9pr','ns2po/gallery/creative/kakemono-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973179/ns2po/gallery/creative/kakemono-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973179/ns2po/gallery/creative/kakemono-001.jpg','jpg','image',63109,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:53.965Z','2025-09-24T21:55:53.965Z',0);
INSERT INTO assets VALUES('asset_1758750954497_c1z5j0yi6','ns2po/gallery/creative/parapluie-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755994796/ns2po/gallery/creative/parapluie-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755994796/ns2po/gallery/creative/parapluie-001.jpg','jpg','image',33612,520,520,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:54.497Z','2025-09-24T21:55:54.497Z',0);
INSERT INTO assets VALUES('asset_1758750955081_u7ee5ta73','ns2po/gallery/creative/pins-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973226/ns2po/gallery/creative/pins-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973226/ns2po/gallery/creative/pins-001.jpg','jpg','image',64250,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:55.081Z','2025-09-24T21:55:55.081Z',0);
INSERT INTO assets VALUES('asset_1758750955591_qz5jes3i8','ns2po/gallery/creative/polo-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755994784/ns2po/gallery/creative/polo-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755994784/ns2po/gallery/creative/polo-001.jpg','jpg','image',34856,520,520,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:55.591Z','2025-09-24T21:55:55.591Z',0);
INSERT INTO assets VALUES('asset_1758750956114_55499457p','ns2po/gallery/creative/sac-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755994789/ns2po/gallery/creative/sac-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755994789/ns2po/gallery/creative/sac-001.jpg','jpg','image',25889,520,520,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:56.114Z','2025-09-24T21:55:56.114Z',0);
INSERT INTO assets VALUES('asset_1758750956687_q24h3xyqr','ns2po/gallery/creative/sacbandouliere-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973268/ns2po/gallery/creative/sacbandouliere-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973268/ns2po/gallery/creative/sacbandouliere-001.jpg','jpg','image',34384,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:56.687Z','2025-09-24T21:55:56.687Z',0);
INSERT INTO assets VALUES('asset_1758750957299_5c0fevfeq','ns2po/gallery/creative/saccaba-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973282/ns2po/gallery/creative/saccaba-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973282/ns2po/gallery/creative/saccaba-001.jpg','jpg','image',42132,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:57.299Z','2025-09-24T21:55:57.299Z',0);
INSERT INTO assets VALUES('asset_1758750957833_qfvkt7kav','ns2po/gallery/creative/tee-shirt-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755994782/ns2po/gallery/creative/tee-shirt-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755994782/ns2po/gallery/creative/tee-shirt-001.jpg','jpg','image',31829,520,520,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:57.833Z','2025-09-24T21:55:57.833Z',0);
INSERT INTO assets VALUES('asset_1758750958426_tvbmhnsup','ns2po/gallery/creative/tourvisibilite-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973410/ns2po/gallery/creative/tourvisibilite-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973410/ns2po/gallery/creative/tourvisibilite-001.jpg','jpg','image',79609,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:58.426Z','2025-09-24T21:55:58.426Z',0);
INSERT INTO assets VALUES('asset_1758750958932_057gaki45','ns2po/gallery/creative/tshirt-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973295/ns2po/gallery/creative/tshirt-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973295/ns2po/gallery/creative/tshirt-001.jpg','jpg','image',30860,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:58.932Z','2025-09-24T21:55:58.932Z',0);
INSERT INTO assets VALUES('asset_1758750959466_7tbhe0hri','ns2po/gallery/creative/visiere-001','https://res.cloudinary.com/dsrvzogof/image/upload/v1755973413/ns2po/gallery/creative/visiere-001.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1755973413/ns2po/gallery/creative/visiere-001.jpg','jpg','image',31280,1200,800,NULL,NULL,'[]','ns2po/gallery/creative','2025-09-24T21:55:59.466Z','2025-09-24T21:55:59.465Z',0);
INSERT INTO assets VALUES('asset_1758750960017_xg073lzb5','ns2po/products/file_kpbqwt','https://res.cloudinary.com/dsrvzogof/image/upload/v1758742782/ns2po/products/file_kpbqwt.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1758742782/ns2po/products/file_kpbqwt.jpg','jpg','image',226370,4500,3000,NULL,NULL,'[]','ns2po/products','2025-09-24T21:56:00.017Z','2025-09-24T21:56:00.017Z',0);
INSERT INTO assets VALUES('asset_1758750960531_e9k3eqg3l','ns2po/products/file_zzzzbv','https://res.cloudinary.com/dsrvzogof/image/upload/v1758734256/ns2po/products/file_zzzzbv.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1758734256/ns2po/products/file_zzzzbv.jpg','jpg','image',226370,4500,3000,NULL,NULL,'[]','ns2po/products','2025-09-24T21:56:00.531Z','2025-09-24T23:18:05.122Z',1);
INSERT INTO assets VALUES('asset_1758750961071_o29zohg47','ns2po/team/isaac-allegbe','https://res.cloudinary.com/dsrvzogof/image/upload/v1756182770/ns2po/team/isaac-allegbe.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1756182770/ns2po/team/isaac-allegbe.jpg','jpg','image',3756,200,200,NULL,NULL,'["hero-section","portrait","team"]','ns2po/team','2025-09-24T21:56:01.071Z','2025-09-24T21:56:01.071Z',0);
INSERT INTO assets VALUES('asset_1758750961616_tuyx4ujor','ns2po/team/konan','https://res.cloudinary.com/dsrvzogof/image/upload/v1756182771/ns2po/team/konan.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1756182771/ns2po/team/konan.jpg','jpg','image',5443,200,200,NULL,NULL,'["hero-section","portrait","team"]','ns2po/team','2025-09-24T21:56:01.616Z','2025-09-24T21:56:01.616Z',0);
INSERT INTO assets VALUES('asset_1758750962129_gbq0p73tj','ns2po/team/roxane','https://res.cloudinary.com/dsrvzogof/image/upload/v1756182773/ns2po/team/roxane.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1756182773/ns2po/team/roxane.jpg','jpg','image',5499,200,200,NULL,NULL,'["hero-section","portrait","team"]','ns2po/team','2025-09-24T21:56:02.129Z','2025-09-24T21:56:02.129Z',0);
INSERT INTO assets VALUES('asset_1758762648345_or8mt18v9','products/yrk5zk0lozijndlnybxg','https://res.cloudinary.com/dsrvzogof/image/upload/v1758762648/products/yrk5zk0lozijndlnybxg.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1758762648/products/yrk5zk0lozijndlnybxg.jpg','jpg','image',704396,3226,2805,NULL,NULL,'[]','ns2po/products','2025-09-25T01:10:48.345Z','2025-09-25T01:10:48.345Z',0);
INSERT INTO assets VALUES('asset_1758770660061_4ximziey9','products/fruvs89z6kczaws4ggty','https://res.cloudinary.com/dsrvzogof/image/upload/v1758770659/products/fruvs89z6kczaws4ggty.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1758770659/products/fruvs89z6kczaws4ggty.jpg','jpg','image',59608,1500,1500,NULL,NULL,'[]','ns2po/products','2025-09-25T03:24:20.062Z','2025-09-25T03:24:20.062Z',0);
INSERT INTO assets VALUES('asset_1758771501790_ttifxxs59','products/lt2vzj4vfucwhu5dtcja','https://res.cloudinary.com/dsrvzogof/image/upload/v1758771501/products/lt2vzj4vfucwhu5dtcja.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1758771501/products/lt2vzj4vfucwhu5dtcja.jpg','jpg','image',59608,1500,1500,NULL,NULL,'[]','ns2po/products','2025-09-25T03:38:21.790Z','2025-09-25T04:10:22.475Z',1);
INSERT INTO assets VALUES('asset_1758773029392_pyu2jcoh1','products/wrjeoiezixlnlap17nfp','https://res.cloudinary.com/dsrvzogof/image/upload/v1758773029/products/wrjeoiezixlnlap17nfp.jpg','http://res.cloudinary.com/dsrvzogof/image/upload/v1758773029/products/wrjeoiezixlnlap17nfp.jpg','jpg','image',255960,1200,1200,NULL,NULL,'[]','ns2po/products','2025-09-25T04:03:49.392Z','2025-09-25T04:03:49.392Z',0);
CREATE TABLE IF NOT EXISTS asset_usages (
        id TEXT PRIMARY KEY,
        asset_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        field_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
      );
CREATE TABLE IF NOT EXISTS realisation_blacklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        public_id TEXT UNIQUE NOT NULL,
        original_title TEXT,
        reason TEXT DEFAULT 'user_deleted',
        blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        blacklisted_by TEXT DEFAULT 'admin'
      );
INSERT INTO realisation_blacklist VALUES(1,'cloudinary_ns2po_gallery_creative_sac_001','Auto-discovery supprimée: cloudinary_ns2po_gallery_creative_sac_001','user_deleted_auto_discovery','2025-09-25 07:16:59','admin');
CREATE TABLE IF NOT EXISTS bundle_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bundle_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
        custom_price REAL,
        is_required BOOLEAN DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bundle_id) REFERENCES campaign_bundles(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(bundle_id, product_id)
      );
INSERT INTO bundle_products VALUES(3,1,'textile-tshirt-001',1000,1700,1,1,NULL,'2025-09-25 16:28:20');
INSERT INTO bundle_products VALUES(4,1,'textile-polo-001',50,5850,1,2,NULL,'2025-09-25 16:28:20');
INSERT INTO bundle_products VALUES(29,2,'textile-tshirt-001',1000,1700,1,1,NULL,'2025-09-25 18:48:33');
INSERT INTO bundle_products VALUES(30,2,'textile-casquette-001',100,2500,1,2,NULL,'2025-09-25 18:48:33');
INSERT INTO bundle_products VALUES(31,2,'prod_1758760484329_z9fqi3dp2',1000,250,1,3,NULL,'2025-09-25 18:48:33');
INSERT INTO bundle_products VALUES(32,3,'textile-polo-001',300,5850,1,1,NULL,'2025-09-25 18:57:27');
INSERT INTO bundle_products VALUES(33,3,'textile-casquette-001',500,2500,1,2,NULL,'2025-09-25 18:57:27');
INSERT INTO bundle_products VALUES(34,3,'prod_1758760484329_z9fqi3dp2',500,250,1,3,NULL,'2025-09-25 18:57:27');
INSERT INTO bundle_products VALUES(35,3,'prod_1758763847187_9r8m61axy',100,300,1,4,NULL,'2025-09-25 18:57:28');
INSERT INTO bundle_products VALUES(36,3,'textile-tshirt-001',1000,1700,1,5,NULL,'2025-09-25 18:57:28');
CREATE TABLE IF NOT EXISTS product_materials (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    material_code TEXT, -- Code interne (ex: COT100, POL200)
    material_properties TEXT, -- JSON optionnel pour propriétés avancées
    is_primary BOOLEAN DEFAULT FALSE, -- Matériau principal
    display_order INTEGER DEFAULT 0, -- Ordre d'affichage
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);
INSERT INTO product_materials VALUES('mat_1761951003560_2vd2urxa1','textile-tshirt-001','100% Coton',NULL,NULL,1,0,'2025-10-31 22:50:04');
INSERT INTO product_materials VALUES('mat_1761951003949_75ky7kq3j','textile-polo-001','Coton piqué 200g/m²',NULL,NULL,1,0,'2025-10-31 22:50:04');
INSERT INTO product_materials VALUES('mat_1761951004136_08ghzso7y','textile-casquette-001','Coton/Polyester',NULL,NULL,1,0,'2025-10-31 22:50:04');
CREATE TABLE IF NOT EXISTS product_colors (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    color_name TEXT NOT NULL, -- Ex: "Rouge", "Bleu Marine"
    color_hex TEXT, -- Code hexadécimal (#FF0000)
    color_code TEXT, -- Code interne (ex: COL-RED-01)
    is_available BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);
INSERT INTO product_colors VALUES('col_1761951004466_5cyy35dp0','textile-tshirt-001','Blanc',NULL,NULL,1,0,'2025-10-31 22:50:04');
INSERT INTO product_colors VALUES('col_1761951004699_qkgum8t3t','textile-tshirt-001','Noir',NULL,NULL,1,1,'2025-10-31 22:50:05');
INSERT INTO product_colors VALUES('col_1761951004858_d3fc942wq','textile-tshirt-001','Bleu',NULL,NULL,1,2,'2025-10-31 22:50:05');
INSERT INTO product_colors VALUES('col_1761951005002_sl6nf6txz','textile-tshirt-001','Rouge',NULL,NULL,1,3,'2025-10-31 22:50:05');
INSERT INTO product_colors VALUES('col_1761951005173_6wb7p0bup','textile-tshirt-001','Vert',NULL,NULL,1,4,'2025-10-31 22:50:05');
INSERT INTO product_colors VALUES('col_1761951005313_u3zditnej','textile-polo-001','Blanc',NULL,NULL,1,0,'2025-10-31 22:50:05');
INSERT INTO product_colors VALUES('col_1761951005451_p4eyvkv84','textile-polo-001','Marine',NULL,NULL,1,1,'2025-10-31 22:50:05');
INSERT INTO product_colors VALUES('col_1761951005612_z2pknv5u1','textile-polo-001','Gris',NULL,NULL,1,2,'2025-10-31 22:50:06');
INSERT INTO product_colors VALUES('col_1761951005804_4eif60jpd','textile-polo-001','Noir',NULL,NULL,1,3,'2025-10-31 22:50:06');
INSERT INTO product_colors VALUES('col_1761951005953_88aav1i7u','textile-casquette-001','Blanc',NULL,NULL,1,0,'2025-10-31 22:50:06');
INSERT INTO product_colors VALUES('col_1761951006105_dosslcp1e','textile-casquette-001','Noir',NULL,NULL,1,1,'2025-10-31 22:50:06');
INSERT INTO product_colors VALUES('col_1761951006273_nerupcwq9','textile-casquette-001','Navy',NULL,NULL,1,2,'2025-10-31 22:50:06');
INSERT INTO product_colors VALUES('col_1761951006463_o5pacqjs5','textile-casquette-001','Rouge',NULL,NULL,1,3,'2025-10-31 22:50:06');
INSERT INTO product_colors VALUES('col_1761951006623_7n6avlw6y','textile-casquette-001','Beige',NULL,NULL,1,4,'2025-10-31 22:50:07');
CREATE TABLE IF NOT EXISTS product_sizes (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    size_name TEXT NOT NULL, -- Ex: "S", "M", "L", "XL", "100x50cm"
    size_code TEXT, -- Code interne standardisé
    size_category TEXT, -- Ex: "clothing", "dimensions", "volume"
    dimensions_cm TEXT, -- JSON optionnel pour dimensions précises
    is_available BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);
INSERT INTO product_sizes VALUES('size_1761951006904_e13xbwwht','textile-tshirt-001','S',NULL,'clothing',NULL,1,0,'2025-10-31 22:50:07');
INSERT INTO product_sizes VALUES('size_1761951007084_lxggj74jf','textile-tshirt-001','M',NULL,'clothing',NULL,1,1,'2025-10-31 22:50:07');
INSERT INTO product_sizes VALUES('size_1761951007244_rps2qbb06','textile-tshirt-001','L',NULL,'clothing',NULL,1,2,'2025-10-31 22:50:07');
INSERT INTO product_sizes VALUES('size_1761951007406_s544ezen3','textile-tshirt-001','XL',NULL,'clothing',NULL,1,3,'2025-10-31 22:50:07');
INSERT INTO product_sizes VALUES('size_1761951007582_5c8ltzy45','textile-tshirt-001','XXL',NULL,'clothing',NULL,1,4,'2025-10-31 22:50:08');
INSERT INTO product_sizes VALUES('size_1761951007783_zuxdeduuy','textile-polo-001','S',NULL,'clothing',NULL,1,0,'2025-10-31 22:50:08');
INSERT INTO product_sizes VALUES('size_1761951007957_upqohsmjn','textile-polo-001','M',NULL,'clothing',NULL,1,1,'2025-10-31 22:50:08');
INSERT INTO product_sizes VALUES('size_1761951008123_2wor28x3t','textile-polo-001','L',NULL,'clothing',NULL,1,2,'2025-10-31 22:50:08');
INSERT INTO product_sizes VALUES('size_1761951008291_esroht35e','textile-polo-001','XL',NULL,'clothing',NULL,1,3,'2025-10-31 22:50:08');
INSERT INTO product_sizes VALUES('size_1761951008432_3n5kla4ye','textile-polo-001','XXL',NULL,'clothing',NULL,1,4,'2025-10-31 22:50:08');
INSERT INTO product_sizes VALUES('size_1761951008575_s9xoov4l4','textile-casquette-001','Unique ajustable',NULL,'custom',NULL,1,0,'2025-10-31 22:50:09');
CREATE TABLE IF NOT EXISTS product_gallery (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_type TEXT CHECK(image_type IN ('primary', 'variant', 'detail', 'lifestyle', 'technical')) DEFAULT 'variant',
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    cloudinary_public_id TEXT, -- Pour transformations Cloudinary
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);
INSERT INTO product_gallery VALUES('img_1761951008887_io7nuwhby','textile-tshirt-001','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-tshirt-001.jpg','primary',NULL,0,NULL,1,'2025-10-31 22:50:09');
INSERT INTO product_gallery VALUES('img_1761951009054_m082zb7lc','textile-tshirt-001','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-tshirt-001.jpg','variant',NULL,1,NULL,1,'2025-10-31 22:50:09');
INSERT INTO product_gallery VALUES('img_1761951009187_mfieo1jp4','textile-polo-001','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-polo-001.jpg','primary',NULL,0,NULL,1,'2025-10-31 22:50:09');
INSERT INTO product_gallery VALUES('img_1761951009371_14d87jd3b','textile-polo-001','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-polo-001.jpg','variant',NULL,1,NULL,1,'2025-10-31 22:50:09');
INSERT INTO product_gallery VALUES('img_1761951009548_0ykpgoqef','textile-casquette-001','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-casquette-001.jpg','primary',NULL,0,NULL,1,'2025-10-31 22:50:09');
INSERT INTO product_gallery VALUES('img_1761951009751_fulejjqpj','textile-casquette-001','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-casquette-001.jpg','variant',NULL,1,NULL,1,'2025-10-31 22:50:10');
INSERT INTO product_gallery VALUES('img_1761951009916_pb272t95b','prod_1758760484329_z9fqi3dp2','https://res.cloudinary.com/dsrvzogof/image/upload/ns2po/products/file_kpbqwt','primary',NULL,0,NULL,1,'2025-10-31 22:50:10');
INSERT INTO product_gallery VALUES('img_1761951010063_2udi7o33m','prod_1758763847187_9r8m61axy','https://res.cloudinary.com/dsrvzogof/image/upload/products/yrk5zk0lozijndlnybxg','primary',NULL,0,NULL,1,'2025-10-31 22:50:10');
INSERT INTO product_gallery VALUES('img_1761951010255_xxua2fgej','prod_1758773049222_aguwp0z5b','https://res.cloudinary.com/dsrvzogof/image/upload/products/wrjeoiezixlnlap17nfp','primary',NULL,0,NULL,1,'2025-10-31 22:50:10');
CREATE TABLE IF NOT EXISTS product_tags (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    tag_name TEXT NOT NULL,
    tag_type TEXT CHECK(tag_type IN ('category', 'feature', 'material', 'occasion', 'custom')) DEFAULT 'custom',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);
INSERT INTO product_tags VALUES('tag_cat_textile-tshirt-001_10176646','textile-tshirt-001','textile','category','2025-10-31 22:50:10');
INSERT INTO product_tags VALUES('tag_cat_textile-polo-001_33156075','textile-polo-001','textile','category','2025-10-31 22:50:10');
INSERT INTO product_tags VALUES('tag_cat_textile-casquette-001_27575715','textile-casquette-001','accessoire','category','2025-10-31 22:50:10');
INSERT INTO product_tags VALUES('tag_cat_prod_1758760484329_z9fqi3dp2_33095249','prod_1758760484329_z9fqi3dp2','cat_1758155269599_f9d615g9y','category','2025-10-31 22:50:10');
INSERT INTO product_tags VALUES('tag_cat_prod_1758763847187_9r8m61axy_58227741','prod_1758763847187_9r8m61axy','cat_1758155269599_f9d615g9y','category','2025-10-31 22:50:10');
INSERT INTO product_tags VALUES('tag_cat_prod_1758773049222_aguwp0z5b_15926222','prod_1758773049222_aguwp0z5b','textile','category','2025-10-31 22:50:10');
INSERT INTO product_tags VALUES('tag_subcat_textile-tshirt-001_93268137','textile-tshirt-001','vetement','category','2025-10-31 22:50:11');
INSERT INTO product_tags VALUES('tag_subcat_textile-polo-001_68357276','textile-polo-001','vetement','category','2025-10-31 22:50:11');
INSERT INTO product_tags VALUES('tag_subcat_textile-casquette-001_44214930','textile-casquette-001','couvre_chef','category','2025-10-31 22:50:11');
INSERT INTO product_tags VALUES('tag_custom_textile-tshirt-001','textile-tshirt-001','personnalisable','feature','2025-10-31 22:50:11');
INSERT INTO product_tags VALUES('tag_custom_textile-polo-001','textile-polo-001','personnalisable','feature','2025-10-31 22:50:11');
INSERT INTO product_tags VALUES('tag_custom_textile-casquette-001','textile-casquette-001','personnalisable','feature','2025-10-31 22:50:11');
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_snapshot TEXT NOT NULL, -- JSON snapshot produit au moment commande
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    customization_data TEXT, -- JSON personnalisation (logo, texte, etc.)
    customization_preview_url TEXT, -- URL aperçu personnalisation
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id)
);
PRAGMA writable_schema=ON;
INSERT INTO sqlite_schema(type,name,tbl_name,rootpage,sql) VALUES('table','products_search_fts','products_search_fts',0,'CREATE VIRTUAL TABLE products_search_fts USING fts5(
    product_id UNINDEXED,
    name,
    description,
    category,
    subcategory,
    tokenize='porter unicode61'
)');
CREATE TABLE IF NOT EXISTS 'products_search_fts_data'(id INTEGER PRIMARY KEY, block BLOB);
INSERT INTO products_search_fts_data VALUES(1,X'06000f4b0a04');
INSERT INTO products_search_fts_data VALUES(10,X'000000000101010001010101');
INSERT INTO products_search_fts_data VALUES(137438953473,X'0000038804303130300106010204020c3735383135353236393539390406010303010601030301096163636573736f6972030601030202046a757374030601020302036c6f72050601021d02077070617274656e050601021f020376656303060102040103626f69040601020701086361737175657474030c010102010202030174040601030201060103020203686566030601040302076c617373697175010601010402076f6d6d656d6f7205060102240303746f6e010601020501060102050305756c6575720106010209040276720306010402010164040601020b0106010225020165040601020901060102190303636f72040601020a02056973706f6e0106010206040774696e63746966050601021b0206726170656175040601010208017804060102020104656c6567020601010302016e01060102070106010204020c010103010206020870696e676c6574740506010206020273740506010207020376656e040601020c010601022701096639643631356739790406010304010601030402026978050601021102066f756c617264060c0101020102020106696d7072696d060601020302066e6375727665030601020603047369676e050601020a01026c610506010223020165050a0102020b0c02036f676f050601022101066d616a657572040601020d02086574616c6c697175050601020e01026f7505080102051f0106706170696572040c0101040102030301720306010208020a6572736f6e6e616c69730506010104010c010103010204030374697405060102090202696e050e0101020102031503027175020601020602026c75050601020c04057369657572010601020802036f6c6f020c0101020102020302757204060102080206726f64756374030601020a040a66657373696f6e6e656c0206010203020a75626c69636974616972030601010301027161030601020902027569050601020f010173050e010103010204150201650506010210030272740506010218020468697274010c010103010203020369676e050601021a02066f7576656e74050601020d02027572040601020401060102120207796d626f6c6973050601021c010174010c010102010202020465737465030601020703047874696c010601030201060103020406010302020369676504060102050102756e050e0102080d0d04080108766574656d656e74010601040201060104020306010214020569736965720306010205040a18100b0a0e0a0a120d0a0e0e0f0c090d0d0a0c0e0d080b150f090f1509100d0d0b090a0a0d0f0a1008190a0d09090c0d090d111109090c08090e0a0d0e0e0b0b150a0d19');
CREATE TABLE IF NOT EXISTS 'products_search_fts_data'(id INTEGER PRIMARY KEY, block BLOB);
INSERT INTO products_search_fts_data VALUES(1,X'06000f4b0a04');
INSERT INTO products_search_fts_data VALUES(10,X'000000000101010001010101');
INSERT INTO products_search_fts_data VALUES(137438953473,X'0000038804303130300106010204020c3735383135353236393539390406010303010601030301096163636573736f6972030601030202046a757374030601020302036c6f72050601021d02077070617274656e050601021f020376656303060102040103626f69040601020701086361737175657474030c010102010202030174040601030201060103020203686566030601040302076c617373697175010601010402076f6d6d656d6f7205060102240303746f6e010601020501060102050305756c6575720106010209040276720306010402010164040601020b0106010225020165040601020901060102190303636f72040601020a02056973706f6e0106010206040774696e63746966050601021b0206726170656175040601010208017804060102020104656c6567020601010302016e01060102070106010204020c010103010206020870696e676c6574740506010206020273740506010207020376656e040601020c010601022701096639643631356739790406010304010601030402026978050601021102066f756c617264060c0101020102020106696d7072696d060601020302066e6375727665030601020603047369676e050601020a01026c610506010223020165050a0102020b0c02036f676f050601022101066d616a657572040601020d02086574616c6c697175050601020e01026f7505080102051f0106706170696572040c0101040102030301720306010208020a6572736f6e6e616c69730506010104010c010103010204030374697405060102090202696e050e0101020102031503027175020601020602026c75050601020c04057369657572010601020802036f6c6f020c0101020102020302757204060102080206726f64756374030601020a040a66657373696f6e6e656c0206010203020a75626c69636974616972030601010301027161030601020902027569050601020f010173050e010103010204150201650506010210030272740506010218020468697274010c010103010203020369676e050601021a02066f7576656e74050601020d02027572040601020401060102120207796d626f6c6973050601021c010174010c010102010202020465737465030601020703047874696c010601030201060103020406010302020369676504060102050102756e050e0102080d0d04080108766574656d656e74010601040201060104020306010214020569736965720306010205040a18100b0a0e0a0a120d0a0e0e0f0c090d0d0a0c0e0d080b150f090f1509100d0d0b090a0a0d0f0a1008190a0d09090c0d090d111109090c08090e0a0d0e0e0b0b150a0d19');
CREATE TABLE IF NOT EXISTS 'products_search_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;
INSERT INTO products_search_fts_idx VALUES(1,X'',2);
CREATE TABLE IF NOT EXISTS 'products_search_fts_content'(id INTEGER PRIMARY KEY, c0, c1, c2, c3, c4);
INSERT INTO products_search_fts_content VALUES(1,'textile-tshirt-001','T-shirt Classique','T-shirt 100% coton, disponible en plusieurs couleurs','TEXTILE','VETEMENT');
INSERT INTO products_search_fts_content VALUES(2,'textile-polo-001','Polo Élégant','Polo professionnel en coton piqué','TEXTILE','VETEMENT');
INSERT INTO products_search_fts_content VALUES(3,'textile-casquette-001','Casquette Publicitaire','Casquette ajustable avec visière incurvée - Testée par QA Production','ACCESSOIRE','COUVRE_CHEF');
INSERT INTO products_search_fts_content VALUES(4,'prod_1758760484329_z9fqi3dp2','Drapeau en papier','Drapeaux papier sur tige en bois pour des décorations d''événements majeurs. ','cat_1758155269599_f9d615g9y','');
INSERT INTO products_search_fts_content VALUES(5,'prod_1758763847187_9r8m61axy','Pin''s personnalisé','Le pin''s ou épinglette est un petit insigne, le plus souvent métallique, qui se fixe sur un vêtement. Le pin''s sert de signe distinctif, symbolisant alors une appartenance, un logo ou la commémoration d''un événement.','cat_1758155269599_f9d615g9y','');
INSERT INTO products_search_fts_content VALUES(6,'prod_1758773049222_aguwp0z5b','Foulard personnalisé','Foulard imprimé personnalisé.','textile','');
CREATE TABLE IF NOT EXISTS 'products_search_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);
INSERT INTO products_search_fts_docsize VALUES(1,X'0003080101');
INSERT INTO products_search_fts_docsize VALUES(2,X'0002050101');
INSERT INTO products_search_fts_docsize VALUES(3,X'0002090102');
INSERT INTO products_search_fts_docsize VALUES(4,X'00030c0300');
INSERT INTO products_search_fts_docsize VALUES(5,X'0003260300');
INSERT INTO products_search_fts_docsize VALUES(6,X'0002030100');
CREATE TABLE IF NOT EXISTS 'products_search_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID;
INSERT INTO products_search_fts_config VALUES('version',4);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('campaign_bundles',3);
INSERT INTO sqlite_sequence VALUES('realisation_blacklist',1);
INSERT INTO sqlite_sequence VALUES('bundle_products',36);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created ON contacts(created_at);
CREATE INDEX idx_customizations_order ON product_customizations(order_id);
CREATE INDEX idx_customizations_status ON product_customizations(status);
CREATE TRIGGER update_customers_updated_at 
    AFTER UPDATE ON customers
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER update_products_updated_at 
    AFTER UPDATE ON products
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER update_quotes_updated_at 
    AFTER UPDATE ON quotes
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE quotes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER update_orders_updated_at 
    AFTER UPDATE ON orders
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER update_contacts_updated_at 
    AFTER UPDATE ON contacts
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE contacts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER update_customizations_updated_at 
    AFTER UPDATE ON product_customizations
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE product_customizations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER update_admin_users_updated_at 
    AFTER UPDATE ON admin_users
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE admin_users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE INDEX idx_payment_instructions_order ON payment_instructions(order_id);
CREATE INDEX idx_payment_instructions_status ON payment_instructions(status);
CREATE INDEX idx_payment_instructions_reference ON payment_instructions(reference);
CREATE INDEX idx_commercial_contacts_role ON commercial_contacts(role);
CREATE INDEX idx_commercial_contacts_active ON commercial_contacts(is_active);
CREATE TRIGGER update_payment_instructions_updated_at 
    AFTER UPDATE ON payment_instructions
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE payment_instructions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TRIGGER update_commercial_contacts_updated_at 
    AFTER UPDATE ON commercial_contacts
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE commercial_contacts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE INDEX idx_campaign_bundles_active ON campaign_bundles(is_active);
CREATE INDEX idx_campaign_bundles_audience ON campaign_bundles(target_audience);
CREATE INDEX idx_bundle_pricing_bundle ON bundle_pricing_tiers(bundle_id);
CREATE TRIGGER update_campaign_bundles_timestamp
AFTER UPDATE ON campaign_bundles
BEGIN
  UPDATE campaign_bundles
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;
CREATE VIEW bundle_statistics AS
SELECT
  cb.id,
  cb.name,
  cb.target_audience,
  cb.final_price,
  COUNT(DISTINCT bp.product_id) as product_count,
  SUM(bp.quantity) as total_items,
  SUM(
    CASE
      WHEN bp.custom_price IS NOT NULL THEN bp.custom_price * bp.quantity
      ELSE p.price * bp.quantity
    END
  ) as total_products_value,
  cb.final_price - SUM(
    CASE
      WHEN bp.custom_price IS NOT NULL THEN bp.custom_price * bp.quantity
      ELSE p.price * bp.quantity
    END
  ) as savings
FROM campaign_bundles cb
LEFT JOIN bundle_products bp ON cb.id = bp.bundle_id
LEFT JOIN products p ON bp.product_id = p.id
WHERE cb.is_active = 1
GROUP BY cb.id;
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE TRIGGER categories_updated_at
    AFTER UPDATE ON categories
    FOR EACH ROW
BEGIN
    UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE INDEX idx_quote_items_active ON quote_items(is_active, status);
CREATE INDEX idx_quote_items_category ON quote_items(category, subcategory);
CREATE INDEX idx_quote_items_featured ON quote_items(is_featured, sort_order);
CREATE INDEX idx_quote_items_search ON quote_items(name, category);
CREATE TRIGGER quote_items_updated_at
  AFTER UPDATE ON quote_items
  FOR EACH ROW
  BEGIN
    UPDATE quote_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
CREATE VIEW quote_items_statistics AS
SELECT
  COUNT(*) as total_items,
  COUNT(CASE WHEN is_active = 1 AND status = 'Active' THEN 1 END) as active_items,
  COUNT(CASE WHEN is_featured = 1 THEN 1 END) as featured_items,
  COUNT(DISTINCT category) as total_categories,
  AVG(base_price) as avg_price,
  MIN(base_price) as min_price,
  MAX(base_price) as max_price,
  'turso' as source
FROM quote_items;
CREATE INDEX idx_realisations_active ON realisations(is_active);
CREATE INDEX idx_realisations_featured ON realisations(is_featured);
CREATE INDEX idx_realisations_order ON realisations(order_position);
CREATE INDEX idx_realisations_title ON realisations(title);
CREATE INDEX idx_realisations_source ON realisations(source);
CREATE INDEX idx_realisations_active_featured ON realisations(is_active, is_featured, order_position);
CREATE INDEX idx_realisations_active_order ON realisations(is_active, order_position);
CREATE TRIGGER realisations_updated_at
    AFTER UPDATE ON realisations
    FOR EACH ROW
BEGIN
    UPDATE realisations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE VIEW realisation_statistics AS
SELECT
  COUNT(*) as total_realisations,
  COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_realisations,
  COUNT(CASE WHEN is_featured = 1 AND is_active = 1 THEN 1 END) as featured_realisations,
  COUNT(CASE WHEN source = 'turso' THEN 1 END) as turso_realisations,
  COUNT(CASE WHEN source = 'airtable' THEN 1 END) as airtable_realisations,
  COUNT(CASE WHEN source = 'cloudinary-auto-discovery' THEN 1 END) as auto_discovery_realisations,
  AVG(json_array_length(cloudinary_public_ids)) as avg_images_per_realisation,
  AVG(json_array_length(product_ids)) as avg_products_per_realisation
FROM realisations;
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_system_logs_source ON system_logs(source);
CREATE UNIQUE INDEX idx_products_reference_unique ON products(reference);
CREATE INDEX idx_products_reference ON products(reference);
CREATE INDEX idx_assets_public_id ON assets(public_id)
    ;
CREATE INDEX idx_assets_folder ON assets(folder)
    ;
CREATE INDEX idx_assets_format ON assets(format)
    ;
CREATE INDEX idx_assets_created_at ON assets(created_at)
    ;
CREATE INDEX idx_asset_usages_asset_id ON asset_usages(asset_id)
    ;
CREATE INDEX idx_asset_usages_entity ON asset_usages(entity_type, entity_id)
    ;
CREATE UNIQUE INDEX idx_asset_usages_unique ON asset_usages(asset_id, entity_type, entity_id, field_name)
    ;
CREATE INDEX idx_realisation_blacklist_public_id
      ON realisation_blacklist(public_id)
    ;
CREATE INDEX idx_realisation_blacklist_date
      ON realisation_blacklist(blacklisted_at DESC)
    ;
CREATE INDEX idx_materials_product ON product_materials(product_id);
CREATE INDEX idx_materials_name ON product_materials(material_name);
CREATE INDEX idx_colors_product ON product_colors(product_id);
CREATE INDEX idx_colors_name ON product_colors(color_name);
CREATE INDEX idx_colors_available ON product_colors(is_available);
CREATE INDEX idx_sizes_product ON product_sizes(product_id);
CREATE INDEX idx_sizes_category ON product_sizes(size_category);
CREATE INDEX idx_sizes_available ON product_sizes(is_available);
CREATE INDEX idx_gallery_product ON product_gallery(product_id);
CREATE INDEX idx_gallery_type ON product_gallery(image_type);
CREATE INDEX idx_gallery_order ON product_gallery(product_id, display_order);
CREATE INDEX idx_tags_product ON product_tags(product_id);
CREATE INDEX idx_tags_name ON product_tags(tag_name);
CREATE INDEX idx_tags_type ON product_tags(tag_type);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_new ON products(is_new) WHERE is_new = TRUE;
CREATE INDEX idx_products_stock ON products(is_in_stock);
CREATE INDEX idx_products_popularity ON products(popularity_score DESC);
CREATE INDEX idx_products_weight ON products(weight_grams);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_customers_segment ON customers(customer_segment);
CREATE INDEX idx_customers_last_order ON customers(last_order_date);
CREATE INDEX idx_customers_marketing ON customers(marketing_opt_in) WHERE marketing_opt_in = TRUE;
CREATE TRIGGER update_product_materials_updated_at
    AFTER UPDATE ON product_materials
    FOR EACH ROW
    WHEN NEW.created_at = OLD.created_at
BEGIN
    -- Propager changement vers products.updated_at
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.product_id;
END;
CREATE TRIGGER update_product_colors_updated_at
    AFTER UPDATE ON product_colors
    FOR EACH ROW
    WHEN NEW.created_at = OLD.created_at
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.product_id;
END;
CREATE TRIGGER update_product_sizes_updated_at
    AFTER UPDATE ON product_sizes
    FOR EACH ROW
    WHEN NEW.created_at = OLD.created_at
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.product_id;
END;
CREATE TRIGGER calculate_product_volume
    AFTER UPDATE OF length_cm, width_cm, height_cm ON products
    FOR EACH ROW
    WHEN NEW.length_cm IS NOT NULL AND NEW.width_cm IS NOT NULL AND NEW.height_cm IS NOT NULL
BEGIN
    UPDATE products
    SET volume_cm3 = NEW.length_cm * NEW.width_cm * NEW.height_cm
    WHERE id = NEW.id;
END;
CREATE VIEW products_enriched AS
SELECT
    p.*,
    COUNT(DISTINCT pm.id) as materials_count,
    COUNT(DISTINCT pc.id) as colors_count,
    COUNT(DISTINCT ps.id) as sizes_count,
    COUNT(DISTINCT pg.id) as gallery_images_count,
    GROUP_CONCAT(DISTINCT pm.material_name, ', ') as materials_list,
    GROUP_CONCAT(DISTINCT pc.color_name, ', ') as colors_list,
    GROUP_CONCAT(DISTINCT pt.tag_name, ', ') as tags_list
FROM products p
LEFT JOIN product_materials pm ON p.id = pm.product_id
LEFT JOIN product_colors pc ON p.id = pc.product_id
LEFT JOIN product_sizes ps ON p.id = ps.product_id
LEFT JOIN product_gallery pg ON p.id = pg.product_id AND pg.is_active = TRUE
LEFT JOIN product_tags pt ON p.id = pt.product_id
GROUP BY p.id;
CREATE VIEW customers_stats AS
SELECT
    c.*,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_spent,
    MAX(o.created_at) as last_order_date,
    AVG(o.total_amount) as average_order_value
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id;
PRAGMA writable_schema=OFF;
COMMIT;
