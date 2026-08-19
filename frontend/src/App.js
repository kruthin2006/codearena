import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProblemList from './components/ProblemList';
import ProblemDetail from './components/ProblemDetail';
import Submissions from './components/Submissions';
import CreateProblem from './components/CreateProblem';
import AdminDashboard from './components/AdminDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import { startHeartbeat, stopHeartbeat } from './utils/heartbeat';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { token, user } = useAuth();
  return token && user?.role === 'admin' ? children : <Navigate to="/" />;
};

const SetterRoute = ({ children }) => {
  const { token, user } = useAuth();
  return token && (user?.role === 'admin' || user?.role === 'setter') ? children : <Navigate to="/" />;
};

function AppContent() {
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      startHeartbeat(token);
    } else {
      stopHeartbeat();
    }
    return () => {
      stopHeartbeat();
    };
  }, [token]);

  return (
    <>
      <Navbar />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/problems" element={<PrivateRoute><ProblemList /></PrivateRoute>} />
        <Route path="/problems/:id" element={<PrivateRoute><ProblemDetail /></PrivateRoute>} />
        <Route path="/submissions" element={<PrivateRoute><Submissions /></PrivateRoute>} />
        <Route path="/create-problem" element={<SetterRoute><CreateProblem /></SetterRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;