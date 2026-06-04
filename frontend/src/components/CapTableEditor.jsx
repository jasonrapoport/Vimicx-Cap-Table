import React, { useState } from 'react';
import { Plus, Trash2, Edit, Search } from 'lucide-react';

export default function CapTableEditor({ data, onUpdate }) {
  const { shareholders = [], shareClasses = [] } = data;
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeShareholder, setActiveShareholder] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('employee');
  const [shareClassId, setShareClassId] = useState('');
  const [shares, setShares] = useState(0);

  // Initialize form for adding
  const openAddModal = () => {
    setName('');
    setType('employee');
    // Default to the first share class (usually Common)
    setShareClassId(shareClasses[0]?.id || '');
    setShares(100000);
    setIsAddOpen(true);
  };

  // Initialize form for editing
  const openEditModal = (sh) => {
    setActiveShareholder(sh);
    setName(sh.name);
    setType(sh.type);
    setShareClassId(sh.shareClassId);
    setShares(sh.shares);
    setIsEditOpen(true);
  };

  // Handle Add
  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newShareholder = {
      id: `sh-${Date.now()}`,
      name,
      type,
      shareClassId,
      shares: Number(shares)
    };

    const updatedShareholders = [...shareholders, newShareholder];
    onUpdate({ ...data, shareholders: updatedShareholders });
    setIsAddOpen(false);
  };

  // Handle Edit Save
  const handleEditSave = (e) => {
    e.preventDefault();
    if (!activeShareholder || !name.trim()) return;

    const updatedShareholders = shareholders.map(sh => {
      if (sh.id === activeShareholder.id) {
        return {
          ...sh,
          name,
          type,
          shareClassId,
          shares: Number(shares)
        };
      }
      return sh;
    });

    onUpdate({ ...data, shareholders: updatedShareholders });
    setIsEditOpen(false);
    setActiveShareholder(null);
  };

  // Handle Delete
  const handleDelete = (id) => {
    // Safety check: Don't allow deleting option pools
    if (id === 'sh-employee-pool-unallocated' || id === 'sh-employee-pool-allocated') {
      alert("This row is required for option pool conversions and cannot be deleted. You can edit its shares instead.");
      return;
    }

    if (window.confirm("Are you sure you want to remove this shareholder?")) {
      const updatedShareholders = shareholders.filter(sh => sh.id !== id);
      onUpdate({ ...data, shareholders: updatedShareholders });
    }
  };

  // Filter and search logic
  const filteredShareholders = shareholders.filter(sh => {
    const matchesSearch = sh.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || sh.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalShares = shareholders.reduce((sum, s) => sum + s.shares, 0);

  const getAvatarColor = (type) => {
    switch (type) {
      case 'founder': return '#6366f1';
      case 'employee': return '#06b6d4';
      case 'investor': return '#10b981';
      default: return '#64748b';
    }
  };

  const getShareClassName = (id) => {
    const sc = shareClasses.find(c => c.id === id);
    return sc ? sc.name : 'Unknown';
  };

  return (
    <div className="glass-card fade-in">
      <div className="card-title-bar">
        <h2 className="card-title">Manage Shareholders</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add Shareholder
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search shareholder name..."
            style={{ width: '100%', paddingLeft: '36px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select 
            className="form-select" 
            style={{ height: '100%', minWidth: '150px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="founder">Founders</option>
            <option value="employee">Employees</option>
            <option value="investor">Investors</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Shareholder Name</th>
              <th>Type</th>
              <th>Share Class</th>
              <th>Shares Owned</th>
              <th>Percentage</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredShareholders.length > 0 ? (
              filteredShareholders.map(sh => {
                const percentage = totalShares > 0 ? (sh.shares / totalShares) * 100 : 0;
                const isSpecialOptionPool = sh.id === 'sh-employee-pool-unallocated' || sh.id === 'sh-employee-pool-allocated';
                
                return (
                  <tr key={sh.id}>
                    <td>
                      <div className="shareholder-cell">
                        <div 
                          className="shareholder-avatar" 
                          style={{ backgroundColor: getAvatarColor(sh.type) }}
                        >
                          {sh.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{sh.name}</div>
                          {isSpecialOptionPool && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-info)' }}>System Managed Pool Row</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${sh.type}`}>
                        {sh.type}
                      </span>
                    </td>
                    <td>{getShareClassName(sh.shareClassId)}</td>
                    <td style={{ fontWeight: 600 }}>{sh.shares.toLocaleString()}</td>
                    <td>{percentage.toFixed(2)}%</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(sh)}
                          title="Edit shares"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(sh.id)}
                          disabled={isSpecialOptionPool}
                          style={{ opacity: isSpecialOptionPool ? 0.3 : 1 }}
                          title={isSpecialOptionPool ? "System row cannot be deleted" : "Delete shareholder"}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  No shareholders found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAdd}>
            <div className="modal-header">
              <h3 className="modal-title">Add Shareholder</h3>
              <button type="button" className="modal-close" onClick={() => setIsAddOpen(false)}>&times;</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stakeholder Type</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="founder">Founder</option>
                <option value="employee">Employee</option>
                <option value="investor">Investor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Share Class</label>
              <select className="form-select" value={shareClassId} onChange={(e) => setShareClassId(e.target.value)}>
                {shareClasses.map(sc => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Shares</label>
              <input 
                type="number" 
                className="form-input" 
                min="1"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                required
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Shareholder</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleEditSave}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Shareholder</h3>
              <button type="button" className="modal-close" onClick={() => setIsEditOpen(false)}>&times;</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={activeShareholder?.id === 'sh-employee-pool-unallocated' || activeShareholder?.id === 'sh-employee-pool-allocated'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stakeholder Type</label>
              <select 
                className="form-select" 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                disabled={activeShareholder?.id === 'sh-employee-pool-unallocated' || activeShareholder?.id === 'sh-employee-pool-allocated'}
              >
                <option value="founder">Founder</option>
                <option value="employee">Employee</option>
                <option value="investor">Investor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Share Class</label>
              <select 
                className="form-select" 
                value={shareClassId} 
                onChange={(e) => setShareClassId(e.target.value)}
                disabled={activeShareholder?.id === 'sh-employee-pool-unallocated' || activeShareholder?.id === 'sh-employee-pool-allocated'}
              >
                {shareClasses.map(sc => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Shares</label>
              <input 
                type="number" 
                className="form-input" 
                min="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                required
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setIsEditOpen(false); setActiveShareholder(null); }}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
