import Image from 'next/image'
import { VideoUploader } from '@/components/VideoUploader'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">
          ZapCap Video Upload
        </h1>

        <div className="max-w-2xl mx-auto">
          <VideoUploader />

          <div className="mt-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Instructions :</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Format accepté : MP4, MOV, AVI</li>
              <li>Taille maximale : 100MB</li>
              <li>Durée maximale : 5 minutes</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
