import fetch from 'node-fetch';

/**
 * Sends a styled, responsive welcome email to the new user using Brevo API
 * Email template uses table-based layout and inline styles for maximum compatibility and perfect center alignment.
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.fullName
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.role
 * @param {string} params.collegeName
 * @param {string} [params.institute]
 * @param {string} params.appUrl
 */
export async function sendUserWelcomeEmail({
  to,
  fullName,
  email,
  password,
  role,
  collegeName,
  institute,
  appUrl,
}) {
  const roleLabel = role
    ? role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : '';

  // Institute/institute block
  let instituteRow = '';
  if (institute && institute !== 'N/A') {
    instituteRow = `
      <tr>
        <td align="center" style="padding:14px 0;">
          <table cellpadding="0" cellspacing="0" width="100%" style="margin:auto;">
            <tr>
              <td align="center" width="40" style="vertical-align:middle;">
                <img src="https://img.icons8.com/ios-filled/50/2563eb/university.png" width="24" height="24" style="display:block;margin:auto;" alt="Institute"/>
              </td>
              <td align="left" style="padding-left:14px;">
                <div style="color:#64748b;font-size:14px;">Institute / institute</div>
                <div style="font-weight:500;color:#1e293b;font-size:16px;">${institute}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  const html = `
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
      @media only screen and (max-width:600px) {
        .container { width:100% !important; padding:12px !important; }
        .main-card { padding:16px !important; }
        .header { padding:20px 8px !important; }
        .cred-table td { padding:12px 0 !important; }
        .cred-label { font-size:13px !important; }
        .cred-value { font-size:15px !important; }
        .btn { padding:10px 14px !important; font-size:14px !important; }
        h1 { font-size:17px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;">
      <tr>
        <td align="center">
          <table class="container" cellpadding="0" cellspacing="0" border="0" width="500" style="width:500px;max-width:96vw;background:#fff;border-radius:18px;box-shadow:0 8px 24px rgba(59,130,246,0.10);overflow:hidden; margin-top:32px;">
            <!-- Header -->
            <tr>
              <td class="header" style="background:linear-gradient(135deg,#60a5fa,#3b82f6);padding:32px 26px;color:#fff;text-align:center;">
                <h1 style="margin:0;font-weight:600;font-size:22px;letter-spacing:0.5px;">Welcome to ScholarSync</h1>
                <div style="font-size:14px;opacity:0.9;margin-top:8px;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
                  Your academic management portal
                </div>
              </td>
            </tr>
            <!-- Card Content -->
            <tr>
              <td class="main-card" style="padding:28px 22px;">
                <table width="100%">
                  <tr>
                    <td style="font-size:16px;color:#1e293b;line-height:1.5;font-weight:500;padding-bottom:12px;">
                      <img src="https://img.icons8.com/fluency-systems-filled/24/3b82f6/user.png" alt="User" width="18" height="18" style="vertical-align:middle;margin-right:8px;"/>
                      Hello <span style="font-weight:600;">${fullName}</span>,
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;color:#475569;line-height:1.6;padding-bottom:14px;">
                      Your <b style="color:#2563eb;">${collegeName}</b> ScholarSync account has been created.
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;color:#475569;">Here are your login credentials:</td>
                  </tr>
                </table>
                <!-- Credentials Table -->
                <table class="cred-table" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;padding:18px;margin:20px 0;border:1px solid #e2e8f0;">
                  <!-- Email row -->
                  <tr>
                    <td align="center" style="padding:14px 0;">
                      <table cellpadding="0" cellspacing="0" width="100%" style="margin:auto;">
                        <tr>
                          <td align="center" width="40" style="vertical-align:middle;">
                            <img src="https://img.icons8.com/ios-filled/50/2563eb/message-group.png" width="22" height="22" style="display:block;margin:auto;" alt="Email"/>
                          </td>
                          <td align="left" style="padding-left:14px;">
                            <div class="cred-label" style="color:#64748b;font-size:14px;">Email Address</div>
                            <div class="cred-value" style="font-weight:500;color:#1e293b;font-size:16px;">${email}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Password row -->
                  <tr>
                    <td align="center" style="padding:14px 0;">
                      <table cellpadding="0" cellspacing="0" width="100%" style="margin:auto;">
                        <tr>
                          <td align="center" width="40" style="vertical-align:middle;">
                            <img src="https://img.icons8.com/ios-filled/50/2563eb/password.png" width="22" height="22" style="display:block;margin:auto;" alt="Password"/>
                          </td>
                          <td align="left" style="padding-left:14px;">
                            <div class="cred-label" style="color:#64748b;font-size:14px;">Temporary Password</div>
                            <div class="cred-value" style="font-weight:500;color:#1e293b;font-size:16px;">
                              ${password}
                              <span style="font-size:11px;background:#fecaca;color:#b91c1c;padding:2px 9px;border-radius:6px;margin-left:8px;">Temporary</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Role row -->
                  <tr>
                    <td align="center" style="padding:14px 0;">
                      <table cellpadding="0" cellspacing="0" width="100%" style="margin:auto;">
                        <tr>
                          <td align="center" width="40" style="vertical-align:middle;">
                            <img src="https://img.icons8.com/ios-filled/50/2563eb/user-group-man-man.png" width="22" height="22" style="display:block;margin:auto;" alt="Role"/>
                          </td>
                          <td align="left" style="padding-left:14px;">
                            <div class="cred-label" style="color:#64748b;font-size:14px;">Account Role</div>
                            <div class="cred-value" style="font-weight:500;color:#1e293b;font-size:16px;">${roleLabel}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Institute/institute row -->
                  ${instituteRow}
                </table>
                <!-- Button -->
                <div style="text-align:center;margin:20px 0;">
                  <a href="${appUrl}" class="btn" style="display:inline-block;background:linear-gradient(135deg,#60a5fa,#3b82f6);color:#fff;text-decoration:none;padding:12px 30px;border-radius:9px;font-weight:500;font-size:15px;box-shadow:0 2px 5px rgba(59,130,246,0.13);transition:all 0.3s;">
                    <img src="https://img.icons8.com/ios-filled/20/ffffff/open-in-browser.png" width="15" height="15" style="margin-right:7px;vertical-align:middle;" alt="Login"/>
                    Log In Now
                  </a>
                </div>
                <!-- Security Notice -->
                <div style="font-size:13px;color:#64748b;line-height:1.5;margin-top:12px;padding:10px;background:#fef2f2;border-radius:8px;border-left:3px solid #ef4444;display:flex;align-items:flex-start;gap:10px;">
                  <img src="https://img.icons8.com/ios-filled/20/ef4444/error.png" width="15" height="15" style="vertical-align:middle;" alt="Security"/>
                  <span>
                    <span style="font-weight:500;color:#b91c1c;">Security Notice:</span>
                    For your protection, please change your password after first login. Never share these credentials.
                  </span>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="text-align:center;padding:16px;font-size:12px;color:#94a3b8;background:#f8fafc;border-top:1px solid #f1f5f9;">
                <div style="margin-bottom:8px;">© ${new Date().getFullYear()} ${collegeName} ScholarSync</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    // Get API credentials from environment variables
    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || 'scholarsync.registermail1@gmail.com';

    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'ScholarSync',
          email: brevoSenderEmail
        },
        to: [{
          email: to,
          name: fullName
        }],
        subject: `Your ${collegeName} ScholarSync Account Credentials`,
        htmlContent: html,
        replyTo: {
          email: brevoSenderEmail,
          name: 'ScholarSync Support'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API Error Response:', data);
      throw new Error(`Brevo API error: ${data.message || JSON.stringify(data)}`);
    }

    console.log('✅ Email sent successfully via Brevo API. Message ID:', data.messageId);
    return { success: true, messageId: data.messageId };
    
  } catch (error) {
    console.error('❌ Failed to send email via Brevo API:', error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}