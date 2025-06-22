require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/contact', async (req, res) => {
  const { name, email, business, websiteType, features, message } = req.body;

  if (!name || !email || !websiteType || !message)
    return res.status(400).json({ error: 'Required fields are missing.' });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailBody = `
New Custom Website Order

Name: ${name}
Email: ${email}
Business/Organization: ${business || 'N/A'}
Website Type: ${websiteType}
Desired Features: ${features || 'N/A'}

Message:
${message}
    `;

    await transporter.sendMail({
      from: `"Website Order" <${process.env.EMAIL_USER}>`,
      to: process.env.TO_EMAIL,
      subject: `New Website Order from ${name}`,
      text: mailBody,
      replyTo: email,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));