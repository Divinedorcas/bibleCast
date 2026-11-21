import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Shield, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { classifyError } from '../utils/errorHandler';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'operator',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [appError, setAppError]         = useState(null);   // AppError | null

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (appError) setAppError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAppError(null);

    // Client-side password validation — build a plain AppError-like object
    if (formData.password !== formData.password_confirmation) {
      setAppError(classifyError({ response: { status: 422, data: { message: 'Passwords do not match. Please re-enter.', errors: {} } } }));
      return;
    }

    if (formData.password.length < 8) {
      setAppError(classifyError({ response: { status: 422, data: { message: 'Password must be at least 8 characters.', errors: {} } } }));
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role: formData.role,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // err is already an AppError thrown by AuthContext
      setAppError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-amber-950/15 via-transparent to-transparent pointer-events-none" />

      <div className="relative w-full max-w-md my-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/20 text-slate-950 font-black text-3xl mb-3">
            ✝
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Bible<span className="text-amber-400">Cast</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
            Team Member Registration
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          <ErrorAlert
            error={appError}
            onDismiss={() => setAppError(null)}
            className="mb-5"
          />

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="operator@church.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label htmlFor="role" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Church Role
              </label>
              <div className="relative">
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-amber-400 font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
                >
                  <option value="operator" className="bg-slate-900 text-slate-200">
                    Operator (Media Booth &amp; Live Projection)
                  </option>
                  <option value="presenter" className="bg-slate-900 text-slate-200">
                    Presenter (Pastor / Speaker)
                  </option>
                  <option value="admin" className="bg-slate-900 text-slate-200">
                    Admin (System &amp; Team Management)
                  </option>
                </select>
                <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-10 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Confirmation */}
            <div>
              <label htmlFor="password_confirmation" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Account &amp; Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                Sign in here &rarr;
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
