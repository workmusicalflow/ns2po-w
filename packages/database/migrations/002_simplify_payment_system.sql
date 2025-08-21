-- Migration pour simplifier le système de paiement
-- Suppression de la complexité paiement en ligne au profit d'instructions commerciales

-- Supprimer la table payments (pas nécessaire pour instructions commerciales)
DROP TABLE IF EXISTS payments;

-- Simplifier la table orders pour contact commercial
ALTER TABLE orders ADD COLUMN commercial_contact_provided BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN commercial_instructions TEXT; -- Instructions de contact commercial
ALTER TABLE orders ADD COLUMN follow_up_date DATETIME; -- Date de relance commerciale

-- Créer une table simplifiée pour les informations commerciales
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

-- Insérer les contacts commerciaux NS2PO
INSERT INTO commercial_contacts (id, name, role, mobile_phone, fixed_phone, email, specialties, availability_hours) VALUES
('COMM_001', 'Service Commercial NS2PO', 'sales', '+2250575129737', '+2252721248803', 'commercial@ns2po.ci', 
 '["devis", "commandes", "paiements", "suivi"]',
 '{"lundi_vendredi": "8h-17h", "samedi": "8h-12h", "dimanche": "fermé", "urgences": "24h/7j"}'),
('COMM_002', 'Manager Commercial', 'manager', '+2250575129737', '+2252721248803', 'manager@ns2po.ci',
 '["grandes_commandes", "projets_speciaux", "partenariats"]',
 '{"lundi_vendredi": "9h-16h", "weekend": "sur_rendez_vous"}');

-- Créer une table pour les instructions de paiement personnalisées
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

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_payment_instructions_order ON payment_instructions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_instructions_status ON payment_instructions(status);
CREATE INDEX IF NOT EXISTS idx_payment_instructions_reference ON payment_instructions(reference);
CREATE INDEX IF NOT EXISTS idx_commercial_contacts_role ON commercial_contacts(role);
CREATE INDEX IF NOT EXISTS idx_commercial_contacts_active ON commercial_contacts(is_active);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER IF NOT EXISTS update_payment_instructions_updated_at 
    AFTER UPDATE ON payment_instructions
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE payment_instructions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_commercial_contacts_updated_at 
    AFTER UPDATE ON commercial_contacts
    FOR EACH ROW 
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE commercial_contacts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;