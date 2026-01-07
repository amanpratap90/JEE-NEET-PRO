import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
    const { user } = useAuth();

    // If user is not logged in OR not admin, redirect
    // If not logged in -> Login
    // If logged in but not admin -> Home
    if (!user) return <Navigate to="/login" replace />;

    return user.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;
