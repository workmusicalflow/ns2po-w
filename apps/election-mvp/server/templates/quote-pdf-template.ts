/**
 * PDF Quote Template
 * Template HTML embarqué pour garantir disponibilité en production Nitro
 */

export const QUOTE_PDF_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis NS2PO - {{reference}}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #2D2D2D;
      background: #ffffff;
      padding: 30px 30px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    /* Header avec logo */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 3px solid #C99A3B;
    }

    .logo {
      width: 180px;
      height: auto;
    }

    .header-info {
      text-align: right;
      color: #666;
    }

    .header-info h1 {
      font-size: 28px;
      color: #6A2B3A;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .header-info .meta {
      font-size: 14px;
      color: #C99A3B;
      font-weight: 600;
    }

    .header-info .reference {
      font-size: 16px;
      color: #C99A3B;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .header-info .date {
      font-size: 13px;
      color: #999;
    }

    /* Informations client */
    .client-section {
      background: #F8F8F8;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .client-section h2 {
      font-size: 16px;
      color: #6A2B3A;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .client-section p {
      margin-bottom: 4px;
      color: #555;
    }

    .client-section strong {
      color: #2D2D2D;
      font-weight: 600;
    }

    /* Tableau produits */
    .products-section {
      margin-bottom: 20px;
    }

    .products-section h2 {
      font-size: 18px;
      color: #6A2B3A;
      margin-bottom: 16px;
      font-weight: 600;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    thead {
      background: #6A2B3A;
      color: white;
    }

    thead th {
      padding: 10px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    thead th:last-child {
      text-align: right;
    }

    tbody tr {
      border-bottom: 1px solid #E0E0E0;
    }

    tbody tr:last-child {
      border-bottom: none;
    }

    tbody td {
      padding: 12px 8px;
      vertical-align: top;
    }

    tbody td:last-child {
      text-align: right;
      font-weight: 600;
      color: #2D2D2D;
    }

    .product-name {
      font-weight: 600;
      color: #2D2D2D;
      margin-bottom: 4px;
    }

    .product-customization {
      font-size: 11px;
      color: #666;
      font-style: italic;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }

    .product-image {
      width: 65px;
      height: 65px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #E0E0E0;
    }

    /* Section totaux */
    .totals-section {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }

    .totals-box {
      width: 360px;
      background: #FAFAFA;
      padding: 20px 24px;
      border-radius: 8px;
      border: 1px solid #E8E8E8;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 8px 0;
      border-bottom: 1px solid #E8E8E8;
    }

    .totals-row:last-child {
      border-bottom: none;
      margin-top: 10px;
      padding: 14px 0 0 0;
    }

    .totals-row.total {
      font-size: 20px;
      font-weight: 700;
      color: #6A2B3A;
    }

    .totals-label {
      font-weight: 500;
      color: #666;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .totals-row.total .totals-label {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .totals-value {
      font-weight: 600;
      color: #2D2D2D;
      font-size: 14px;
      font-variant-numeric: tabular-nums;
    }

    .totals-row.total .totals-value {
      color: #C99A3B;
      font-size: 22px;
      font-weight: 700;
    }

    /* Footer */
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 2px solid #E0E0E0;
      text-align: center;
      color: #999;
      font-size: 12px;
    }

    .footer .company-name {
      font-weight: 600;
      color: #6A2B3A;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .footer .tagline {
      font-style: italic;
      color: #C99A3B;
      margin-bottom: 8px;
    }

    .footer .contact {
      margin-top: 6px;
    }

    .footer .contact a {
      color: #C99A3B;
      text-decoration: none;
    }

    /* Responsive optimizations for PDF */
    @media print {
      body {
        padding: 20px;
      }
      .container {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="{{logoUrl}}" alt="NS2PO Logo" class="logo">
      <div class="header-info">
        <h1>DEVIS</h1>
        <div class="meta">{{reference}} • {{date}}</div>
      </div>
    </div>

    <!-- Client Information -->
    <div class="client-section">
      <h2>Informations Client</h2>
      <p><strong>Client:</strong> {{clientName}} • {{clientEmail}} • {{clientPhone}}</p>
    </div>

    <!-- Products Table -->
    <div class="products-section">
      <h2>Articles Commandés</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 100px;">Image</th>
            <th>Produit</th>
            <th style="width: 80px; text-align: center;">Quantité</th>
            <th style="width: 120px; text-align: right;">Prix Unit.</th>
            <th style="width: 120px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>
              <img src="{{imageUrl}}" alt="{{name}}" class="product-image">
            </td>
            <td>
              <div class="product-name">{{name}}</div>
              {{#if customization}}
              <div class="product-customization">{{customization}}</div>
              {{/if}}
            </td>
            <td style="text-align: center;">{{quantity}}</td>
            <td style="text-align: right;">{{unitPrice}} FCFA</td>
            <td style="text-align: right;">{{totalPrice}} FCFA</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span class="totals-label">Sous-total</span>
          <span class="totals-value">{{subtotal}} FCFA</span>
        </div>
        {{#if discount}}
        <div class="totals-row">
          <span class="totals-label">Remise ({{discountPercent}}%)</span>
          <span class="totals-value">-{{discount}} FCFA</span>
        </div>
        {{/if}}
        <div class="totals-row">
          <span class="totals-label">TVA (18%)</span>
          <span class="totals-value">{{tax}} FCFA</span>
        </div>
        <div class="totals-row total">
          <span class="totals-label">TOTAL TTC</span>
          <span class="totals-value">{{total}} FCFA</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="company-name">NS2PO</div>
      <div class="tagline">Publicité par l'Objet depuis 2011</div>
      <div class="contact">
        Abidjan, CI • ns2pomail@ns2po.ci • +225 05 75 12 97 37 • +225 27 21 24 88 03
      </div>
      <div style="margin-top: 16px; font-size: 11px; color: #BBB;">
        Ce devis est valable 30 jours à compter de la date d'émission
      </div>
    </div>
  </div>
</body>
</html>
`;
