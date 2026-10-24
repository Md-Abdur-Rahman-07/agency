const nodemailer = require('nodemailer');

const RECIPIENT_EMAIL = 'contact.orbitwick@gmail.com';

const SERVICES = [
  'UI/UX & Graphic Design',
  'Full-Stack Web Development',
  'Mobile App Development',
  'Cybersecurity Services',
  'Website Management & Maintenance',
  'Website Revamp & Rebranding',
  'CMS & E-commerce Development'
];

const TIMELINES = [
  '',
  'As soon as possible',
  'Within 1 month',
  '1–3 months',
  '3–6 months',
  'Flexible / not sure yet'
];

function textLength(value) {
  return Array.from(value).length;
}

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function singleLine(value) {
  return asString(value).replace(/[\r\n]+/g, ' ');
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidWebsite(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function respond(res, status, payload) {
  return res.status(status).json(payload);
}

module.exports = async function contactHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respond(res, 405, {
      success: false,
      message: 'Method not allowed.'
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return respond(res, 400, {
        success: false,
        message: 'Invalid request body.'
      });
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    body = {};
  }

  // Honeypot field: silently ignore automated spam submissions.
  if (asString(body.website_confirm) !== '') {
    return respond(res, 200, { success: true });
  }

  const name = singleLine(body.name);
  const email = singleLine(body.email);
  const company = singleLine(body.company);
  const website = singleLine(body.website);
  const service = singleLine(body.service);
  const timeline = singleLine(body.timeline);
  const message = asString(body.message);

  const valid = name !== ''
    && textLength(name) <= 120
    && isValidEmail(email)
    && textLength(company) <= 160
    && isValidWebsite(website)
    && SERVICES.includes(service)
    && TIMELINES.includes(timeline)
    && message !== ''
    && textLength(message) <= 5000;

  if (!valid) {
    return respond(res, 400, {
      success: false,
      message: 'Please check the form fields and try again.'
    });
  }

  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USERNAME || '').trim();
  const pass = process.env.SMTP_PASSWORD || '';
  const port = Number(process.env.SMTP_PORT || 587);
  const secureSetting = (process.env.SMTP_SECURE || 'tls').trim().toLowerCase() || 'tls';
  const from = (process.env.SMTP_FROM_EMAIL || user).trim();
  const secureSettings = ['tls', 'starttls', 'ssl', 'true', 'false'];

  const missing = [];
  if (!host) missing.push('SMTP_HOST');
  if (!user) missing.push('SMTP_USERNAME');
  if (!pass) missing.push('SMTP_PASSWORD');

  if (missing.length) {
    console.error('Contact form SMTP configuration missing:', missing.join(', '));
    return respond(res, 500, {
      success: false,
      message: `Email delivery is not configured. Check: ${missing.join(', ')}.`
    });
  }

  const invalid = [];
  if (!Number.isInteger(port) || port < 1 || port > 65535) invalid.push('SMTP_PORT');
  if (!secureSettings.includes(secureSetting)) invalid.push('SMTP_SECURE');
  if (!isValidEmail(from)) invalid.push('SMTP_FROM_EMAIL');

  if (invalid.length) {
    console.error('Contact form SMTP configuration is invalid:', invalid.join(', '));
    return respond(res, 500, {
      success: false,
      message: `Email delivery configuration is invalid. Check: ${invalid.join(', ')}.`
    });
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    // Port 587 uses STARTTLS (false); port 465 usually uses SSL (true).
    secure: secureSetting === 'ssl' || secureSetting === 'true',
    requireTLS: secureSetting === 'tls' || secureSetting === 'starttls' || secureSetting === 'false',
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  });

  const emailBody = [
    'New free consultation request',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || 'Not provided'}`,
    `Website: ${website || 'Not provided'}`,
    `Service: ${service}`,
    `Timeline: ${timeline || 'Not provided'}`,
    '',
    'Project details:',
    message
  ].join('\n');

  try {
    await transporter.sendMail({
      from: { name: 'OrbitWick Website', address: from },
      to: RECIPIENT_EMAIL,
      replyTo: { name, address: email },
      subject: 'New OrbitWick consultation request',
      text: emailBody
    });

    return respond(res, 200, { success: true });
  } catch (error) {
    // Keep passwords out of logs while retaining useful diagnostics.
    console.error('Contact form email could not be sent:', {
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
      message: error.message
    });
    return respond(res, 502, {
      success: false,
      message: 'We could not send your request. Please try again later.'
    });
  }
  
};
