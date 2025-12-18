/**
 * Cloudflare Worker to handle form submissions
 * - /forms/contact: Forward to email
 * - /forms/yard-sign: Forward to email
 * - Footer newsletter: Store in D1 database
 */

// Configure your email settings here
const EMAIL_CONFIG = {
  to: 'sarahjwilk@gmail.com', // Recipient email
  from: 'postmaster@wilkinsonforcapeann.com', // Sender email (must be from your domain)
  replyTo: null, // Will be set to the form submitter's email
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { 
        status: 405,
        headers: getCORSHeaders()
      });
    }

    try {
      // Parse the request body
      const data = await request.json();
      
      // Get the URL path to determine form type
      const url = new URL(request.url);
      const path = url.pathname;
      
      // Route to appropriate handler
      if (path.includes('/forms/contact') || data.formType === 'contact') {
        return await handleContactForm(data, request, env);
      } else if (path.includes('/forms/yard-sign') || data.formType === 'yard-sign') {
        return await handleYardSignForm(data, request, env);
      } else if (path.includes('/newsletter') || data.formType === 'newsletter' || data.formType === 'footer-email') {
        return await handleNewsletterForm(data, request, env);
      } else {
        // Default: try to detect form type from data
        if (data.message && data.name && data.email) {
          return await handleContactForm(data, request, env);
        } else if (data.address && data.name && data.email) {
          return await handleYardSignForm(data, request, env);
        } else if (data.email && !data.name && !data.message && !data.address) {
          return await handleNewsletterForm(data, request, env);
        } else {
          return new Response(
            JSON.stringify({ error: 'Unknown form type or missing required fields' }),
            { 
              status: 400, 
              headers: { 
                'Content-Type': 'application/json',
                ...getCORSHeaders()
              } 
            }
          );
        }
      }
    } catch (error) {
      console.error('Error processing form:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error', details: error.message }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders()
          }
        }
      );
    }
  },
};

/**
 * Handle contact form submission
 */
async function handleContactForm(data, request, env) {
  // Validate required fields
  const { name, email, message } = data;
  if (!name || !email || !message) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: name, email, and message are required' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        } 
      }
    );
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email address' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        } 
      }
    );
  }

  // Send email using MailChannels
  await sendContactEmail(name, email, message);

  // Return success response
  return new Response(
    JSON.stringify({ success: true, message: 'Contact form submitted successfully' }),
    { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    }
  );
}

/**
 * Handle yard sign form submission
 */
async function handleYardSignForm(data, request, env) {
  // Validate required fields
  const { name, email, address } = data;
  if (!name || !email || !address) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: name, email, and address are required' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        } 
      }
    );
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email address' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        } 
      }
    );
  }

  // Send email using MailChannels
  await sendYardSignEmail(name, email, address);

  // Return success response
  return new Response(
    JSON.stringify({ success: true, message: 'Yard sign request submitted successfully' }),
    { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    }
  );
}

/**
 * Handle newsletter/email signup form submission
 */
async function handleNewsletterForm(data, request, env) {
  // Validate required fields
  const { email } = data;
  if (!email) {
    return new Response(
      JSON.stringify({ error: 'Email is required' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        } 
      }
    );
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email address' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        } 
      }
    );
  }

  // Get client info for database
  const ipAddress = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For') || 
                    'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';

  // Store in D1 database
  try {
    // Check if email already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM subscribers WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      // Email already exists, return success but don't insert
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email already subscribed',
          alreadySubscribed: true 
        }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders()
          }
        }
      );
    }

    // Insert new subscriber
    const result = await env.DB.prepare(
      'INSERT INTO subscribers (email, ip_address, user_agent) VALUES (?, ?, ?)'
    ).bind(email, ipAddress, userAgent).run();

    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Successfully subscribed to newsletter' 
        }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders()
          }
        }
      );
    } else {
      throw new Error('Database insert failed');
    }
  } catch (dbError) {
    console.error('Database error:', dbError);
    // If it's a unique constraint error, email already exists
    if (dbError.message && dbError.message.includes('UNIQUE constraint')) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email already subscribed',
          alreadySubscribed: true 
        }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...getCORSHeaders()
          }
        }
      );
    }
    throw dbError;
  }
}

/**
 * Send contact form email using MailChannels
 */
async function sendContactEmail(name, email, message) {
  const emailData = {
    personalizations: [
      {
        to: [{ email: EMAIL_CONFIG.to }],
        dkim_domain: 'wilkinsonforcapeann.com',
        dkim_selector: 'mailchannels',
      },
    ],
    from: {
      email: EMAIL_CONFIG.from,
      name: 'Contact Form',
    },
    reply_to: {
      email: email,
      name: name,
    },
    subject: `New Contact Form Submission from ${name}`,
    content: [
      {
        type: 'text/plain',
        value: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Message:
${message}

Submitted at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}
        `.trim(),
      },
      {
        type: 'text/html',
        value: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #1e3a8a; }
    .value { margin-top: 5px; padding: 10px; background-color: white; border-left: 3px solid #1e3a8a; }
    .message { white-space: pre-wrap; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Form Submission</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name:</div>
        <div class="value">${escapeHtml(name)}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
        <div class="value">${escapeHtml(email)}</div>
      </div>
      <div class="field">
        <div class="label">Message:</div>
        <div class="value message">${escapeHtml(message)}</div>
      </div>
      <div class="footer">
        Submitted at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}
      </div>
    </div>
  </div>
</body>
</html>
        `.trim(),
      },
    ],
  };

  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MailChannels API error: ${errorText}`);
  }
}

/**
 * Send yard sign email using MailChannels
 */
async function sendYardSignEmail(name, email, address) {
  const emailData = {
    personalizations: [
      {
        to: [{ email: EMAIL_CONFIG.to }],
        dkim_domain: 'wilkinsonforcapeann.com',
        dkim_selector: 'mailchannels',
      },
    ],
    from: {
      email: EMAIL_CONFIG.from,
      name: 'Yard Sign Request Form',
    },
    reply_to: {
      email: email,
      name: name,
    },
    subject: `New Yard Sign Request from ${name}`,
    content: [
      {
        type: 'text/plain',
        value: `
New Yard Sign Request

Name: ${name}
Email: ${email}
Address:
${address}

Submitted at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}
        `.trim(),
      },
      {
        type: 'text/html',
        value: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #1e3a8a; }
    .value { margin-top: 5px; padding: 10px; background-color: white; border-left: 3px solid #1e3a8a; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Yard Sign Request</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name:</div>
        <div class="value">${escapeHtml(name)}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
        <div class="value">${escapeHtml(email)}</div>
      </div>
      <div class="field">
        <div class="label">Street Address:</div>
        <div class="value">${escapeHtml(address).replace(/\n/g, '<br>')}</div>
      </div>
      <div class="footer">
        Submitted at: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}
      </div>
    </div>
  </div>
</body>
</html>
        `.trim(),
      },
    ],
  };

  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MailChannels API error: ${errorText}`);
  }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Get CORS headers
 */
function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // Update with your domain in production
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(),
  });
}

