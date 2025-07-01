require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


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

app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body; // ποσό σε cents, πχ 5000 = 50€

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { v4: uuidv4 } = require("uuid");

const PDFDocument = require("pdfkit");

// Τιμές & πακέτα σταθερά (ακριβώς ίδια με frontend!)
const options = {
  "Landing Page (1–2 pages)": 400,
  "Contact Form with Backend": 60,
  "SEO Optimization & Setup": 120,
  "Responsive Design (Mobile & Tablet)": 0,
  "Admin Panel (Dashboard)": 250,
  "Blog / CMS Integration": 180,
  "Multilingual Site (GR/EN)": 150,
  "Hosting + Domain Setup": 90,
  "E-shop (with payments)": 1200,
  "Dark Mode + UI Polish": 80,
};

const packages = {
  Basic: [
    "Landing Page (1–2 pages)",
    "Contact Form with Backend",
    "Responsive Design (Mobile & Tablet)",
  ],
  Business: [
    "Landing Page (1–2 pages)",
    "Contact Form with Backend",
    "Responsive Design (Mobile & Tablet)",
    "SEO Optimization & Setup",
    "Blog / CMS Integration",
    "Dark Mode + UI Polish",
    "Hosting + Domain Setup",
  ],
  Pro: [
    "Landing Page (1–2 pages)",
    "Contact Form with Backend",
    "Responsive Design (Mobile & Tablet)",
    "SEO Optimization & Setup",
    "Dark Mode + UI Polish",
    "Hosting + Domain Setup",
    "Admin Panel (Dashboard)",
    "Multilingual Site (GR/EN)",
    "E-shop (with payments)",
  ],
};

// Endpoint για έλεγχο τιμής πακέτου
app.post('/get-package-price', (req, res) => {
  const { packageName } = req.body;
  if (!packageName || !packages[packageName]) {
    return res.status(400).json({ error: "Invalid package name" });
  }
  const features = packages[packageName];
  const amount = features.reduce((sum, feat) => sum + (options[feat] || 0), 0);
  res.json({ amount });
});

// Τροποποίηση του /send-order-email για PDF απόδειξη
app.post("/send-order-email", async (req, res) => {
  const { email, packageName, amount } = req.body;

  if (!email || !packageName || !amount) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const orderId = uuidv4();

    // Δημιουργία PDF απόδειξης στη μνήμη
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const adminMailBody = `
New Website Order Paid<br/>
<br/>
<b>Order ID:</b> ${orderId}<br/>
<b>Customer email:</b> ${email}<br/>
<b>Package:</b> ${packageName}<br/>
<b>Amount Paid:</b> ${amount}€
<br/><br/>
Please contact the customer to proceed.
`;

      const customerMailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333; padding: 20px; }
    .container { background-color: white; border-radius: 8px; padding: 20px; max-width: 600px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    h2 { color: #4CAF50; }
    p { font-size: 16px; }
    .footer { margin-top: 30px; font-size: 14px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Thank you for your purchase!</h2>
    <p>Dear Customer,</p>
    <p>We have received your payment for the <b>${packageName}</b> package.</p>
    <p><b>Order ID:</b> ${orderId}</p>
    <p><b>Amount Paid:</b> ${amount}€</p>
    <p>We will contact you shortly to start working on your project.</p>
    <p>If you have any questions, feel free to reply to this email.</p>
    <div class="footer">
      Best regards,<br/>
      The CodedTogether Team
    </div>
  </div>
</body>
</html>
`;

      // Στέλνουμε mail στον admin
      await transporter.sendMail({
        from: `"Website Orders" <${process.env.EMAIL_USER}>`,
        to: process.env.TO_EMAIL,
        subject: `New Paid Order: ${packageName} (Order ID: ${orderId})`,
        html: adminMailBody.replace(/\n/g, "<br/>"),
        replyTo: email,
      });

      // Στέλνουμε mail στον πελάτη με PDF συνημμένο
      await transporter.sendMail({
        from: `"CodedTogether" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Thank you for your purchase! (Order ID: ${orderId})`,
        html: customerMailBody,
        attachments: [
          {
            filename: `Invoice-${orderId}.pdf`,
            content: pdfData,
            contentType: 'application/pdf',
          },
        ],
      });

      res.json({ success: true, orderId });
    });

    // Δημιουργία περιεχομένου PDF
    doc.fontSize(20).text('Invoice / Απόδειξη', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Order ID: ${orderId}`);
    doc.text(`Package: ${packageName}`);
    doc.text(`Amount Paid: ${amount}€`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text('Thank you for your purchase! We will contact you shortly to start your project.');
    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send notification email." });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));