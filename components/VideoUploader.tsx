'use client'

import { useState, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'
import templates from '@/resources/template-choisi.json'

interface TasksProgress {
  [key: string]: {
    status: string
    downloadUrl?: string
    language: string
    templateId: string
  }
}

export function VideoUploader() {
  // État pour contrôler le rendu côté client
  const [isClient, setIsClient] = useState(false)

  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState({
    upload: 'pending',
    createSubtitles: 'pending',
    progress: 'pending',
    finish: 'pending',
    download: 'pending',
  } as Record<string, 'pending' | 'loading' | 'completed' | 'error'>)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string>('')
  // Nouvel état pour le nombre de templates à utiliser
  const [templateCount, setTemplateCount] = useState<number>(2)

  // Nouvel état pour suivre plusieurs tâches
  const [tasks, setTasks] = useState<TasksProgress>({})

  // Ajout d'un état pour suivre si toutes les vidéos sont prêtes
  const [allVideosReady, setAllVideosReady] = useState(false)

  // Remplacer la configuration des langues par les templates
  // Ajout d'un useEffect pour recalculer les templates quand templateCount change
  useEffect(() => {
    // Cette fonction sera exécutée chaque fois que templateCount change
    console.log(`Nombre de templates sélectionnés: ${templateCount}`)
  }, [templateCount])

  // La variable selectedTemplates est recalculée à chaque rendu du composant
  const selectedTemplates = templates
    .slice(0, templateCount)
    .map((templateId, index) => ({
      id: templateId,
      label: `Style ${index + 1}`,
    }))

  // Effet pour marquer que nous sommes côté client
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile)
      await handleUpload(droppedFile)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      await handleUpload(selectedFile)
    }
  }

  const handleUpload = async (videoFile: File) => {
    setError(null)
    setUploading(true)
    setSteps((prev) => ({ ...prev, upload: 'loading' }))

    try {
      // Step 1: Upload a Video
      // Example:
      // curl -X POST "https://api.zapcap.ai/videos" \
      // -H "x-api-key: YOUR_API_KEY" \
      // -H "Content-Type: multipart/form-data" \
      // -F "file=@/path/to/your/video.mp4"
      // REPONSE: {"id":"f94a4db2-1b24-41c5-9146-d763b4af8d87","status":"uploaded","storageId":"e7204c34-5c0a-4300-bb80-1ddc592e38bf"}%

      console.log('API ici : ', process.env.NEXT_PUBLIC_ZAPCAP_API_KEY)

      const formData = new FormData()
      formData.append('file', videoFile)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Erreur HTTP: ${uploadResponse.status}`)
      }

      const uploadData = await uploadResponse.json()
      console.log('Réponse upload:', uploadData)
      setSteps((prev) => ({
        ...prev,
        upload: 'completed',
        createSubtitles: 'loading',
      }))

      // Step 2: Création de la tâche
      // 2. Create video task
      // Example:
      // curl -X POST "https://api.zapcap.ai/videos/YOUR_VIDEO_ID/task" \
      // -H "x-api-key: YOUR_API_KEY" \
      // -H "Content-Type: application/json" \
      // -d '{
      //   "templateId": "YOUR_TEMPLATE_ID",
      //   "autoApprove": true,
      //   "language": "en"
      // }'
      // REPONSE : {"taskId":"76ae1115-8227-40fb-b74f-06414ef45325"}%
      const taskPromises = selectedTemplates.map(async (template) => {
        const taskResponse = await fetch('/api/videos/task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoId: uploadData.id,
            templateId: template.id,
            // La langue est toujours en français
            language: 'fr',
          }),
        })

        if (!taskResponse.ok) {
          throw new Error(`Erreur HTTP: ${taskResponse.status}`)
        }

        const taskData = await taskResponse.json()
        return {
          taskId: taskData.taskId,
          templateId: template.id,
          label: template.label,
          status: 'pending',
        }
      })

      // Attendre que toutes les tâches soient créées
      const createdTasks = await Promise.all(taskPromises)

      // Initialiser l'état des tâches
      const initialTasks = createdTasks.reduce((acc, task) => {
        acc[task.taskId] = {
          status: 'pending',
          language: 'fr',
          templateId: task.templateId,
        }
        return acc
      }, {} as TasksProgress)

      setTasks(initialTasks)
      setSteps((prev) => ({
        ...prev,
        createSubtitles: 'completed',
        progress: 'loading',
      }))

      // Ici, vous pourriez ajouter la logique pour suivre la progression
      // en utilisant le taskId retourné dans taskData

      // ===============================
      // 3. Get video task status
      // Example:
      // curl -X GET "https://api.zapcap.ai/videos/YOUR_VIDEO_ID/task/YOUR_TASK_ID" \
      // -H "x-api-key: YOUR_API_KEY"

      console.log('video id : ', uploadData.id)
      console.log('createdTasks : ', createdTasks)

      // Fonction pour vérifier le statut
      const checkStatus = async (videoId: string, taskId: string) => {
        const response = await fetch(`/api/videos/task/${videoId}/${taskId}`)
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }
        return await response.json()
      }

      // Mise à jour de l'effet de polling pour vérifier si toutes les vidéos sont prêtes
      const pollAllTasks = async () => {
        const interval = setInterval(async () => {
          let allCompleted = true

          for (const task of createdTasks) {
            try {
              const status = await checkStatus(uploadData.id, task.taskId)

              console.log('status : ', status)

              setTasks((prev) => ({
                ...prev,
                [task.taskId]: {
                  ...prev[task.taskId],
                  status: status.status,
                  downloadUrl: status.downloadUrl,
                },
              }))

              if (status.status !== 'completed') {
                allCompleted = false
              }
            } catch (error) {
              console.error(`Erreur pour la tâche ${task.taskId}:`, error)
              allCompleted = false
            }
          }

          if (allCompleted) {
            clearInterval(interval)
            setAllVideosReady(true) // Marquer que toutes les vidéos sont prêtes
            setSteps((prev) => ({
              ...prev,
              progress: 'completed',
              finish: 'completed',
              download: 'completed',
            }))
          }
        }, 5000)

        return () => clearInterval(interval)
      }

      pollAllTasks()
    } catch (error: unknown) {
      console.error("Erreur lors de l'upload:", error)
      setError("Une erreur est survenue lors de l'upload")
      setSteps((prev) => ({
        ...prev,
        upload: prev.upload === 'loading' ? 'error' : prev.upload,
        createSubtitles:
          prev.createSubtitles === 'loading' ? 'error' : prev.createSubtitles,
        progress: prev.progress === 'loading' ? 'error' : prev.progress,
      }))
    } finally {
      setUploading(false)
    }
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'loading':
        return 'bg-yellow-500 animate-pulse'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Fonction pour créer un fichier ZIP avec toutes les vidéos
  const downloadAllAsZip = async () => {
    try {
      // Vérifier si JSZip est disponible
      if (typeof window !== 'undefined') {
        // Import dynamique de JSZip
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()

        // Ajouter chaque vidéo au ZIP
        const downloadPromises = Object.values(tasks)
          .filter((task) => task.status === 'completed' && task.downloadUrl)
          .map(async (task, index) => {
            try {
              const response = await fetch(task.downloadUrl as string)
              const blob = await response.blob()
              const templateInfo = selectedTemplates.find(
                (t) => t.id === task.templateId
              )
              const fileName = `video-${
                templateInfo?.label || `style-${index + 1}`
              }.mp4`

              zip.file(fileName, blob)
              return true
            } catch (error) {
              console.error(
                `Erreur lors du téléchargement de la vidéo ${task.templateId}:`,
                error
              )
              return false
            }
          })

        await Promise.all(downloadPromises)

        // Générer le ZIP
        const content = await zip.generateAsync({ type: 'blob' })

        // Créer un lien de téléchargement pour le ZIP
        const link = document.createElement('a')
        link.href = URL.createObjectURL(content)
        link.download = 'toutes-les-videos.zip'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Erreur lors de la création du ZIP:', error)
      setError(
        'Impossible de créer le fichier ZIP. Veuillez télécharger les vidéos individuellement.'
      )
    }
  }

  // Conditionner le rendu
  if (!isClient) {
    return (
      <div className="border-2 border-dashed rounded-lg p-8 text-center transition-colors border-gray-600">
        Chargement...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <label
          htmlFor="template-count"
          className="block text-sm font-medium mb-2"
        >
          Nombre de styles de sous-titres: {templateCount}
        </label>
        <div className="relative">
          <input
            type="range"
            id="template-count"
            min="1"
            max="10"
            value={templateCount}
            onChange={(e) => setTemplateCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={
              {
                '--thumb-size': '18px',
                '--thumb-color': '#3b82f6',
              } as React.CSSProperties
            }
          />
          <style jsx>{`
            input[type='range']::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: var(--thumb-size);
              height: var(--thumb-size);
              border-radius: 50%;
              background: var(--thumb-color);
              cursor: pointer;
              border: 2px solid white;
            }
            input[type='range']::-moz-range-thumb {
              width: var(--thumb-size);
              height: var(--thumb-size);
              border-radius: 50%;
              background: var(--thumb-color);
              cursor: pointer;
              border: 2px solid white;
            }
          `}</style>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <div
        className={twMerge(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600',
          'hover:border-blue-400'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
          id="video-input"
        />

        <label
          htmlFor="video-input"
          className="flex flex-col items-center cursor-pointer"
        >
          <svg
            className="w-12 h-12 mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div className="space-y-2">
            <p className="text-lg">
              {uploading
                ? 'Upload en cours...'
                : 'Glissez votre vidéo ici ou cliquez pour sélectionner'}
            </p>
            {file && (
              <p className="text-sm text-gray-400">
                Fichier sélectionné : {file.name}
              </p>
            )}
          </div>
        </label>
      </div>

      {videoUrl && (
        <div className="mt-4 space-y-4">
          <h3 className="text-lg font-semibold mb-2">Vidéo uploadée :</h3>
          <video
            controls
            className="w-full max-w-2xl mx-auto rounded-lg"
            src={videoUrl}
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>

          {downloadUrl && (
            <div className="flex justify-center">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                download
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Télécharger la vidéo
              </a>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {file && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Progression des styles de sous-titres :
            </h3>

            {/* Bouton pour tout télécharger */}
            {Object.values(tasks).some(
              (task) => task.status === 'completed' && task.downloadUrl
            ) && (
              <button
                onClick={downloadAllAsZip}
                disabled={!allVideosReady}
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center ${
                  allVideosReady
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-blue-500/50 cursor-not-allowed'
                }`}
                title={
                  allVideosReady
                    ? 'Télécharger toutes les vidéos'
                    : 'Attendez que toutes les vidéos soient prêtes'
                }
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {allVideosReady ? 'Télécharger tout (ZIP)' : 'En attente...'}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {Object.entries(tasks).map(([taskId, task]) => (
              <div key={taskId} className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    task.status === 'completed'
                      ? 'bg-green-500'
                      : task.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-yellow-500 animate-pulse'
                  }`}
                />
                <span className="text-sm">
                  {selectedTemplates.find((t) => t.id === task.templateId)
                    ?.label ||
                    `Style ${Object.keys(tasks).indexOf(taskId) + 1}`}
                </span>
                <span className="text-sm text-yellow-500 italic">
                  ({task.status})
                </span>
                {task.downloadUrl && (
                  <a
                    href={task.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-400 ml-2"
                    download
                  >
                    Télécharger
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
