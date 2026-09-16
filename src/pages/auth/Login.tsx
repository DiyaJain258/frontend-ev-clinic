import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiShield, FiClock } from 'react-icons/fi';

import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);

    const [step, setStep] = useState<'login' | 'otp'>('login');
    const [otp, setOtp] = useState('');
    const { login, confirmOTP, lockoutUntil, handleRedirectByRole } = useAuth() as any;

    const navigate = useNavigate();

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('ev_remembered_email');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    useEffect(() => {
        if (lockoutUntil && lockoutUntil > Date.now()) {
            setLockoutTime(lockoutUntil);
            const interval = setInterval(() => {
                if (lockoutUntil <= Date.now()) {
                    setLockoutTime(null);
                    clearInterval(interval);
                } else {
                    setLockoutTime(lockoutUntil);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [lockoutUntil]);

    const getRemainingLockoutTime = () => {
        if (!lockoutTime) return '';
        const remaining = Math.max(0, lockoutTime - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')} `;
    };

    const performLogin = async (targetEmail: string, targetPassword: string, _otp?: string) => {
        setError('');
        setIsLoading(true);

        try {
            const result = await login(targetEmail, targetPassword);

            if (result && result.success) {
                if (result.otpRequired) {
                    setStep('otp');
                    if (rememberMe) {
                        localStorage.setItem('ev_remembered_email', targetEmail);
                    } else {
                        localStorage.removeItem('ev_remembered_email');
                    }
                } else {
                    // Direct login successful
                    const user = result.user;
                    const isSuperAdmin = user?.roles?.some((r: string) => r.toUpperCase() === 'SUPER_ADMIN');
                    const isPatient = user?.role === 'PATIENT';

                    if (!isSuperAdmin && user?.clinics && user.clinics.length > 1) {
                        // Multiple clinics (patient or staff) → clinic selection
                        navigate('/select-clinic');
                    } else if (isPatient && user?.clinics?.length === 1) {
                        // Patient with single clinic → auto-redirected
                        handleRedirectByRole('PATIENT');
                    } else {
                        const primaryRole = user?.role || (user?.roles && user.roles[0]) || '';
                        handleRedirectByRole(primaryRole);
                    }
                }
            } else {
                setError(result?.error || 'Login failed. Please try again.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Unable to connect to service. Try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await confirmOTP(email, otp);

            if (result.success) {
                const user = result.user;
                const isSuperAdmin = user?.roles?.some((r: string) => r.toUpperCase() === 'SUPER_ADMIN');
                const isPatient = user?.role === 'PATIENT';

                if (!isSuperAdmin && user?.clinics && user.clinics.length > 1) {
                    navigate('/select-clinic');
                } else if (isPatient && user?.clinics?.length === 1) {
                    handleRedirectByRole('PATIENT');
                } else {
                    const primaryRole = user?.role || (user?.roles && user.roles[0]) || '';
                    handleRedirectByRole(primaryRole);
                }
            } else {
                setError(result.error || 'Invalid or expired verification code');
            }
        } catch (err) {
            setError('Verification failed. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        performLogin(email, password);
    };

    const isLocked = !!(lockoutTime && lockoutTime > Date.now());

    return (
        <div className="login-container">
            <div className="login-layout-wrapper">
                <div className="login-card">
                    <div className="login-header">
                        <div className="brand-icon-wrapper mb-md">
                            <img src="/sidebar-logo.jpg" alt="Exclusive Vision Logo" className="brand-icon-img-login" />
                        </div>
                        <h1 className="login-title">Exclusive Vision</h1>
                        <h2 className="login-subtitle">Hospital Information System</h2>
                    </div>

                    {step === 'login' ? (
                        <form className="login-form" onSubmit={handleSubmit}>
                            {error && (
                                <div className="error-message">
                                    <FiAlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {isLocked && (
                                <div className="lockout-message">
                                    <FiClock size={18} />
                                    <div>
                                        <strong>Account Locked</strong>
                                        <p>Too many failed attempts. Try again in {getRemainingLockoutTime()}</p>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="email">Work Email *</label>
                                <div className="input-with-icon">
                                    <FiMail className="input-icon" />
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="name@ev.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLocked}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Security Password *</label>
                                <div className="input-with-icon">
                                    <FiLock className="input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLocked}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-options">
                                <label className="remember-me">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        disabled={isLocked}
                                    />
                                    <span>Remember credentials</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className={`btn btn-no-hover btn-full ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading || isLocked}
                            >
                                {isLoading ? 'Verifying Credentials...' : 'Access Dashboard'}
                            </button>

                            <div style={{ marginTop: '15px', fontSize: '11px', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => performLogin('superadmin@evclinic.demo', 'admin123')}>superadmin</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => performLogin('admin@evclinic.demo', 'admin123')}>admin</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => performLogin('doctor@evclinic.demo', 'admin123')}>doctor</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => performLogin('reception@evclinic.demo', 'admin123')}>receptionist</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => performLogin('pharmacy@evclinic.demo', 'admin123')}>pharmacy</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => performLogin('lab@evclinic.demo', 'admin123')}>lab tech</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => performLogin('radiology@evclinic.demo', 'admin123')}>radiology</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => performLogin('accountant@evclinic.demo', 'admin123')}>accountant</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => performLogin('doccontrol@evclinic.demo', 'admin123')}>document controller</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => performLogin('patient@evclinic.demo', 'admin123')}>patient</span>
                            </div>
                        </form>
                    ) : (
                        <form className="login-form" onSubmit={handleVerifyOTP}>
                            <div className="otp-explanation mb-lg">
                                <div className="shield-icon-wrap">
                                    <FiShield />
                                </div>
                                <h3>Two-Step Verification</h3>
                                <p>We've sent a 6-digit code to <strong>{email}</strong>. Enter it below to secure your session.</p>
                            </div>

                            {error && (
                                <div className="error-message">
                                    <FiAlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="otp">Verification Code</label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        id="otp"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        required
                                        autoFocus
                                        className="otp-input-field"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`btn btn-no-hover btn-full ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading || otp.length < 6}
                            >
                                {isLoading ? 'Verifying OTP...' : 'Confirm & Login'}
                            </button>

                            <button
                                type="button"
                                className="btn-link mt-md"
                                onClick={() => setStep('login')}
                                style={{ display: 'block', margin: '1rem auto', border: 'none', background: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Back to Login
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
