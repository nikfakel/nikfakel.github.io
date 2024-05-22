import { Request, Response } from 'express';

import { sendMail } from '../util/sendMail';
import { clientsArray } from '../util/sessionUtil';
import { closeSession, startSession } from './sessionController';

export async function sendNotification(req: Request, res: Response) {
  const sessionName = process.env.WPP_SESSION;
  const phoneNumber = process.env.WHATSAPP_NUMBER;

  if (!phoneNumber) {
    return res.status(500).json({
      status: 'Error',
      message: 'No whatsapp number in .env file',
    });
  }

  if (!sessionName) {
    throw new Error('No session name in .env file');
    return res.status(500).json({
      status: 'Error',
      message: 'No session name in .env file',
    });
  }

  try {
    const { message, filename } = req.body;

    if (!message) {
      return res.status(500).json({
        status: 'Error',
        message: 'Отсутствует сообщение для отправки',
      });
    }

    if (!req.file?.path) {
      return res.status(500).json({
        status: 'Error',
        message: 'Не получен файл',
      });
    }

    await sendMail(message, filename, req.file.path);

    req.client = clientsArray[sessionName];
    const isConnected = await req.client.isConnected();

    // console.log('req.client?.status', req.client?.status, ' isConnected: ', isConnected);

    if (!isConnected || req.client?.status === 'DISCONNECTED') {
      req.session = sessionName;
      await closeSession(req, res);
      await startSession(req, res);
    }

    await req.client.sendText(phoneNumber, message);
    await req.client.sendFile(phoneNumber, req.file.path, {
      filename,
    });

    return res.status(200).json({ status: true, message: 'Message sent' });
  } catch (error) {
    console.log('error', error);
    return res.status(500).json({
      status: 'Error',
      message:
        'Не удалось отправить сообщение в whatsapp или на mail. Что то пошло не так',
      error,
    });
  }
}
