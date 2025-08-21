-- Migration initiale pour NS2PO Election MVP
-- Base de données Turso (SQLite)

-- Table des utilisateurs et clients
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

-- Table des produits (synchronisée avec Airtable)
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
);

-- Table des règles de prix (remises par quantité, type client)
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

-- Table des devis
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

-- Table des commandes
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES quotes (id),
    FOREIGN KEY (customer_id) REFERENCES customers (id)
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('mobile_money', 'bank_transfer', 'cash', 'card')) NOT NULL,
    payment_provider TEXT, -- Orange Money, MTN, UBA, etc.
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'XOF',
    status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    reference TEXT UNIQUE NOT NULL,
    provider_reference TEXT,
    provider_response TEXT, -- JSON response
    payment_date DATETIME,
    metadata TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id)
);

-- Table des contacts/messages
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

-- Table des personnalisations de produits
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

-- Table des utilisateurs admin
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

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_customizations_order ON product_customizations(order_id);
CREATE INDEX IF NOT EXISTS idx_customizations_status ON product_customizations(status);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER IF NOT EXISTS update_customers_updated_at 
    AFTER UPDATE ON customers
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_products_updated_at 
    AFTER UPDATE ON products
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_quotes_updated_at 
    AFTER UPDATE ON quotes
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE quotes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_orders_updated_at 
    AFTER UPDATE ON orders
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_payments_updated_at 
    AFTER UPDATE ON payments
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_contacts_updated_at 
    AFTER UPDATE ON contacts
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE contacts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_customizations_updated_at 
    AFTER UPDATE ON product_customizations
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE product_customizations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_admin_users_updated_at 
    AFTER UPDATE ON admin_users
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE admin_users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;