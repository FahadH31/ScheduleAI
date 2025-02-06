import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
    const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";

    return isAuthenticated ? <Outlet /> : <Navigate to = "/" />
}

export default PrivateRoute;