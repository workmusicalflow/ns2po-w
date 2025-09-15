/**
 * Service de notification email pour NS2PO
 * Utilise les paramètres SMTP configurés dans les variables d'environnement
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

/**
 * Supprime les balises HTML de manière sécurisée pour éviter les attaques ReDoS
 * Utilise une approche par passes multiples recommandée par SonarCloud
 */
function stripHtmlTags(html: string): string {
  if (!html) return ''
  
  // Limiter la taille de l'entrée pour éviter les attaques DoS
  const maxLength = 10000
  const truncatedHtml = html.length > maxLength ? html.substring(0, maxLength) : html
  
  // Approche sécurisée : remplacer d'abord les balises communes
  return truncatedHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Supprimer scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Supprimer styles
    .replace(/<[^>]{1,200}>/g, '') // Balises limitées à 200 caractères max
    .replace(/&nbsp;/g, ' ') // Espaces insécables
    .replace(/&amp;/g, '&') // Entités HTML
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface ContactNotificationData {
  reference: string
  customerName: string
  customerEmail: string
  type: 'quote' | 'preorder' | 'custom' | 'support' | 'meeting'
  subject: string
  message: string
  orderDetails?: {
    items?: Array<{
      productName?: string
      quantity?: number
      totalPrice?: number
    }>
    totalAmount?: number
    depositAmount?: number
    paymentMethod?: string
    estimatedDelivery?: string
  }
}

let transporter: Transporter | null = null

/**
 * Crée et configure le transporteur SMTP
 */
function createTransporter(): Transporter {
  if (transporter) {
    return transporter
  }

  const config = useRuntimeConfig()
  
  transporter = nodemailer.createTransport({
    host: config.smtpHost as string,
    port: parseInt(config.smtpPort as string || '587'),
    secure: config.smtpSecure === 'true', // true pour SSL (port 465), false pour TLS (port 587)
    auth: {
      user: config.smtpUsername as string,
      pass: config.smtpPassword as string
    },
    tls: {
      rejectUnauthorized: false // Pour éviter les erreurs avec certains certificats
    }
  })

  return transporter!
}

/**
 * Envoie un email générique
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transport = createTransporter()
    const config = useRuntimeConfig()

    const mailOptions = {
      from: `"NS2PO" <${config.smtpUsername}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtmlTags(options.html) // Fallback text sécurisé
    }

    const result = await transport.sendMail(mailOptions)
    console.log('Email envoyé avec succès:', result.messageId)
    return true

  } catch (error) {
    console.error('Erreur envoi email:', error)
    return false
  }
}

/**
 * Envoie une notification de nouvelle commande à l'équipe NS2PO
 */
export async function sendOrderNotification(data: ContactNotificationData): Promise<boolean> {
  const subject = `🚀 Nouvelle ${getTypeLabel(data.type)} - ${data.reference}`
  
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouvelle demande NS2PO</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; max-width: 100% !important; }
          .content { padding: 15px !important; }
          .card { padding: 15px !important; margin-bottom: 15px !important; }
          .mobile-block { display: block !important; width: 100% !important; }
          .mobile-center { text-align: center !important; }
          .mobile-hide { display: none !important; }
          .table-responsive td { display: block !important; width: 100% !important; padding: 5px 0 !important; text-align: left !important; }
          .table-responsive .label { font-weight: bold !important; color: #64748b !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <header style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700;">NS2PO</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Nouvelle demande reçue</p>
        </header>
        
        <!-- Main Content -->
        <main class="content" style="padding: 20px; background: #f8fafc;">
          
          <!-- Alert Badge -->
          <div style="background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <strong>🚨 Action requise:</strong> Nouvelle ${getTypeLabel(data.type).toLowerCase()}
          </div>
          
          <!-- Request Details Card -->
          <div class="card" style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center;">
              📋 <span style="margin-left: 8px;">Détails de la demande</span>
            </h2>
            
            <table class="table-responsive" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td class="label" style="padding: 12px 0; font-weight: 600; color: #64748b; width: 30%; vertical-align: top;">Type:</td>
                <td style="padding: 12px 0;">${getTypeLabel(data.type)}</td>
              </tr>
              <tr>
                <td class="label" style="padding: 12px 0; font-weight: 600; color: #64748b; width: 30%; vertical-align: top;">Référence:</td>
                <td style="padding: 12px 0;">
                  <span style="font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; background: #f1f5f9; padding: 6px 10px; border-radius: 6px; font-size: 14px; font-weight: 600; color: #1e293b;">
                    ${data.reference}
                  </span>
                </td>
              </tr>
              <tr>
                <td class="label" style="padding: 12px 0; font-weight: 600; color: #64748b; width: 30%; vertical-align: top;">Sujet:</td>
                <td style="padding: 12px 0; font-weight: 500;">${data.subject}</td>
              </tr>
            </table>
          </div>

          <!-- Customer Info Card -->
          <div class="card" style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 18px; display: flex; align-items: center;">
              👤 <span style="margin-left: 8px;">Informations client</span>
            </h3>
            
            <table class="table-responsive" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td class="label" style="padding: 12px 0; font-weight: 600; color: #64748b; width: 30%; vertical-align: top;">Nom:</td>
                <td style="padding: 12px 0; font-weight: 500;">${data.customerName}</td>
              </tr>
              <tr>
                <td class="label" style="padding: 12px 0; font-weight: 600; color: #64748b; width: 30%; vertical-align: top;">Email:</td>
                <td style="padding: 12px 0;">
                  <a href="mailto:${data.customerEmail}" style="color: #2563eb; text-decoration: none; font-weight: 500; border-bottom: 1px solid #93c5fd;">
                    ${data.customerEmail}
                  </a>
                </td>
              </tr>
            </table>
          </div>

          <!-- Message Card -->
          <div class="card" style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px; display: flex; align-items: center;">
              💬 <span style="margin-left: 8px;">Message</span>
            </h3>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; line-height: 1.6; color: #374151;">
              ${data.message.replace(/\n/g, '<br>')}
            </div>
          </div>

          ${data.orderDetails ? `
          <div class="card" style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px; display: flex; align-items: center;">
              🛒 <span style="margin-left: 8px;">Détails de la commande</span>
            </h3>
            <pre style="background: #f1f5f9; padding: 20px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; color: #374151; border: 1px solid #e2e8f0;">
${JSON.stringify(data.orderDetails, null, 2)}
            </pre>
          </div>
          ` : ''}

          <!-- Tracking CTA -->
          <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 12px 0; color: #1e40af; font-weight: 600; font-size: 16px;">
              🔗 Lien de suivi de la demande
            </p>
            <a href="${getTrackingUrl(data.reference)}" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background-color 0.2s;">
              Voir le suivi en ligne
            </a>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b;">
              ${getTrackingUrl(data.reference)}
            </p>
          </div>
          
        </main>
        
        <!-- Footer -->
        <footer style="background: #374151; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px;">NS2PO</p>
          <p style="margin: 0 0 8px 0; color: #d1d5db; font-size: 14px;">Publicité et Promotion par l'Objet depuis 2011</p>
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">Email automatique - Ne pas répondre</p>
        </footer>
        
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: 'commercial@ns2po.ci',
    subject,
    html
  })
}

/**
 * Envoie une confirmation au client
 */
export async function sendCustomerConfirmation(data: ContactNotificationData): Promise<boolean> {
  const subject = `✅ Confirmation de votre demande - ${data.reference}`
  
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation NS2PO</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; max-width: 100% !important; }
          .content { padding: 15px !important; }
          .card { padding: 20px !important; margin-bottom: 15px !important; }
          .contact-list li { margin-bottom: 12px !important; }
          .contact-links { display: block !important; margin-top: 8px !important; }
          .tracking-url { font-size: 12px !important; word-break: break-all !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <header style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">NS2PO</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.95; font-size: 16px;">Confirmation de votre demande</p>
        </header>
        
        <!-- Main Content -->
        <main class="content" style="padding: 25px; background: #f8fafc;">
          
          <!-- Success Badge -->
          <div style="background: #ecfdf5; border: 1px solid #10b981; color: #065f46; padding: 12px 16px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
            <strong>✅ Demande reçue avec succès !</strong>
          </div>
          
          <!-- Welcome Message -->
          <div class="card" style="background: white; padding: 28px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
              Bonjour ${data.customerName},
            </h2>
            
            <p style="color: #475569; line-height: 1.7; font-size: 16px; margin-bottom: 20px;">
              Nous avons bien reçu votre demande de <strong style="color: #1e293b;">${getTypeLabel(data.type).toLowerCase()}</strong> 
              et nous vous en remercions sincèrement.
            </p>

            <!-- Reference Highlight -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #22c55e; padding: 20px; border-radius: 10px; margin: 25px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #166534; font-weight: 600; font-size: 16px;">
                📋 Référence de suivi
              </p>
              <span style="font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; background: white; padding: 8px 16px; border-radius: 8px; font-size: 18px; font-weight: 700; color: #1e293b; border: 1px solid #d1fae5; display: inline-block;">
                ${data.reference}
              </span>
            </div>

            <p style="color: #475569; line-height: 1.7; font-size: 16px;">
              Notre équipe commerciale va examiner votre demande et vous contacter dans les plus brefs délais 
              pour finaliser les détails et vous accompagner dans votre projet.
            </p>
          </div>

          <!-- Contact Information -->
          <div class="card" style="background: white; padding: 28px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
              📞 <span style="margin-left: 10px;">Nos contacts</span>
            </h3>
            
            <p style="color: #475569; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
              Pour toute question urgente ou complément d'information, notre équipe reste à votre disposition :
            </p>
            
            <ul class="contact-list" style="color: #475569; line-height: 1.8; padding-left: 0; list-style: none; margin: 0;">
              <li style="margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #10b981;">
                <span style="font-weight: 600; color: #1e293b;">📧 Email :</span><br>
                <a href="mailto:commercial@ns2po.ci" style="color: #2563eb; text-decoration: none; font-weight: 500; font-size: 16px;">commercial@ns2po.ci</a>
              </li>
              <li style="margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #10b981;">
                <span style="font-weight: 600; color: #1e293b;">📱 Téléphones :</span><br>
                <div class="contact-links">
                  <a href="tel:+2250575129737" style="color: #2563eb; text-decoration: none; font-weight: 500; margin-right: 15px;">+225 05 75 12 97 37</a>
                  <a href="tel:+2252721248803" style="color: #2563eb; text-decoration: none; font-weight: 500;">+225 27 21 24 88 03</a>
                </div>
              </li>
            </ul>
            
            <div style="background: #fffbeb; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                <strong>⏰ Heures d'ouverture :</strong> Lundi-Vendredi 8h-17h, Samedi 8h-12h
              </p>
            </div>
          </div>

          <!-- Tracking CTA -->
          <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 15px 0; color: #1e40af; font-weight: 600; font-size: 18px;">
              🔗 Suivez l'état de votre demande en temps réel
            </p>
            <a href="${getTrackingUrl(data.reference)}" 
               style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; margin-bottom: 12px; transition: background-color 0.2s;">
              Accéder au suivi
            </a>
            <p class="tracking-url" style="margin: 0; font-size: 13px; color: #64748b; word-break: break-all;">
              ${getTrackingUrl(data.reference)}
            </p>
          </div>
          
          <!-- Trust Badge -->
          <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              🏆 <strong>Votre partenaire de confiance depuis 2011</strong><br>
              Plus de 1000 clients satisfaits en Côte d'Ivoire
            </p>
          </div>
          
        </main>
        
        <!-- Footer -->
        <footer style="background: #374151; color: white; padding: 25px 20px; text-align: center;">
          <h4 style="margin: 0 0 10px 0; font-weight: 700; font-size: 18px;">NS2PO</h4>
          <p style="margin: 0 0 8px 0; color: #d1d5db; font-size: 14px;">Publicité et Promotion par l'Objet depuis 2011</p>
          <p style="margin: 0 0 8px 0; color: #d1d5db; font-size: 14px;">Abidjan, Côte d'Ivoire</p>
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">Ce message a été envoyé automatiquement</p>
        </footer>
        
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: data.customerEmail,
    subject,
    html
  })
}

/**
 * Utilitaires
 */
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    quote: 'Demande de devis',
    preorder: 'Pré-commande',
    custom: 'Demande sur-mesure',
    support: 'Support client',
    meeting: 'Demande de rendez-vous'
  }
  return labels[type] || 'Demande'
}

function getTrackingUrl(reference: string): string {
  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl || 'https://election.ns2po.ci'
  return `${baseUrl}/suivi/${reference}`
}

/**
 * Teste la configuration email
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transport = createTransporter()
    await transport.verify()
    console.log('✅ Configuration email valide')
    return true
  } catch (error) {
    console.error('❌ Erreur configuration email:', error)
    return false
  }
}