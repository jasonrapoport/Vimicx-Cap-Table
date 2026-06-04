import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Calculator, 
  RefreshCw, 
  Layers 
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import CapTableEditor from './components/CapTableEditor';
import SafeManager from './components/SafeManager';
import DilutionSimulator from './components/DilutionSimulator';
import './App.css';

export default function App() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load Cap Table on mount
  useEffect(() => {
    fetchCapTable();
  }, []);

  const fetchCapTable = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cap-table');
      if (!response.ok) {
        throw new Error(`Failed to load cap table data: ${response.statusText}`);
      }
      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updatedData) => {
    setData(updatedData); // optimistic update
    setSaving(true);
    try {
      const response = await fetch('/api/cap-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });
      if (!response.ok) {
        throw new Error('Failed to save updated cap table data');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to persist changes to the server. Working locally.');
      // Keep local state anyway
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset the cap table to the default seed template? All custom edits will be lost.")) {
      setLoading(true);
      try {
        const response = await fetch('/api/cap-table/reset', {
          method: 'POST'
        });
        if (!response.ok) {
          throw new Error('Failed to reset cap table data');
        }
        const resJson = await response.json();
        setData(resJson.data);
      } catch (err) {
        console.error(err);
        setError('Failed to reset cap table: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getPageHeader = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: "Equity Dashboard",
          subtitle: "Capitalization metrics, allocation splits, and company value breakdown."
        };
      case 'cap-table':
        return {
          title: "Shareholder Register",
          subtitle: "Detailed table of common and preferred shareholders and system option pools."
        };
      case 'safes':
        return {
          title: "SAFE & Convertible Securities",
          subtitle: "Manage pre/post-money SAFEs and interest-bearing convertible notes."
        };
      case 'simulator':
        return {
          title: "Dilution & Deal Terms Tester",
          subtitle: "Model new investment rounds, option pool increases, and SAFE conversion pricing."
        };
      default:
        return { title: "Vimicx Cap Table", subtitle: "Financial purposes only" };
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-sans)'
      }}>
        <RefreshCw className="spin" size={40} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
        <span>Loading Vimicx Cap Table data...</span>
      </div>
    );
  }

  const { title, subtitle } = getPageHeader();

  return (
    <div className="app-container">
      
      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">
            <Layers size={18} style={{ color: '#ffffff' }} />
          </div>
          <div>
            <h1 className="logo-text">VIMICX</h1>
            <div className="logo-subtitle">Cap Table Visualizer</div>
          </div>
        </div>

        <nav className="nav-links">
          <li 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard className="nav-icon" />
            <span>Dashboard</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'cap-table' ? 'active' : ''}`}
            onClick={() => setActiveTab('cap-table')}
          >
            <Users className="nav-icon" />
            <span>Shareholders</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'safes' ? 'active' : ''}`}
            onClick={() => setActiveTab('safes')}
          >
            <ShieldAlert className="nav-icon" />
            <span>SAFEs & Notes</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Calculator className="nav-icon" />
            <span>Dilution Tester</span>
          </li>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', marginBottom: '1.25rem', justifyContent: 'center' }}
            onClick={handleReset}
          >
            <RefreshCw size={14} /> Reset to Seed Data
          </button>
          
          <div className="company-badge">
            <div className="company-avatar">
              VX
            </div>
            <div className="company-info">
              <span className="company-name">{data?.companyName || 'Vimicx Inc.'}</span>
              <span className="company-type">Seed Stage • Financials</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="main-content">
        <header className="page-header">
          <div className="header-title-area">
            <h2 className="page-title">{title}</h2>
            <span className="page-subtitle">{subtitle}</span>
          </div>

          <div className="header-actions">
            {saving && (
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontSize: '0.8rem', 
                color: 'var(--color-success)',
                fontWeight: 500
              }}>
                <RefreshCw className="spin" size={12} /> Auto-saving...
              </span>
            )}
            {error && (
              <span style={{ 
                fontSize: '0.8rem', 
                color: 'var(--color-error)',
                fontWeight: 500
              }}>
                ⚠️ {error}
              </span>
            )}
          </div>
        </header>

        {/* Dynamic Views */}
        {activeTab === 'dashboard' && data && (
          <Dashboard data={data} />
        )}
        {activeTab === 'cap-table' && data && (
          <CapTableEditor data={data} onUpdate={handleUpdate} />
        )}
        {activeTab === 'safes' && data && (
          <SafeManager data={data} onUpdate={handleUpdate} />
        )}
        {activeTab === 'simulator' && data && (
          <DilutionSimulator data={data} />
        )}
      </main>

    </div>
  );
}
