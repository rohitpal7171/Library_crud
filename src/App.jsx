import { useEffect } from 'react';
import { useFirebase } from './context/Firebase';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import './App.css';
import Dashboard from './pages/HomePage/Dashboard';
import StudentDashboard from './pages/HomePage/StudentDashboard';
import { LoginPage } from './pages/Auth/LoginPage';
import { LinearProgress } from '@mui/material';

function App() {
  const { firebaseUser, firebaseAuthLoading } = useFirebase() || {};

  useEffect(() => {
    if (firebaseAuthLoading) return; // wait for auth to resolve
    if (!firebaseUser) {
      // not logged in → route to /login or show guest UI
      console.log('User is logged out');
    } else {
      console.log('User is logged in:', firebaseUser.uid);
    }
  }, [firebaseAuthLoading, firebaseUser]);

  if (firebaseAuthLoading) return <LinearProgress />;

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={!firebaseUser ? <LoginPage /> : <Navigate to="/" replace />} />
      {/* Protected Routes */}
      <Route path="/" element={firebaseUser ? <HomePage /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<StudentDashboard />} />
      </Route>
      {/* Catch-all: redirect unknown routes */}
      <Route path="*" element={<Navigate to={firebaseUser ? '/' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
