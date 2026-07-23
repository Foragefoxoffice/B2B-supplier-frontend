import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Lock, EyeOff, Eye, ArrowRight,
  Check, MapPin, FileText, Phone, Globe, Shield
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { loginApi, verifyLoginOtpApi } from '../commonApi/api';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const [showSuccessLoader, setShowSuccessLoader] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState('');
  const [isCheckingIp, setIsCheckingIp] = useState(false);

  // Redirect to dashboard if already logged in, otherwise load remembered email
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    if (token && userString) {
      navigate('/dashboard');
    } else {
      const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
      if (savedRememberMe) {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCheckingIp(true);
    setLoading(true);
    setError('');

    const startTime = Date.now();
    try {
      const [data] = await Promise.all([
        loginApi({ email, password }),
        new Promise(resolve => setTimeout(resolve, 1500)) // minimum 1.5s delay for animation
      ]);
      
      setIsCheckingIp(false);

      if (data.success) {
        if (data.requireOtp) {
          toast.success(data.message);
          setShowOtpScreen(true);
          setLoading(false);
          return;
        }

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Logged in successfully!');
        setShowSuccessLoader(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2500);
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 1500) {
        await new Promise(r => setTimeout(r, 1500 - elapsed));
      }
      setIsCheckingIp(false);
      const errMsg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await verifyLoginOtpApi(email, otp);
      if (data.success) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Logged in successfully!');
        setShowSuccessLoader(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2500);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'OTP verification failed.';
      setError(errMsg);
      toast.error(errMsg);
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
              Kannan <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFF38C] to-[#D4AF37] bg-[length:200%_auto] animate-shine bg-clip-text text-transparent drop-shadow-sm">Silks</span>
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

            {!showOtpScreen ? (
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
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="ml-2.5 block text-sm text-slate-600 cursor-pointer select-none">
                      Remember me
                    </label>
                  </div>
                  <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot password?
                  </Link>
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
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Enter Verification Code (OTP)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength="6"
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all outline-none text-slate-800 text-sm bg-slate-50 hover:bg-slate-100/50 text-center tracking-[0.5em] font-mono text-lg"
                      placeholder="------"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Please check your email for the 6-digit OTP code.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center py-3 px-4 rounded-xl shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] text-md font-medium text-white bg-active-btn hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    <span>Verify & Login</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpScreen(false);
                    setOtp('');
                  }}
                  className="w-full mt-2 py-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>

          {/* Contact Support Section */}
          <div className="flex flex-col items-center mt-2">
            <div className="flex items-center gap-4 w-full mb-6">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[13px] font-semibold text-primary">Wholesale Registration</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="w-full bg-white/80 rounded-2xl border border-slate-200/60 p-5 backdrop-blur-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <div className="grid gap-y-3">
                {/* Address */}
                <div className="flex items-start gap-3.5">
                  <div className="bg-blue-50/80 p-2.5 rounded-xl shrink-0 text-blue-600 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 text-sm block mb-1">Kannan Silks</span>
                    <span className="text-xs leading-relaxed text-slate-500 font-medium">No.2/40, Raja Veethi Road, Chinthamaniyur,<br />Omalur (Via), Salem (Dt.) Pin - 636 455.</span>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100"></div>

                {/* Phone Numbers */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="bg-emerald-50/80 p-2.5 rounded-xl shrink-0 text-emerald-600">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 flex gap-3 items-center bg-emerald-50/30 px-3 py-1 rounded-lg border border-emerald-100/50">
                      <a href="tel:+919787738094" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">+91 97877 38094</a>
                      <span className="text-xs font-semibold text-emerald-600">/</span>
                      <a href="tel:+916383900539" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">+91 63839 00539</a>
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

      {/* Premium Success Loader Overlay */}
      {showSuccessLoader && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a1b3f] via-[#030a1c] to-[#01040d] text-white"
        >
          {/* Subtle background glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#D4AF37]/5 blur-[130px] rounded-full pointer-events-none" />

          <div className="flex flex-col items-center max-w-sm text-center px-6 relative z-10">
            {/* Logo Container */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 90,
                damping: 15,
                delay: 0.1
              }}
              className="relative mb-6"
            >
              {/* Soft gold breathing glow behind the logo */}
              <motion.div 
                className="absolute inset-0 bg-[#D4AF37] blur-[30px] rounded-full"
                animate={{ opacity: [0.15, 0.3, 0.15] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />

              <img
                src="/images/kannan_silks_logo.png"
                alt="Kannan Silks Logo"
                className="relative w-36 h-36 object-contain rounded-full bg-white p-3.5 shadow-[0_0_40px_rgba(212,175,55,0.35)] border border-[#D4AF37]/35"
              />
            </motion.div>

            {/* Portal Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold tracking-wide mb-1"
            >
              Kannan <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFF38C] to-[#D4AF37] bg-clip-text text-transparent drop-shadow-sm">Silks</span>
            </motion.h2>

            <motion.p
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-blue-200/70 text-xs font-semibold uppercase tracking-wider mb-8"
            >
              Supplier Portal
            </motion.p>

            {/* Animated Three Dots */}
            <div className="flex items-center justify-center gap-2.5">
              {[0, 1, 2].map((idx) => (
                <motion.div
                  key={idx}
                  className="w-3 h-3 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFF38C] shadow-[0_0_8px_rgba(212,175,55,0.6)]"
                  animate={{
                    y: ["0%", "-80%", "0%"]
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: idx * 0.15
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
      {/* IP Checking Loader Overlay */}
      {isCheckingIp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a1b3f] via-[#030a1c] to-[#01040d] text-white"
        >
          {/* Subtle background glows */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

          <div className="flex flex-col items-center max-w-sm text-center px-6 relative z-10">
            
            {/* Radar/Globe Animation Container */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Pulsing rings */}
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={ring}
                  className="absolute inset-0 border-2 border-emerald-500/20 rounded-full"
                  animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.8, 0.4, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: ring * 0.6,
                    ease: "easeOut"
                  }}
                />
              ))}

              {/* Center icon */}
              <motion.div 
                className="relative z-10 bg-emerald-500/20 p-5 rounded-full border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              >
                <Globe className="w-12 h-12 text-emerald-400" />
              </motion.div>
              
              {/* Scanning line */}
              <motion.div
                className="absolute inset-0 z-20 rounded-full overflow-hidden"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-1/2 h-1/2 bg-gradient-to-br from-emerald-400/0 to-emerald-400/40 origin-bottom-right" style={{ clipPath: 'polygon(100% 100%, 0 0, 100% 0)' }}></div>
              </motion.div>
            </div>

            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold tracking-wide mb-2 text-white"
            >
              Security Check
            </motion.h2>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-emerald-400/80 text-sm font-semibold uppercase tracking-wider mb-4"
            >
              Verifying IP Address
            </motion.p>
            
            {/* Terminal-like text typing effect */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-black/50 border border-emerald-500/20 rounded-lg p-3 text-left w-full max-w-[250px]"
            >
               <div className="flex items-center gap-2 mb-1.5">
                 <Shield className="w-3.5 h-3.5 text-emerald-500" />
                 <span className="text-xs text-emerald-500/70 font-mono">Authenticating...</span>
               </div>
               <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-emerald-500"
                   initial={{ width: "0%" }}
                   animate={{ width: "100%" }}
                   transition={{ duration: 1.5, ease: "easeInOut" }}
                 />
               </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Login;
