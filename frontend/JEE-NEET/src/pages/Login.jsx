import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to where they wanted to go, or home
    const from = location.state?.from?.pathname || '/';

    // Auto-login check for returning users (restores session if data exists)
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser && !user) {
            // Data exists but session was closed. Restore it now.
            try {
                login({ token, user: JSON.parse(savedUser) });
            } catch (e) {
                // If JSON parse fails, clear invalid data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, []); // Run once on mount

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        }
    }, [user, navigate, from]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/api/v1/auth/login', { email, password });
            const data = res.data; // data is { status: 'success', token, data: { user } }

            // Axios throws an error for non-2xx responses, so we don't need to check response.ok
            // We can check the status from the backend's response body if it's part of the contract
            if (data.status === 'success') {
                login({ user: data.data.user, token: data.token });
                // Navigation handled by useEffect
            } else {
                // This case might not be reached if axios throws on non-success status codes
                // but it's good for explicit backend-defined errors within a 2xx response
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            // Axios throws on error status codes (e.g., 400, 401, 500)
            // The error message from the backend is typically in err.response.data.message
            const msg = err.response?.data?.message || err.message || 'Something went wrong';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Welcome Back</h2>

                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn" style={{ marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign Up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
