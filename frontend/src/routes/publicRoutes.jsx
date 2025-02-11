import { Route, Routes, Navigate } from 'react-router-dom';
import Login from '../components/Login';
import Register from '../components/Register';

const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default PublicRoutes;
