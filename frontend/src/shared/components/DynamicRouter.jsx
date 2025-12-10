import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Registry from '../../config/ComponentRegistry';
import routesConfig from '../../config/routes.config.json';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;

  return children;
};

const DynamicRouter = () => {
  return (
    <Routes>
      {routesConfig.map((route, index) => {
        const Component = Registry[route.component];
        if (!Component) {
            console.warn(`Component ${route.component} not found in registry`);
            return null;
        }

        const Element = (
          <React.Suspense fallback={<div className="loading-spinner"></div>}>
             <Component />
          </React.Suspense>
        );

        return (
          <Route 
            key={index} 
            path={route.path} 
            element={
              route.protected ? (
                <ProtectedRoute role={route.role}>
                  {Element}
                </ProtectedRoute>
              ) : Element
            } 
          />
        );
      })}
    </Routes>
  );
};

export default DynamicRouter;
