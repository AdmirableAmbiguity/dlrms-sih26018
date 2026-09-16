// Vercel Serverless Function: Real SMS OTP Verification
// Verifies entered OTP against Twilio Verify or Serverless Store
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { phone, otp, role } = req.body || {};
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP code are required' });
    }

    const cleanPhone = normalizePhone(phone);
    const record = otpStore[cleanPhone];

    if (!record) {
      return res.status(400).json({ error: 'No active OTP request found. Please request a new OTP code.' });
    }

    // Check Twilio Verify
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (record.provider === 'twilio_verify' && twilioAccountSid && twilioAuthToken && twilioVerifyServiceSid) {
      const basicAuth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', cleanPhone);
      params.append('Code', otp);

      const twilioRes = await fetch(
        `https://verify.twilio.com/v2/Services/${twilioVerifyServiceSid}/VerificationCheck`,
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
        const data = await twilioRes.json();
        if (data.status === 'approved') {
          delete otpStore[cleanPhone];
          return res.status(200).json({
            status: 'success',
            message: 'OTP verified successfully',
            token: `jwt-verified-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            user: {
              phone: cleanPhone,
              role: role || 'revenue_officer',
              name: role === 'citizen' ? 'Ramesh Chandra Gupta' : role === 'verifier_admin' ? 'Tehsildar Arun Sharma' : 'Patwari Surendra Singh',
            },
          });
        } else {
          record.attempts += 1;
          if (record.attempts >= 3) {
            delete otpStore[cleanPhone];
            return res.status(400).json({ error: 'Maximum attempts exceeded. Please request a new OTP.' });
          }
          return res.status(400).json({ error: 'Invalid OTP code. Please enter the exact code received via SMS.' });
        }
      }
    }

    // Check Server/Gateway Store
    const now = Date.now();
    if (now > record.expiresAt) {
      delete otpStore[cleanPhone];
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    record.attempts += 1;
    if (record.attempts > 3) {
      delete otpStore[cleanPhone];
      return res.status(400).json({ error: 'Maximum attempts exceeded. Please request a new code.' });
    }

    if (record.otp === otp) {
      delete otpStore[cleanPhone];
      return res.status(200).json({
        status: 'success',
        message: 'OTP verified successfully',
        token: `jwt-verified-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        user: {
          phone: cleanPhone,
          role: role || 'revenue_officer',
          name: role === 'citizen' ? 'Ramesh Chandra Gupta' : role === 'verifier_admin' ? 'Tehsildar Arun Sharma' : 'Patwari Surendra Singh',
        },
      });
    }

    const remaining = 3 - record.attempts;
    return res.status(400).json({ error: `Incorrect OTP code. ${remaining} attempt(s) remaining.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
