import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const storageService = {
  // Compress image client-side to < 500 KB (max 1 MB) using HTML5 Canvas
  async compressImage(file: File, maxSizeBytes: number = 500 * 1024): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Maximum dimension constraint (e.g. 1024x1024)
          const MAX_DIM = 1024
          if (width > height && width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width)
            width = MAX_DIM
          } else if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height)
            height = MAX_DIM
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to obtain canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Try progressive quality compression until under maxSizeBytes
          let quality = 0.85
          const attemptCompression = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Canvas toBlob failed'))
                  return
                }

                if (blob.size <= maxSizeBytes || quality <= 0.3) {
                  resolve(blob)
                } else {
                  quality -= 0.15
                  attemptCompression()
                }
              },
              'image/jpeg',
              quality
            )
          }

          attemptCompression()
        }
        img.onerror = (err) => reject(err)
      }
      reader.onerror = (err) => reject(err)
    })
  },

  // Upload compressed avatar to private profile-photos bucket
  async uploadProfilePhoto(
    userId: string,
    file: File
  ): Promise<{ url: string | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      // In demo mode, return an object URL or simulated path
      return { url: URL.createObjectURL(file), error: null }
    }

    try {
      // Compress image first
      const compressedBlob = await this.compressImage(file, 500 * 1024)
      const filePath = `${userId}/avatar_${Date.now()}.jpg`

      // Upload to profile-photos bucket
      const { data, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (uploadError) {
        return { url: null, error: uploadError }
      }

      // Generate signed URL (valid for 1 year = 31536000 seconds)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('profile-photos')
        .createSignedUrl(data.path, 31536000)

      if (signedError || !signedData?.signedUrl) {
        return { 
          url: null, 
          error: signedError || new Error('Could not generate private signed URL for photograph.') 
        }
      }

      return { url: signedData.signedUrl, error: null }
    } catch (err: unknown) {
      return { url: null, error: err instanceof Error ? err : new Error(String(err)) }
    }
  }
}
