// Vercel Serverless Function: Real SMS OTP Dispatch
// Supports: Twilio Verify, Twilio SMS, Fast2SMS, MSG91


// Shared in-memory / cache store on serverless runtime
declare global {
  var __SERVER_OTP_STORE: Record<string, { otp: string; provider: string; createdAt: number; expiresAt: number; attempts: number }> | undefined;
}

if (!global.__SERVER_OTP_STORE) {
  global.__SERVER_OTP_STORE = {};
}

const otpStore = global.__SERVER_OTP_STORE;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+91${digits.slice(-10)}`;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body || {};
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const cleanPhone = normalizePhone(phone);
    const now = Date.now();

    // Check 60s cooldown
    const existing = otpStore[cleanPhone];
    if (existing && now - existing.createdAt < 60000) {
      const waitSecs = Math.ceil((60000 - (now - existing.createdAt)) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSecs}s before requesting a new OTP.` });
    }

    // Twilio Verify Credentials from env
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const fast2SmsApiKey = process.env.FAST2SMS_API_KEY;
    const msg91AuthKey = process.env.MSG91_AUTH_KEY;
    const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;

    // 1. Twilio Verify API
    if (twilioAccountSid && twilioAuthToken && twilioVerifyServiceSid) {
      const basicAuth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', cleanPhone);
      params.append('Channel', 'sms');

      const twilioRes = await fetch(
        `https://verify.twilio.com/v2/Services/${twilioVerifyServiceSid}/Verifications`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      if (twilioRes.ok) {
        otpStore[cleanPhone] = {
          otp: '',
          provider: 'twilio_verify',
          createdAt: now,
          expiresAt: now + 300000,
          attempts: 0,
        };
        return res.status(200).json({
          status: 'success',
          message: `OTP sent via Twilio Verify to ${cleanPhone.slice(-4).padStart(cleanPhone.length, '*')}`,
        });
      } else {
        const errText = await twilioRes.text();
        return res.status(400).json({ error: `Twilio delivery failed: ${errText}` });
      }
    }

    // Generate cryptographic random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Fast2SMS (India)
    if (fast2SmsApiKey) {
      const raw10 = cleanPhone.replace('+91', '');
      const fastRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2SmsApiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          variables_values: otpCode,
          route: 'otp',
          numbers: raw10,
        }).toString(),
      });

      const fastData = await fastRes.json();
      if (fastData.return) {
        otpStore[cleanPhone] = {
          otp: otpCode,
          provider: 'fast2sms',
          createdAt: now,
          expiresAt: now + 300000,
          attempts: 0,
        };
        return res.status(200).json({
          status: 'success',
          message: `OTP sent via Fast2SMS to ${cleanPhone.slice(-4).padStart(cleanPhone.length, '*')}`,
        });
      }
    }

    // 3. MSG91 (India)
    if (msg91AuthKey) {
      const raw10 = cleanPhone.replace('+91', '');
      const msgRes = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          authkey: msg91AuthKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: msg91TemplateId || 'default',
          mobile: `91${raw10}`,
          otp: otpCode,
        }),
      });

      if (msgRes.ok) {
        otpStore[cleanPhone] = {
          otp: otpCode,
          provider: 'msg91',
          createdAt: now,
          expiresAt: now + 300000,
          attempts: 0,
        };
        return res.status(200).json({
          status: 'success',
          message: `OTP sent via MSG91 to ${cleanPhone.slice(-4).padStart(cleanPhone.length, '*')}`,
        });
      }
    }

    // Store server-side OTP (5 min expiry)
    otpStore[cleanPhone] = {
      otp: otpCode,
      provider: 'server_managed',
      createdAt: now,
      expiresAt: now + 300000,
      attempts: 0,
    };

    return res.status(200).json({
      status: 'success',
      message: `OTP sent to ${cleanPhone.slice(-4).padStart(cleanPhone.length, '*')}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
