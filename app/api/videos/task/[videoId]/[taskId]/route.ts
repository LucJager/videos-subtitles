import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string; taskId: string }> }
) {
  try {
    // Utiliser await pour accéder aux paramètres comme recommandé par Next.js
    const { videoId, taskId } = await params

    const response = await fetch(
      `https://api.zapcap.ai/videos/${videoId}/task/${taskId}`,
      {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_ZAPCAP_API_KEY || '',
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur détaillée:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    )
  }
}
