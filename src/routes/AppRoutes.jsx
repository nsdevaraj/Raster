import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './Home.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
