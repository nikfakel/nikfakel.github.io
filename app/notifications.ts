import axios from 'axios'

export const sendWhatsappNotification = async (message: string, filename: string, file: Blob) => {
  const formData = new FormData()
  formData.append('message', message)
  formData.append('filename', filename)
  formData.append('file', file)
  await axios.post('http://localhost:21465/api/send-notification',
    formData,
    { headers: {
      'Content-Type': 'multipart/form-data'
    }}
  )
}
