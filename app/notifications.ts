import axios from 'axios'

export const sendWhatsappNotification = async (message: string) => {
  await axios.post('http://localhost:21465/api/send-notification', {
    message
  })
}
