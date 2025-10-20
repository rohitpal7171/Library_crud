import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { FirebaseProvider } from './context/Firebase.jsx';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from './components/customComponents/CustomNotifications.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <FirebaseProvider>
        <SnackbarProvider>
          <App />
        </SnackbarProvider>
      </FirebaseProvider>
    </BrowserRouter>
  </StrictMode>
);
