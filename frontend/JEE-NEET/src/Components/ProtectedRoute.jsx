import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { user } = useAuth();

    // If user is not logged in, redirect to login page
    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
