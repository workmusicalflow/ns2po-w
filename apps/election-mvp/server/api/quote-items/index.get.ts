/**
 * API Route pour récupérer les articles de devis depuis Airtable
 */

import { airtableService } from "../../../services/airtable";

export default defineEventHandler(async (_event) => {
  try {
    const quoteItems = await airtableService.getQuoteItems();

    return {
      success: true,
      data: quoteItems,
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des articles de devis:",
      error
    );

    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la récupération des articles de devis",
    });
  }
});
