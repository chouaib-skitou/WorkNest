import { Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

const PrivateRoutes = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default PrivateRoutes;
