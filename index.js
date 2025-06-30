require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/contact', async (req, res) => {
  const { name, email, business, websiteType, features, message, estimate } = req.body;

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
Estimated Price: ${estimate ? estimate + '€' : 'N/A'}

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

    // Auto-reply to customer (English)
    const autoReplyHTML = `
  <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #4CAF50;">CodedTogether</h2>
    <p>Dear ${name || 'Customer'},</p>

    <p>Thank you for contacting us and for your interest in building your website. We have received your request and will process it promptly.</p>

    <h3 style="margin-top: 30px;">💳 Payment Information</h3>
    <p>You will soon receive a custom offer with the total cost and payment details. Work will begin as soon as the deposit is confirmed.</p>

    <h3 style="margin-top: 30px;">🚀 What Happens Next</h3>
    <ul>
      <li>Once payment is completed, we will begin working on your website immediately.</li>
      <li>You’ll receive updates at each milestone or if we need additional information.</li>
      <li>Our team is available for any questions you may have.</li>
    </ul>

    <h3>🧮 Estimated Cost</h3>
    <p><strong>${estimate ? estimate + '€' : 'To be determined'}</strong></p>


    <p style="margin-top: 40px;">Best regards,<br><strong>The CodedTogether Team</strong></p>
    <hr style="margin-top: 30px;" />
    <p style="font-size: 12px; color: #888;">
      This is an automated message confirming that we received your request.
    </p>
  </div>
`;


    await transporter.sendMail({
      from: `"Website Order" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Confirmation of Request Received – Website Development',
      html: autoReplyHTML,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));