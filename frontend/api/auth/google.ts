const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '810558816674-vj00b3e31bgrmo5p6sub7m52pi2cg2mp.apps.googleusercontent.com';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  try {
    const { credential, role = 'revenue_officer' } = req.body || {};

    if (!credential) {
      return res.status(400).json({ detail: 'Missing Google credential token' });
    }

    // Verify token with Google TokenInfo API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    
    if (!response.ok) {
      const errText = await response.text();
      return res.status(401).json({ detail: 'Invalid Google token', error: errText });
    }

    const payload = await response.json();

    // Verify aud matches our Client ID
    if (payload.aud !== GOOGLE_CLIENT_ID && !payload.aud?.includes('810558816674')) {
      console.warn(`Token audience mismatch: ${payload.aud} vs ${GOOGLE_CLIENT_ID}`);
    }

    const user = {
      id: payload.sub || `google-${Date.now()}`,
      email: payload.email,
      name: payload.name || payload.given_name || 'Google User',
      full_name: payload.name || payload.given_name || 'Google User',
      picture: payload.picture,
      avatar: payload.picture,
      role: role || 'revenue_officer',
      phone: '',
      provider: 'google',
    };

    const token = `g-jwt-${Buffer.from(JSON.stringify({ sub: payload.sub, email: payload.email, exp: Date.now() + 86400000 })).toString('base64')}`;

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      access_token: token,
      token_type: 'bearer',
      user,
    });
  } catch (error: any) {
    console.error('Google Auth verification error:', error);
    return res.status(500).json({ detail: error.message || 'Internal server error' });
  }
}
