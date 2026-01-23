import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_BACKEND_URL}/api/check-auth`,
                    { credentials: 'include' }
                );

                if (res.ok) {
                    setIsAuthenticated(true);
                    const data = await res.json();
                    sessionStorage.setItem("email", data.email); // set email address for iframe
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    if (isAuthenticated === null) {
        return <div>Loading...</div>;
    }
    if(!sessionStorage.getItem("email")){
        window.location.reload()
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
}

export default PrivateRoute;