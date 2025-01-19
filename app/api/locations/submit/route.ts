import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import sql from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentDate = new Date();

    return await sql.begin(async (sql) => {
      // Check existing location
      const existingLocation = await sql<{ location_id: string }[]>`
        SELECT location_id
        FROM locations
        WHERE name = ${body.name}
        AND address = ${body.address}
        AND latitude = ${Number(body.latitude)}
        AND longitude = ${Number(body.longitude)}
        LIMIT 1
      `;

      const locationId = existingLocation[0]?.location_id || uuidv4();

      if (!existingLocation[0]) {
        await sql`
          INSERT INTO locations (
            location_id, name, address, latitude, longitude, created_at
          ) VALUES (
            ${locationId},
            ${body.name},
            ${body.address},
            ${Number(body.latitude)},
            ${Number(body.longitude)},
            ${currentDate}
          )
        `;
      }

      await sql`
        INSERT INTO location_submissions (
          submission_id, location_id, submitted_by, submission_time,
          is_update, variants, price_range, opening_hours, notes
        ) VALUES (
          ${uuidv4()},
          ${locationId},
          'anonymous',
          ${currentDate},
          ${existingLocation[0] ? 1 : 0},
          ${body.variants}::text[],
          '',
          '',
          ''
        )
      `;

      const existingVariants = await sql<{ variant_name: string }[]>`
        SELECT variant_name
        FROM location_variants
        WHERE location_id = ${locationId}
      `;

      const existingVariantNames = existingVariants.map(v => v.variant_name);

      for (const variant of body.variants) {
        if (!existingVariantNames.includes(variant)) {
          await sql`
            INSERT INTO location_variants (
              location_id, variant_name, first_reported_by,
              first_reported_at, last_confirmed_by, last_confirmed_at,
              confirmation_count
            ) VALUES (
              ${locationId},
              ${variant},
              'anonymous',
              ${currentDate},
              'anonymous',
              ${currentDate},
              1
            )
          `;
        } else {
          await sql`
            UPDATE location_variants
            SET
              last_confirmed_by = 'anonymous',
              last_confirmed_at = ${currentDate},
              confirmation_count = confirmation_count + 1
            WHERE location_id = ${locationId}
            AND variant_name = ${variant}
          `;
        }
      }

      return NextResponse.json({ success: true });
    });

  } catch (error) {
    console.error('Error submitting location:', error);
    return NextResponse.json({ error: 'Failed to submit location' }, { status: 500 });
  }
}