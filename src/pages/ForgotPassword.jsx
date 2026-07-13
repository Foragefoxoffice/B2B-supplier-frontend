import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, MapPin, FileText, Phone } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPasswordApi } from '../commonApi/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await forgotPasswordApi(email);
      if (data.success) {
        toast.success(data.message || 'OTP sent to your email!');
        // Pass email to the next route so user doesn't have to retype it
        navigate('/verify-otp', { state: { email } });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row relative font-sans overflow-hidden">
      {/* Left Section - Info & Features */}
      <div className="w-full lg:w-[50%] relative flex flex-col justify-between pt-10 pb-8 px-8 lg:px-16 xl:px-24 z-10 min-h-screen lg:min-h-0 lg:h-full bg-gradient-to-br from-blue-900 to-blue-950 text-white overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[600px] h-full bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-700/20 blur-[100px] rounded-full pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-grow flex flex-col justify-center relative z-10"
        >
          {/* Logo Section */}
          <div className="mb-10 text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-white blur-[20px] opacity-20 rounded-full animate-pulse mix-blend-screen"></div>
              <img
                src="/images/kannan_silks_logo.png"
                alt="Kannan Silks Logo"
                className="relative w-40 h-40 lg:w-40 lg:h-40 object-contain rounded-full bg-white p-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] border border-white/30 transition-transform hover:scale-105 duration-500"
              />
            </div>
            <h1 className="text-5xl font-bold tracking-wide text-white flex items-center gap-3 mt-2 justify-center">
              Kannan <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFF38C] to-[#D4AF37] bg-[length:200%_auto] animate-shine bg-clip-text text-transparent drop-shadow-sm">Silks</span>
            </h1>
            <p className="text-sm text-blue-200/90 mt-2 font-medium">B2B Supplier Management Platform.</p>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl lg:text-4xl font-bold leading-tight mb-5 text-white">
              Account Recovery
            </h2>
            <p className="text-blue-100/90 text-base max-w-md leading-relaxed font-light">
              Don't worry, it happens to the best of us. Enter your email and we'll help you get back into your account.
            </p>
          </div>
        </motion.div>

        {/* Copyright */}
        <div className="text-xs text-blue-200/50 mt-10">
          © 2026 Kannan Silks. All rights reserved.
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="w-full lg:w-[50%] bg-slate-50/50 flex flex-col items-center justify-center p-6 lg:p-12 z-10 lg:h-full lg:overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-[480px] flex flex-col gap-4 py-8"
        >
          <div className="bg-white rounded-[1rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/90 p-8 sm:p-7 mt-2">
            <div className="mb-5 text-center">
              <h2 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">Forgot Password</h2>
              <p className="text-slate-500 text-sm">Enter your registered email address to receive an OTP.</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none text-slate-800 text-sm bg-slate-50 hover:bg-slate-100/50"
                    placeholder="supplier@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] text-md font-medium text-white bg-active-btn hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </span>
                ) : (
                  <span>Send OTP</span>
                )}
              </button>
              
              <div className="text-center mt-4">
                <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                  Back to login
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
