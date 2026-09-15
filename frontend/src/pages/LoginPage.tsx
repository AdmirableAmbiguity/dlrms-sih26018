import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Shield, KeyRound, Smartphone, Loader2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_USERS: Record<string, { name: string; email: string }> = {
  citizen: { name: 'Ramesh Chandra Gupta', email: 'citizen@demo.com' },
  revenue_officer: { name: 'Patwari Surendra Singh', email: 'officer@demo.com' },
  verifier_admin: { name: 'Tehsildar Arun Sharma', email: 'admin@demo.com' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<'password' | 'otp'>('otp');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('revenue_officer');

  // OTP State
  const [phone, setPhone] = useState('9876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      toast.success('OTP sent! (Demo: enter any 6 digits)');
    }, 800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // OTP validation for demo — any 6 digits accepted
    if (method === 'otp' && otp.length < 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const demoUser = DEMO_USERS[role] || DEMO_USERS.citizen;
      login(
        {
          id: role === 'citizen' ? '1' : role === 'revenue_officer' ? '2' : '3',
          email: demoUser.email,
          full_name: demoUser.name,
          role: role as any,
          name: demoUser.name,
        },
        'demo-jwt-token-' + role
      );
      toast.success(`Signed in as ${demoUser.name}`);
      setLoading(false);
      navigate('/dashboard');
    }, 900);
  };

  return (
    <div className="min-h-screen flex font-sans bg-gray-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1e3a5f] flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-[#FF9933] rounded-full flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-wider">DLRMS</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
            Intelligent Land Record<br />Digitization &amp; Validation
          </h1>
          <p className="text-lg text-blue-200 max-w-lg mb-8">
            AI-powered OCR · Blockchain fraud detection · 3D GIS cadastral maps · QR-verified certificates
          </p>
          <div className="grid grid-cols-2 gap-4">
            {['AI OCR Pipeline', 'Blockchain Ledger', '3D GIS Mapping', 'Fraud Detection'].map(f => (
              <div key={f} className="bg-white/10 rounded-lg px-4 py-3 text-sm text-white font-medium">
                ✦ {f}
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-sm text-blue-300">
          <Shield className="w-4 h-4" />
          <span>Smart India Hackathon 2026 · SIH26018</span>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-[#FF9933] opacity-10 rounded-full blur-3xl" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Welcome Back</h2>
            <p className="text-gray-500 mb-8">Sign in to access your land records dashboard.</p>

            {/* Method toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button
                onClick={() => { setMethod('otp'); setOtpSent(false); setOtp(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${method === 'otp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Smartphone className="inline w-4 h-4 mr-1" /> Mobile OTP
              </button>
              <button
                onClick={() => setMethod('password')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${method === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <KeyRound className="inline w-4 h-4 mr-1" /> Password
              </button>
            </div>

            <form onSubmit={otpSent || method === 'password' ? handleLogin : handleSendOTP} className="space-y-5">
              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none bg-white"
                >
                  <option value="citizen">🏠 Citizen — View own records</option>
                  <option value="revenue_officer">📋 Revenue Officer — Upload &amp; Review</option>
                  <option value="verifier_admin">🔐 Admin / Verifier — Blockchain &amp; Fraud</option>
                </select>
              </div>

              {method === 'otp' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Smartphone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        disabled={otpSent}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none disabled:bg-gray-100"
                        placeholder="Enter 10-digit number"
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none text-center tracking-[0.5em] font-bold text-xl"
                        placeholder="••••••"
                        autoFocus
                      />
                      <p className="text-xs text-gray-400 mt-1">Demo: enter any 6 digits (e.g. 123456)</p>
                    </motion.div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                      defaultValue={DEMO_USERS[role]?.email || 'officer@demo.com'}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] outline-none"
                        defaultValue="demo123"
                        readOnly
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#1e3a5f] text-white rounded-lg font-semibold hover:bg-[#2a4f7c] focus:ring-4 focus:ring-[#1e3a5f]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {method === 'otp' && !otpSent ? 'Send OTP' : 'Sign In →'}
              </button>
            </form>

            {/* Demo info card */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="text-sm font-semibold text-amber-900 mb-2">🎯 Demo Environment</h4>
              <div className="space-y-1 text-xs text-amber-800 font-mono">
                <div>citizen@demo.com &nbsp;&nbsp;&nbsp;→ View records</div>
                <div>officer@demo.com &nbsp;&nbsp;→ Upload &amp; review docs</div>
                <div>admin@demo.com &nbsp;&nbsp;&nbsp;&nbsp;→ Blockchain &amp; fraud</div>
                <div className="pt-1 font-sans text-amber-700">Password: <strong>demo123</strong> · OTP: any 6 digits</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
