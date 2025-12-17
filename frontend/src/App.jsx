import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import './App.css'

function App() {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);

  // Load user from sessionStorage on mount (changed from localStorage)
  useEffect(() => {
    const savedUser = sessionStorage.getItem('userId');
    const savedBusinessId = sessionStorage.getItem('businessId');
    const savedBusinessName = sessionStorage.getItem('businessName');
    const savedBusinessData = sessionStorage.getItem('businessData');
    
    if (savedUser && savedBusinessId) {
      setUser(savedUser);
      
      // Try to parse full business data, or create minimal object
      if (savedBusinessData) {
        try {
          setBusiness(JSON.parse(savedBusinessData));
        } catch (e) {
          setBusiness({ id: savedBusinessId, name: savedBusinessName });
        }
      } else {
        setBusiness({ id: savedBusinessId, name: savedBusinessName });
      }
    }
  }, []);

  const handleLogin = (userId, businessData) => {
    setUser(userId);
    setBusiness(businessData);
    sessionStorage.setItem('userId', userId);
    sessionStorage.setItem('businessId', businessData.id);
    sessionStorage.setItem('businessName', businessData.name);
    sessionStorage.setItem('businessData', JSON.stringify(businessData));
  };

  const handleLogout = () => {
    setUser(null);
    setBusiness(null);
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('businessId');
    sessionStorage.removeItem('businessName');
    sessionStorage.removeItem('businessData');
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/" 
            element={
              user && business ? (
                <Home 
                  userId={user} 
                  business={business} 
                  onLogout={handleLogout} 
                />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App