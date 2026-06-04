import React, { useState } from 'react';
import { Plus, Trash2, Edit, AlertCircle } from 'lucide-react';

export default function SafeManager({ data, onUpdate }) {
  const { convertibleSecurities = [] } = data;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeSecurity, setActiveSecurity] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('safe_post_money');
  const [amount, setAmount] = useState(100000);
  const [hasCap, setHasCap] = useState(true);
  const [valuationCap, setValuationCap] = useState(5000000);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountRate, setDiscountRate] = useState(0.8); // 20% discount
  const [interestRate, setInterestRate] = useState(0.06); // 6%
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  const openAddModal = () => {
    setName('');
    setType('safe_post_money');
    setAmount(100000);
    setHasCap(true);
    setValuationCap(5000000);
    setHasDiscount(false);
    setDiscountRate(0.8);
    setInterestRate(0.06);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setIsAddOpen(true);
  };

  const openEditModal = (sec) => {
    setActiveSecurity(sec);
    setName(sec.name);
    setType(sec.type);
    setAmount(sec.amount);
    setHasCap(!!sec.valuationCap);
    setValuationCap(sec.valuationCap || 5000000);
    setHasDiscount(!!(sec.discountRate && sec.discountRate < 1));
    setDiscountRate(sec.discountRate || 0.8);
    setInterestRate(sec.interestRate || 0.06);
    setIssueDate(sec.issueDate || new Date().toISOString().split('T')[0]);
    setIsEditOpen(true);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSecurity = {
      id: `conv-${Date.now()}`,
      name,
      type,
      amount: Number(amount),
      valuationCap: hasCap ? Number(valuationCap) : null,
      discountRate: hasDiscount ? Number(discountRate) : 1.0,
      interestRate: type === 'convertible_note' ? Number(interestRate) : null,
      issueDate: type === 'convertible_note' ? issueDate : null
    };

    const updatedSecurities = [...convertibleSecurities, newSecurity];
    onUpdate({ ...data, convertibleSecurities: updatedSecurities });
    setIsAddOpen(false);
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!activeSecurity || !name.trim()) return;

    const updatedSecurities = convertibleSecurities.map(sec => {
      if (sec.id === activeSecurity.id) {
        return {
          ...sec,
          name,
          type,
          amount: Number(amount),
          valuationCap: hasCap ? Number(valuationCap) : null,
          discountRate: hasDiscount ? Number(discountRate) : 1.0,
          interestRate: type === 'convertible_note' ? Number(interestRate) : null,
          issueDate: type === 'convertible_note' ? issueDate : null
        };
      }
      return sec;
    });

    onUpdate({ ...data, convertibleSecurities: updatedSecurities });
    setIsEditOpen(false);
    setActiveSecurity(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to remove this convertible security?")) {
      const updatedSecurities = convertibleSecurities.filter(sec => sec.id !== id);
      onUpdate({ ...data, convertibleSecurities: updatedSecurities });
    }
  };

  const getFriendlyType = (type) => {
    switch (type) {
      case 'safe_pre_money': return 'Pre-Money SAFE';
      case 'safe_post_money': return 'Post-Money SAFE';
      case 'convertible_note': return 'Convertible Note';
      default: return type;
    }
  };

  return (
    <div className="glass-card fade-in">
      <div className="card-title-bar">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title">Convertible Securities & SAFEs</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Instruments that will convert to equity in a new funding round.
          </span>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add Security
        </button>
      </div>

      <div className="alert-banner alert-banner-info">
        <AlertCircle size={18} />
        <div>
          <strong>Conversion Mechanics:</strong> Post-money SAFEs convert based on target post-money ownership percentages. Pre-money SAFEs and Convertible Notes convert using pre-round cap bases. Notes accrue simple interest until the conversion date.
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Security Name</th>
              <th>Type</th>
              <th>Investment Amount</th>
              <th>Valuation Cap</th>
              <th>Discount Rate</th>
              <th>Note Details</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {convertibleSecurities.length > 0 ? (
              convertibleSecurities.map(sec => (
                <tr key={sec.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{sec.name}</td>
                  <td>
                    <span className={`badge badge-${sec.type.includes('safe') ? 'investor' : 'warning'}`}>
                      {getFriendlyType(sec.type)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>${sec.amount.toLocaleString()}</td>
                  <td>{sec.valuationCap ? `$${sec.valuationCap.toLocaleString()}` : 'None'}</td>
                  <td>{sec.discountRate && sec.discountRate < 1 ? `${((1 - sec.discountRate) * 100).toFixed(0)}% discount (${(sec.discountRate * 100).toFixed(0)}% price)` : 'None'}</td>
                  <td>
                    {sec.type === 'convertible_note' ? (
                      <div style={{ fontSize: '0.75rem' }}>
                        <div>Interest: {((sec.interestRate || 0) * 100).toFixed(1)}%</div>
                        <div>Issued: {sec.issueDate}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>N/A</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(sec)}
                      >
                        <Edit size={12} />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(sec.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  No outstanding convertible securities. Add one above to model its dilution effects.
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
              <h3 className="modal-title">Add Convertible Security</h3>
              <button type="button" className="modal-close" onClick={() => setIsAddOpen(false)}>&times;</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Investor/Security Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Sequoia SAFE"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Security Type</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="safe_post_money">Post-Money SAFE (Standard YC)</option>
                <option value="safe_pre_money">Pre-Money SAFE</option>
                <option value="convertible_note">Convertible Note</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Investment Amount ($)</label>
              <input 
                type="number" 
                className="form-input" 
                min="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {/* Valuation Cap Checkbox & Input */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={hasCap} 
                  onChange={(e) => setHasCap(e.target.checked)}
                />
                Has Valuation Cap
              </label>
              {hasCap && (
                <input 
                  type="number" 
                  className="form-input" 
                  min="10000"
                  value={valuationCap}
                  onChange={(e) => setValuationCap(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Discount Checkbox & Input */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={hasDiscount} 
                  onChange={(e) => setHasDiscount(e.target.checked)}
                />
                Has Conversion Discount
              </label>
              {hasDiscount && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    step="0.01" 
                    min="0.1" 
                    max="0.99"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    required
                    style={{ flexGrow: 1 }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    (e.g., 0.80 = 20% discount)
                  </span>
                </div>
              )}
            </div>

            {/* Convertible Note Extra Fields */}
            {type === 'convertible_note' && (
              <>
                <div className="form-group">
                  <label className="form-label">Annual Interest Rate (decimal)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    step="0.001" 
                    min="0.0" 
                    max="0.25"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Issue Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Security</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleEditSave}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Convertible Security</h3>
              <button type="button" className="modal-close" onClick={() => { setIsEditOpen(false); setActiveSecurity(null); }}>&times;</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Investor/Security Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Security Type</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="safe_post_money">Post-Money SAFE (Standard YC)</option>
                <option value="safe_pre_money">Pre-Money SAFE</option>
                <option value="convertible_note">Convertible Note</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Investment Amount ($)</label>
              <input 
                type="number" 
                className="form-input" 
                min="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {/* Valuation Cap Checkbox & Input */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={hasCap} 
                  onChange={(e) => setHasCap(e.target.checked)}
                />
                Has Valuation Cap
              </label>
              {hasCap && (
                <input 
                  type="number" 
                  className="form-input" 
                  min="10000"
                  value={valuationCap}
                  onChange={(e) => setValuationCap(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Discount Checkbox & Input */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={hasDiscount} 
                  onChange={(e) => setHasDiscount(e.target.checked)}
                />
                Has Conversion Discount
              </label>
              {hasDiscount && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    step="0.01" 
                    min="0.1" 
                    max="0.99"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    required
                    style={{ flexGrow: 1 }}
                  />
                </div>
              )}
            </div>

            {/* Convertible Note Extra Fields */}
            {type === 'convertible_note' && (
              <>
                <div className="form-group">
                  <label className="form-label">Annual Interest Rate (decimal)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    step="0.001" 
                    min="0.0" 
                    max="0.25"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Issue Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setIsEditOpen(false); setActiveSecurity(null); }}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
