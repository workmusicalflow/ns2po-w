import type { CommercialContact, TursoCommercialContact } from "@ns2po/types";

/**
 * Transforme les données brutes de Turso en format API
 */
function transformTursoToCommercialContact(
  tursoContact: TursoCommercialContact
): CommercialContact {
  let specialties: string[] = [];
  let availabilityHours: CommercialContact["availabilityHours"] = {};

  // Parse JSON fields safely
  try {
    if (tursoContact.specialties) {
      specialties = JSON.parse(tursoContact.specialties);
    }
  } catch (error) {
    console.warn(
      `Failed to parse specialties for contact ${tursoContact.id}:`,
      error
    );
  }

  try {
    if (tursoContact.availability_hours) {
      availabilityHours = JSON.parse(tursoContact.availability_hours);
    }
  } catch (error) {
    console.warn(
      `Failed to parse availability_hours for contact ${tursoContact.id}:`,
      error
    );
  }

  return {
    id: tursoContact.id,
    name: tursoContact.name,
    role: tursoContact.role as CommercialContact["role"],
    mobilePhone: tursoContact.mobile_phone,
    fixedPhone: tursoContact.fixed_phone || undefined,
    email: tursoContact.email || undefined,
    specialties,
    availabilityHours,
    isActive: Boolean(tursoContact.is_active),
    createdAt: tursoContact.created_at,
    updatedAt: tursoContact.updated_at,
  };
}

export default defineEventHandler(
  async (event): Promise<CommercialContact[]> => {
    try {
      console.log("🔄 Récupération des contacts commerciaux depuis Turso...");

      // Direct Turso client connection (pattern from products/turso.get.ts)
      const { createClient } = await import("@libsql/client");

      const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });

      // Query raw data from Turso
      const result = await client.execute(`
        SELECT 
          id, name, role, mobile_phone, fixed_phone, email, 
          specialties, availability_hours, is_active, 
          created_at, updated_at
        FROM commercial_contacts 
        WHERE is_active = 1 
        ORDER BY 
          CASE role 
            WHEN 'sales' THEN 1 
            WHEN 'manager' THEN 2 
            WHEN 'support' THEN 3 
          END,
          name ASC
      `);

      console.log(
        `📊 Trouvé ${result.rows.length} contacts commerciaux actifs`
      );

      // Transform raw data to API format
      const contacts = result.rows.map((row: any) => {
        const tursoContact: TursoCommercialContact = {
          id: row.id as string,
          name: row.name as string,
          role: row.role as string,
          mobile_phone: row.mobile_phone as string,
          fixed_phone: row.fixed_phone as string,
          email: row.email as string,
          specialties: row.specialties as string,
          availability_hours: row.availability_hours as string,
          is_active: row.is_active as number,
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
        };

        return transformTursoToCommercialContact(tursoContact);
      });

      console.log(
        `✅ API Contacts: ${contacts.length} contacts transformés et prêts`
      );

      // Cache for 10 minutes (contacts don't change often)
      setHeader(event, "Cache-Control", "public, max-age=600");

      return contacts;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des contacts commerciaux:",
        error
      );
      throw createError({
        statusCode: 500,
        statusMessage:
          "Erreur lors de la récupération des contacts commerciaux",
      });
    }
  }
);
