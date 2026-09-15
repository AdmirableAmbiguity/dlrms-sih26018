import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Shield, KeyRound, Smartphone, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [method, setMethod] = useState<'password' | 'otp'>('otp');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('citizen');
  
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
      toast.success('OTP sent successfully (Demo: use any 6 digits)');
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login({ id: '1', phone, role: role as any, name: 'Demo User' }, 'fake-jwt-token');
      toast.success('Logged in successfully');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex font-sans bg-gray-50">
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <img src="/favicon.svg" alt="Logo" className="w-12 h-12 bg-white rounded-full p-1" />
            <span className="text-3xl font-bold text-white tracking-wider">DLRMS</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
            Intelligent Land Record Digitization & Validation System
          </h1>
          <p className="text-lg text-gray-300 max-w-lg">
            Empowering citizens and revenue officers with AI-driven document processing, real-time GIS mapping, and blockchain security.
          </p>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Shield className="w-4 h-4" />
            <span>Smart India Hackathon 202618</span>
          </div>
        </div>

        {/* Decorative background */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-secondary opacity-10 rounded-full blur-3xl"></div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500 mb-8">Sign in to access your land records.</p>

            <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
              <button
                onClick={() => setMethod('otp')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${method === 'otp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Mobile OTP
              </button>
              <button
                onClick={() => setMethod('password')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${method === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Password
              </button>
            </div>

            <form onSubmit={otpSent || method === 'password' ? handleLogin : handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="citizen">Citizen (View Records)</option>
                  <option value="revenue_officer">Revenue Officer (Review & Digitize)</option>
                  <option value="verifier_admin">Admin / Verifier (Blockchain & Fraud)</option>
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none disabled:bg-gray-100"
                        placeholder="Enter 10 digit number"
                      />
                    </div>
                  </div>
                  
                  {otpSent && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-center tracking-[0.5em] font-bold text-lg"
                        placeholder="••••••"
                        required
                      />
                    </motion.div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email / Username</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      defaultValue="demo@dlrms.gov.in"
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        defaultValue="password"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {method === 'otp' && !otpSent ? 'Send OTP' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Demo Environment</h4>
              <p className="text-xs text-blue-800">
                You can login with any credentials. Select the role above to explore different features of the platform.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
