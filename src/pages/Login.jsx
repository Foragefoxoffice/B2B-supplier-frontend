import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Lock, EyeOff, Eye, ArrowRight,
  Check, MapPin, FileText, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../commonApi/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginApi({ email, password });
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
              {/* Subtle white shine/glow behind the logo */}
              <div className="absolute inset-0 bg-white blur-[20px] opacity-20 rounded-full animate-pulse mix-blend-screen"></div>

              {/* Logo with softer outer glow and crisp white background */}
              <img
                src="/images/kannan_silks_logo.png"
                alt="Kannan Silks Logo"
                className="relative w-40 h-40 lg:w-40 lg:h-40 object-contain rounded-full bg-white p-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] border border-white/30 transition-transform hover:scale-105 duration-500"
              />
            </div>
            <h1 className="text-5xl font-bold tracking-wide text-white flex items-center gap-3 mt-2 justify-center">
              Kannan <span className="text-blue-300">Silks</span>
            </h1>
            <p className="text-sm text-blue-200/90 mt-2 font-medium">B2B Supplier Management Platform.</p>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <h2 className="text-4xl lg:text-4xl font-bold leading-tight mb-5 text-white">
              Empowering Suppliers,<br />
              <span className="text-blue-300">Driving Growth.</span>
            </h2>
            <p className="text-blue-100/90 text-base max-w-md leading-relaxed font-light">
              Manage your products, track inventory, and process orders in real-time through our secure B2B supplier platform.
            </p>
          </div>

          {/* Feature List */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } }
            }}
            className="space-y-4 max-w-md mb-12"
          >
            {[
              "Real-time Inventory Management",
              "Streamlined Order Processing",
              "Comprehensive Sales Analytics",
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
                className="flex gap-3 items-center"
              >
                <div className="bg-white/10 rounded-full p-1 border border-white/20">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-white/90">{feature}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Avatars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-4"
          >
            <div className="flex -space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-blue-900 flex items-center justify-center text-[10px] font-bold text-blue-900">SP</div>
              <div className="w-8 h-8 rounded-full bg-blue-300 border-2 border-blue-900 flex items-center justify-center text-[10px] font-bold text-blue-900">B2B</div>
              <div className="w-8 h-8 rounded-full bg-white border-2 border-blue-900 flex items-center justify-center text-[12px] font-bold text-blue-900">+</div>
            </div>
            <div className="text-sm text-blue-100/90 font-medium">Trusted by 500+ suppliers globally</div>
          </motion.div>
        </motion.div>

        {/* Copyright */}
        <div className="text-xs text-blue-200/50 mt-10">
          © 2026 Kannan Silks. All rights reserved.
        </div>
      </div>
      {/* Right Section - Login Form & Contact Info */}
      <div className="w-full lg:w-[50%] bg-slate-50/50 flex flex-col items-center justify-center p-6 lg:p-12 z-10 lg:h-full lg:overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-[480px] flex flex-col gap-4 py-8"
        >
          {/* Main Login Card */}
          <div className="bg-white rounded-[1rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/90 p-8 sm:p-7 mt-2">
            <div className="mb-5 text-center">
              <h2 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">Sign in</h2>
              <p className="text-slate-500 text-sm">Welcome back! to our B2B supplier portal.</p>
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-11 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none text-slate-800 text-sm bg-slate-50 hover:bg-slate-100/50"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 pb-2">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2.5 block text-sm text-slate-600 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </a>
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
                    Signing in...
                  </span>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>
          </div>

          {/* Contact Support Section */}
          <div className="flex flex-col items-center mt-2">
            <div className="flex items-center gap-4 w-full mb-6">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Wholesale Registration</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="w-full bg-white/80 rounded-2xl border border-slate-200/60 p-5 backdrop-blur-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <div className="grid gap-y-4">
                {/* Address */}
                <div className="flex items-start gap-3.5">
                  <div className="bg-blue-50/80 p-2.5 rounded-xl shrink-0 text-blue-600 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-sm block mb-1">Kannan Silks</span>
                    <span className="text-xs leading-relaxed text-slate-500 font-medium">No.2/40, Raja Veethi Road, Chinthamaniyuur,<br />Omalur (Via), Salem (Dt.) Pin - 636 455.</span>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100"></div>

                {/* Phone Numbers */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="bg-emerald-50/80 p-2.5 rounded-xl shrink-0 text-emerald-600">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 flex gap-3 items-center bg-emerald-50/30 px-3 py-2 rounded-xl border border-emerald-100/50">
                      <a href="tel:+919787738094" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">+91 97877 38094</a>
                      <span className="text-sm font-semibold text-emerald-600">/</span>
                      <a href="tel:+916383900539" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">+91 63839 00539</a>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100"></div>

                {/* Email and GSTIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="bg-indigo-50/80 p-2.5 rounded-xl shrink-0 text-indigo-600">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">Email Us</span>
                      <a href="mailto:kannansilkshandloom@gmail.com" className="text-[11px] sm:text-xs font-semibold text-slate-700 hover:text-indigo-600 truncate" title="kannansilkshandloom@gmail.com">
                        kannansilkshandloom@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <div className="bg-amber-50/80 p-2.5 rounded-xl shrink-0 text-amber-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-amber-500/80 tracking-wider">GSTIN</span>
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-700">33ABFFK2782B1ZN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
