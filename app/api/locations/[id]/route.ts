import { createClient } from '@clickhouse/client';
import { NextResponse } from 'next/server';

const client = createClient({
  url: process.env.CLICKHOUSE_HOST!,
  username: process.env.CLICKHOUSE_USER!,
  password: process.env.CLICKHOUSE_PASSWORD!
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const locationId = params.id;
    const body = await request.json();
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Update location details
    if (body.name || body.address || body.coordinates) {
      await client.exec({
        query: `
          ALTER TABLE locations
          UPDATE
          name = if({name:String} != '', {name:String}, name),
          address = if({address:String} != '', {address:String}, address),
          latitude = if({latitude:Float64} != 0, {latitude:Float64}, latitude),
          longitude = if({longitude:Float64} != 0, {longitude:Float64}, longitude)
          WHERE location_id = {location_id:String}
        `,
        query_params: {
          location_id: locationId,
          name: body.name || '',
          address: body.address || '',
          latitude: body.coordinates?.[0] || 0,
          longitude: body.coordinates?.[1] || 0
        }
      });
    }

    // Handle variants updates if provided
    if (Array.isArray(body.variants)) {
      // Get existing variants
      const existingVariantsResult = await client.query({
        query: `
          SELECT variant_name
          FROM location_variants
          WHERE location_id = {location_id:String}
        `,
        query_params: { location_id: locationId },
        format: 'JSONEachRow'
      });

      const existingVariants = await existingVariantsResult.json();
      const existingVariantNames = existingVariants.map((v: any) => v.variant_name);

      // Add new variants
      const newVariants = body.variants.filter((v: string) => !existingVariantNames.includes(v));
      for (const variant of newVariants) {
        await client.insert({
          table: 'location_variants',
          values: [{
            location_id: locationId,
            variant_name: variant,
            first_reported_by: 'anonymous',
            first_reported_at: currentDate,
            last_confirmed_by: 'anonymous',
            last_confirmed_at: currentDate,
            confirmation_count: 1
          }],
          format: 'JSONEachRow'
        });
      }

      // Remove variants that are no longer present
      const removedVariants = existingVariantNames.filter(v => !body.variants.includes(v));
      for (const variant of removedVariants) {
        await client.exec({
          query: `
            ALTER TABLE location_variants
            DELETE WHERE
            location_id = {location_id:String} AND
            variant_name = {variant_name:String}
          `,
          query_params: {
            location_id: locationId,
            variant_name: variant
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}