import { useState, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Zap, ArrowRight, Chrome, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, setupRecaptcha, sendOtp, verifyOtp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'phone'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only init recaptcha when we switch to phone mode
    if (mode === 'phone' && !window.recaptchaVerifier) {
      setupRecaptcha('recaptcha-container').catch(console.error);
    }
  }, [mode, setupRecaptcha]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        await registerWithEmail(email, password, name);
      } else if (mode === 'phone') {
        if (!otpSent) {
          const appVerifier = window.recaptchaVerifier;
          const result = await sendOtp(phone, appVerifier);
          setConfirmationResult(result);
          setOtpSent(true);
        } else {
          await verifyOtp(confirmationResult, otp);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim());
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(''); setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-orb auth-orb--1" />
      <div className="auth-orb auth-orb--2" />
      <div className="auth-orb auth-orb--3" />

      <div className="auth-card glass-card animate-scaleIn">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo__icon"><Zap size={22} fill="white" /></div>
          <span className="auth-logo__text font-display">Lexora</span>
        </div>

        <h1 className="auth-title font-display">
          {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Join Lexora' : 'Mobile Login'}
        </h1>
        <p className="auth-sub text-secondary text-sm">
          {mode === 'login'
            ? 'Sign in to explore knowledge with your community.'
            : mode === 'register' ? 'Create your account and start exploring.'
              : 'Enter your phone number to receive an SMS code.'}
        </p>

        {mode !== 'phone' && (
          <>
            {/* Google & Phone toggles */}
            <div className="flex gap-2 w-full">
              <button className="google-btn" style={{ flex: 1 }} onClick={handleGoogle} disabled={loading} id="google-signin-btn">
                <Chrome size={18} /> Google
              </button>
              <button className="google-btn" style={{ flex: 1 }} onClick={() => { setMode('phone'); setError(''); }} disabled={loading}>
                <Phone size={18} /> Phone
              </button>
            </div>
            <div className="auth-divider"><span>or</span></div>
          </>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="auth-field">
              <User size={16} className="auth-field__icon" />
              <input
                type="text" placeholder="Full name" required
                value={name} onChange={e => setName(e.target.value)}
                className="auth-input" id="auth-name-input"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <>
              <div className="auth-field">
                <Mail size={16} className="auth-field__icon" />
                <input
                  type="email" placeholder="Email address" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="auth-input" id="auth-email-input"
                />
              </div>
              <div className="auth-field">
                <Lock size={16} className="auth-field__icon" />
                <input
                  type={showPass ? 'text' : 'password'} placeholder="Password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="auth-input" id="auth-password-input"
                />
                <button type="button" className="auth-field__toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </>
          )}

          {mode === 'phone' && (
            <>
              {!otpSent ? (
                <div className="auth-field">
                  <Phone size={16} className="auth-field__icon" />
                  <input
                    type="tel" placeholder="+1 234 567 8900" required
                    value={phone} onChange={e => setPhone(e.target.value)}
                    className="auth-input"
                  />
                </div>
              ) : (
                <div className="auth-field">
                  <Lock size={16} className="auth-field__icon" />
                  <input
                    type="text" placeholder="6-digit OTP code" required
                    value={otp} onChange={e => setOtp(e.target.value)}
                    className="auth-input"
                  />
                </div>
              )}
              {/* Invisible Recaptcha */}
              <div id="recaptcha-container"></div>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary w-full auth-submit" disabled={loading} id="auth-submit-btn">
            {loading ? 'Please wait...'
              : mode === 'login' ? 'Sign In'
                : mode === 'register' ? 'Create Account'
                  : !otpSent ? 'Send SMS Code' : 'Verify Code'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="auth-switch text-sm text-secondary">
          {mode === 'phone' ? (
            <button className="auth-switch__btn" onClick={() => { setMode('login'); setError(''); }}>
              Back to Email Login
            </button>
          ) : (
            <>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button className="auth-switch__btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
