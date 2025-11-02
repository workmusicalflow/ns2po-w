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
);
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
, reference TEXT);
INSERT INTO products VALUES('textile-tshirt-001','T-shirt Classique','T-shirt 100% coton, disponible en plusieurs couleurs','TEXTILE','VETEMENT',1700,10,1000,'piece',7,1,'["100% Coton"]','["Blanc","Noir","Bleu","Rouge","Vert"]','["S","M","L","XL","XXL"]','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-tshirt-001.jpg','["https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-tshirt-001.jpg"]','{"poids":"180g/m²","col":"Ras du cou","manches":"Courtes","coupe":"Droite"}',1,'2025-08-23T00:23:43.747Z','2025-08-23T00:23:43.748Z','2025-09-24 12:04:20','AUTO-1758715460-rt-001');
INSERT INTO products VALUES('textile-polo-001','Polo Élégant','Polo professionnel en coton piqué','TEXTILE','VETEMENT',5850,5,500,'piece',10,1,'["Coton piqué 200g/m²"]','["Blanc","Marine","Gris","Noir"]','["S","M","L","XL","XXL"]','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-polo-001.jpg','["https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-polo-001.jpg"]','{"poids":"200g/m²","col":"Polo avec boutonnage","manches":"Courtes","coupe":"Ajustée"}',1,'2025-08-23T00:23:44.387Z','2025-08-23T00:23:44.387Z','2025-09-24 12:04:20','AUTO-1758715460-lo-001');
INSERT INTO products VALUES('textile-casquette-001','Casquette Publicitaire','Casquette ajustable avec visière incurvée - Testée par QA Production','ACCESSOIRE','COUVRE_CHEF',2500,20,2000,'piece',5,1,'["Coton/Polyester"]','["Blanc","Noir","Navy","Rouge","Beige"]','["Unique ajustable"]','https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-casquette-001.jpg','["https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_600,w_600,q_auto,f_auto/ns2po-w/products/textile-casquette-001.jpg"]','{"fermeture":"Scratch ajustable","visiere":"Incurvée pré-formée","broderie":"Possible sur devant et côtés"}',1,'2025-08-23T00:23:44.786Z','2025-08-23T00:23:44.786Z','2025-09-24 12:04:20','AUTO-1758715460-te-001');
INSERT INTO products VALUES('prod_1758760484329_z9fqi3dp2','Drapeau en papier','Drapeaux papier sur tige en bois pour des décorations d''événements majeurs. ','cat_1758155269599_f9d615g9y',NULL,250,100,1000,'pièce',7,0,NULL,'[]','[]','https://res.cloudinary.com/dsrvzogof/image/upload/ns2po/products/file_kpbqwt','[]',NULL,1,NULL,'2025-09-25 00:34:44','2025-09-25 00:34:44','DRAPEAU-001');
INSERT INTO products VALUES('prod_1758763847187_9r8m61axy','Pin''s personnalisé','Le pin''s ou épinglette est un petit insigne, le plus souvent métallique, qui se fixe sur un vêtement. Le pin''s sert de signe distinctif, symbolisant alors une appartenance, un logo ou la commémoration d''un événement.','cat_1758155269599_f9d615g9y',NULL,300,100,1000,'pièce',7,0,NULL,'[]','[]','https://res.cloudinary.com/dsrvzogof/image/upload/products/yrk5zk0lozijndlnybxg','[]',NULL,1,NULL,'2025-09-25 01:30:47','2025-09-25 01:30:47','PINS-001');
INSERT INTO products VALUES('prod_1758773049222_aguwp0z5b','Foulard personnalisé','Foulard imprimé personnalisé.','textile',NULL,350,100,1000,'pièce',7,0,NULL,'[]','[]','https://res.cloudinary.com/dsrvzogof/image/upload/products/wrjeoiezixlnlap17nfp','[]',NULL,1,NULL,'2025-09-25 04:04:09','2025-09-25 04:04:09','FOURLARD-001');
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
COMMIT;
