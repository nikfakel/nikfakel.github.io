import fs from 'fs/promises';
import nodemailer from 'nodemailer';
import { Options } from 'nodemailer/lib/mailer';

export const sendMail = async (
  message: string,
  filename: string,
  filePath: string
) => {
  const emailLogin = process.env.EMAIL_LOGIN;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailTo = process.env.EMAIL_TO;
  if (!emailLogin || !emailPassword || !emailTo) {
    throw new Error('No email login or password');
  }

  const fileBuffer = await fs.readFile(filePath);

  const transporter = nodemailer.createTransport({
    service: 'Hotmail',
    auth: {
      user: emailLogin,
      pass: emailPassword,
    },
  });

  const mailOptions: Options = {
    from: emailLogin,
    to: emailTo,
    subject: 'Уведомление о продаже',
    text: message,
    attachments: [
      {
        filename: filename,
        content: fileBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  console.log('Sending mail');
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};
