import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserCircle, Briefcase, Bell } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import History from './pages/History';
import Candidates from './pages/Candidates';
import Landing from './pages/Landing';

const Sidebar = () => {
  const location = useLocation();
  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/profile', name: 'Profile', icon: <UserCircle size={20} /> },
    { path: '/history', name: 'Applied Jobs', icon: <Briefcase size={20} /> },
    { path: '/candidates', name: 'Find Candidates', icon: <Bell size={20} /> },
  ];

  return (
    <div className="glass-card" style={{ height: 'calc(100vh - 40px)', width: '260px', position: 'fixed', left: '20px', top: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '20px' }}>
        JobBot AI
      </h2>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div style={{ paddingLeft: isLanding ? '0' : '300px', paddingRight: isLanding ? '0' : '20px', paddingTop: isLanding ? '0' : '20px' }}>
      {!isLanding && <Sidebar />}
      <main style={{ maxWidth: isLanding ? '100%' : '1200px', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<History />} />
          <Route path="/candidates" element={<Candidates />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
