import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  if (!process.env.STADIA_MAPS_API_KEY) {
    return new Response('Stadia Maps API key is not configured', { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const z = searchParams.get('z')
  const x = searchParams.get('x')
  const y = searchParams.get('y')
  const r = searchParams.get('r') || ''

  if (!z || !x || !y) {
    return new Response('Missing required parameters', { status: 400 })
  }

  try {
    const response = await fetch(
      `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/${z}/${x}/${y}${r}.png`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.STADIA_MAPS_API_KEY}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Stadia Maps returned ${response.status}`)
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Error fetching map tiles:', error)
    return new Response('Error fetching map tiles', { status: 500 })
  }
}

