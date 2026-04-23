import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Lobby from './pages/Lobby';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';
import Challenges from './pages/Challenges';
import Play from './pages/Play';
import Admin from './pages/Admin';
import Leaderboard from './pages/Leaderboard';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/lobby/:caseId"
                element={
                  <PrivateRoute>
                    <Lobby />
                  </PrivateRoute>
                }
              />
              <Route
                path="/lobby"
                element={
                  <PrivateRoute>
                    <Lobby />
                  </PrivateRoute>
                }
              />
              <Route
                path="/cases"
                element={
                  <PrivateRoute>
                    <CaseList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/cases/:id"
                element={
                  <PrivateRoute>
                    <CaseDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/play/:caseId"
                element={
                  <PrivateRoute>
                    <Play />
                  </PrivateRoute>
                }
              />
              <Route
                path="/challenges/:caseId"
                element={
                  <PrivateRoute>
                    <Challenges />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <Admin />
                  </PrivateRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <PrivateRoute>
                    <Leaderboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
