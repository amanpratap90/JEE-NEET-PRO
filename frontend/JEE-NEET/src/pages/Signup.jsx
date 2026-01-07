import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/config';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Signup failed');
            }

            // Auto-login after signup
            login({ user: data.data.user, token: data.token });
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Create Account</h2>

                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

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
                            placeholder="Create a password (min 8 chars)"
                            required
                            minLength={8}
                        />
                    </div>

                    <button type="submit" className="auth-btn" style={{ marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
