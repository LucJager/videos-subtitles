import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { videoId, templateId } = body

    const response = await fetch(
      `https://api.zapcap.ai/videos/${videoId}/task`,
      {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_ZAPCAP_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          autoApprove: true,
          language: 'fr', // Toujours en français
        }),
      }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur détaillée:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la tâche' },
      { status: 500 }
    )
  }
}
