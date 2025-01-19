import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const locationId = params.id;
    const body = await request.json();
    const currentDate = new Date();

    await sql.begin(async (sql) => {
      if (body.name || body.address || body.coordinates) {
        const latitude = body.coordinates?.[0] ? Number(body.coordinates[0]) : null;
        const longitude = body.coordinates?.[1] ? Number(body.coordinates[1]) : null;
        
        await sql`
          UPDATE locations
          SET
            name = COALESCE(NULLIF(${body.name || ''}, ''), name),
            address = COALESCE(NULLIF(${body.address || ''}, ''), address),
            latitude = COALESCE(${latitude}, latitude),
            longitude = COALESCE(${longitude}, longitude)
          WHERE location_id = ${locationId}
        `;
      }

      if (Array.isArray(body.variants)) {
        const existingVariants = await sql<{ variant_name: string }[]>`
          SELECT variant_name
          FROM location_variants
          WHERE location_id = ${locationId}
        `;
        
        const existingVariantNames = existingVariants.map(v => v.variant_name);
        const newVariants = body.variants.filter((v: string) => !existingVariantNames.includes(v));
        const removedVariants = existingVariantNames.filter(v => !body.variants.includes(v));

        for (const variant of newVariants) {
          await sql`
            INSERT INTO location_variants
            (location_id, variant_name, first_reported_by, first_reported_at, last_confirmed_by, last_confirmed_at, confirmation_count)
            VALUES
            (${locationId}, ${variant}, 'anonymous', ${currentDate}, 'anonymous', ${currentDate}, 1)
          `;
        }

        if (removedVariants.length > 0) {
          await sql`
            DELETE FROM location_variants
            WHERE location_id = ${locationId}
            AND variant_name = ANY(${removedVariants})
          `;
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}