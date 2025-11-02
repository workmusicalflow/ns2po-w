// Test du message WhatsApp avec les vraies données du formulaire
const formatCurrency = (amount) => {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  return `${formatted} FCFA`;
};

const generateWhatsAppMessage = (formData) => {
  const totalAmount = formData.cart.reduce((sum, item) => sum + item.total, 0);

  let message = `*DEMANDE DE DEVIS ELECTORAL NS2PO*\n\n`;
  message += `*Client:* ${formData.organization}\n`;
  message += `*Type de Projet:* ${formData.projectType}\n`;
  message += `*Contact:* ${formData.contactName}\n`;
  message += `*Telephone:* ${formData.contactPhone}\n`;
  message += `*Email:* ${formData.contactEmail}\n\n`;

  message += `--- DETAILS DU PANIER ---\n`;
  formData.cart.forEach((item, index) => {
    message += `${index + 1}. *${item.name}*\n`;
    message += `   Quantite: ${item.quantity.toLocaleString('fr-FR')}\n`;
    message += `   Prix unitaire: ${formatCurrency(item.unitPrice)}\n`;
    message += `   Sous-total: ${formatCurrency(item.total)}\n\n`;
  });
  message += `------------------------\n`;
  message += `*MONTANT TOTAL ESTIME: ${formatCurrency(totalAmount)}*\n\n`;

  if (formData.notes && formData.notes.trim()) {
    message += `*Notes additionnelles:*\n${formData.notes.trim()}\n\n`;
  }

  message += `*ACTION REQUISE:* Merci de nous recontacter rapidement pour finaliser votre devis personnalise.\n\n`;
  message += `NS2PO - Votre partenaire publicite par l'objet depuis 2011`;

  return message;
};

// Test avec données réelles du formulaire StepValidation
const testData = {
  organization: "Parti Démocratique de Côte d'Ivoire",
  projectType: "Campagne Électorale (Sélection Personnalisée)",
  contactName: "Jean Kouassi",
  contactPhone: "+22507000000",
  contactEmail: "Contact via WhatsApp",
  cart: [
    {
      id: "textile-tshirt-001",
      name: "T-shirt Classique",
      quantity: 1000,
      unitPrice: 1700,
      total: 1700000
    },
    {
      id: "textile-polo-001",
      name: "Polo Élégant",
      quantity: 50,
      unitPrice: 5850,
      total: 292500
    }
  ],
  notes: "Demande envoyée via le générateur de devis NS2PO - Canal préféré: WhatsApp"
};

console.log("=== MESSAGE WHATSAPP CORRIGE ===");
console.log(generateWhatsAppMessage(testData));

console.log("\n=== VERIFICATION ENCODAGE ===");
const encoded = encodeURIComponent(generateWhatsAppMessage(testData));
console.log("Taille:", encoded.length, "caractères");
console.log("Contient des caractères corrompus:", encoded.includes('%EF%BF%BD') ? '❌ OUI' : '✅ NON');