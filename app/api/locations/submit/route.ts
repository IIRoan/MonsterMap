export const runtime = 'edge'
import { createClient } from '@clickhouse/client';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const client = createClient({
  url: process.env.CLICKHOUSE_HOST!,
  username: process.env.CLICKHOUSE_USER!,
  password: process.env.CLICKHOUSE_PASSWORD!
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Check for existing location
    const existingResult = await client.query({
      query: `
        SELECT location_id
        FROM locations
        WHERE name = {name:String}
        AND address = {address:String}
        AND latitude = {latitude:Float64}
        AND longitude = {longitude:Float64}
        LIMIT 1
      `,
      query_params: {
        name: body.name,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude
      },
      format: 'JSONEachRow'
    });

    const existingData: { location_id: string }[] = await existingResult.json();
    const locationId = existingData[0]?.location_id || uuidv4();

    if (!existingData[0]) {
      await client.insert({
        table: 'locations',
        values: [{
          location_id: locationId,
          name: body.name,
          address: body.address,
          latitude: body.latitude,
          longitude: body.longitude,
          created_at: currentDate
        }],
        format: 'JSONEachRow'
      });
    }

    await client.insert({
      table: 'location_submissions',
      values: [{
        submission_id: uuidv4(),
        location_id: locationId,
        submitted_by: 'anonymous',
        submission_time: currentDate,
        is_update: existingData[0] ? 1 : 0,
        variants: body.variants,
        price_range: '',
        opening_hours: '',
        notes: ''
      }],
      format: 'JSONEachRow'
    });

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

    for (const variant of body.variants) {
      if (!existingVariantNames.includes(variant)) {
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
      } else {
        await client.exec({
          query: `
            ALTER TABLE location_variants
            UPDATE
            last_confirmed_by = 'anonymous',
            last_confirmed_at = now(),
            confirmation_count = confirmation_count + 1
            WHERE location_id = {location_id:String}
            AND variant_name = {variant_name:String}
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
    console.error('Error submitting location:', error);
    return NextResponse.json({ error: 'Failed to submit location' }, { status: 500 });
  }
}