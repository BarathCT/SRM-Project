import nodemailer from 'nodemailer';

let transporter;

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
};

const toNumber = (value, defaultValue) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const getMailConfig = () => {
  const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
  const port = toNumber(process.env.BREVO_SMTP_PORT, 587);
  const secure = toBoolean(process.env.BREVO_SMTP_SECURE, false);
  const user = process.env.BREVO_SMTP_LOGIN || process.env.BREVO_SMTP_USER || '';
  const pass = process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY || '';
  
  // Use BREVO_FROM if set, otherwise fallback to Brevo-verified sender (the SMTP login email)
  let from = process.env.BREVO_FROM;
  if (!from) {
    // Use Brevo SMTP login as sender (guaranteed to be verified)
    const senderName = 'Scholar Sync';
    from = user ? `${senderName} <${user}>` : senderName;
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from,
  };
};

const isConfigured = (config) => {
  return Boolean(config.host && config.port && config.auth.user && config.auth.pass);
};

const createTransporter = () => {
  const config = getMailConfig();

  if (!isConfigured(config)) {
    throw new Error('SMTP config missing. Set BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_LOGIN and BREVO_SMTP_KEY.');
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    pool: true,
    maxConnections: toNumber(process.env.SMTP_MAX_CONNECTIONS, 5),
    maxMessages: toNumber(process.env.SMTP_MAX_MESSAGES, 100),
    connectionTimeout: toNumber(process.env.SMTP_CONNECTION_TIMEOUT_MS, 15000),
    greetingTimeout: toNumber(process.env.SMTP_GREETING_TIMEOUT_MS, 10000),
    socketTimeout: toNumber(process.env.SMTP_SOCKET_TIMEOUT_MS, 20000),
    auth: config.auth,
  });
};

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const verifySmtpConnection = async () => {
  try {
    const config = getMailConfig();
    if (!isConfigured(config)) {
      console.warn('[Mail] SMTP not fully configured. Email features will fail until env vars are set.');
      return false;
    }

    await getTransporter().verify();
    console.log(`[Mail] SMTP ready on ${config.host}:${config.port}`);
    return true;
  } catch (error) {
    console.error('[Mail] SMTP verification failed:', error.message);
    return false;
  }
};

export const sendMail = async ({
  to,
  subject,
  html,
  text,
  replyTo,
  headers,
  attempts = 2,
}) => {
  const config = getMailConfig();
  if (!isConfigured(config)) {
    throw new Error('SMTP is not configured. Cannot send email.');
  }

  let lastError;
  const maxAttempts = Math.max(1, attempts);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const info = await getTransporter().sendMail({
        from: config.from,
        to,
        subject,
        html,
        text,
        replyTo,
        headers,
      });

      console.log(`[Mail] Sent '${subject}' to ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(300 * attempt);
      }
    }
  }

  throw new Error(`Failed to send email after ${maxAttempts} attempt(s): ${lastError?.message || 'Unknown error'}`);
};
