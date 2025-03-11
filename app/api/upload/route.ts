import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const response = await fetch('https://api.zapcap.ai/videos', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_ZAPCAP_API_KEY || '',
      },
      body: formData,
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur détaillée:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    )
  }
}
