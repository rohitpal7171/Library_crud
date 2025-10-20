import { useEffect } from 'react';
import { useFirebase } from './context/Firebase';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import './App.css';

function App() {
  const { user, loading } = useFirebase();

  useEffect(() => {
    if (loading) return; // wait for auth to resolve
    if (!user) {
      // not logged in → route to /login or show guest UI
      console.log('User is logged out');
    } else {
      console.log('User is logged in:', user.uid);
    }
  }, [loading, user]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

export default App;
