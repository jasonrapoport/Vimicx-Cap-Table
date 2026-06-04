import React, { useState, useEffect } from 'react';
import { simulateDilution } from '../utils/dilutionMath';
import { Play, Calculator, Terminal, TrendingDown, RefreshCw } from 'lucide-react';

export default function DilutionSimulator({ data }) {
  const [preMoneyValuation, setPreMoneyValuation] = useState('12000000'); // $12M
  const [investmentAmount, setInvestmentAmount] = useState('3000000');   // $3M
  const [targetOptionPoolPercent, setTargetOptionPoolPercent] = useState(15); // 15%
  const [optionPoolIncreaseType, setOptionPoolIncreaseType] = useState('dilute_pre_round');
  const [conversionDate, setConversionDate] = useState(new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState(null);

  // Recalculate simulation results when inputs or base data changes
  useEffect(() => {
    if (data && data.shareholders && data.shareholders.length > 0) {
      const parsedValuation = preMoneyValuation === '' ? 0 : Number(preMoneyValuation);
      const parsedInvestment = investmentAmount === '' ? 0 : Number(investmentAmount);

      const simResults = simulateDilution(data, {
        preMoneyValuation: parsedValuation,
        investmentAmount: parsedInvestment,
        targetOptionPoolPercent: Number(targetOptionPoolPercent) / 100,
        optionPoolIncreaseType,
        conversionDate
      });
      setResults(simResults);
    }
  }, [data, preMoneyValuation, investmentAmount, targetOptionPoolPercent, optionPoolIncreaseType, conversionDate]);

  if (!results) {
    return <div className="empty-state">Loading simulator...</div>;
  }

  const { summary, shareholders = [], convertingSecurities = [], logs = [] } = results;

  return (
    <div className="fade-in">
      <div className="simulator-layout">
        
        {/* Simulator Controls Sidebar */}
        <div className="glass-card simulator-sidebar">
          <h3 className="card-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={18} style={{ color: 'var(--color-primary)' }} />
            Deal Terms
          </h3>

          <div className="form-group">
            <label className="form-label">Pre-Money Valuation ($)</label>
            <input
              type="number"
              className="form-input"
              value={preMoneyValuation}
              onChange={(e) => setPreMoneyValuation(e.target.value)}
              step="100000"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Investment ($)</label>
            <input
              type="number"
              className="form-input"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              step="100000"
            />
          </div>

          <div className="slider-group">
            <div className="slider-header">
              <label className="form-label">Post-Round Option Pool</label>
              <span className="slider-val">{targetOptionPoolPercent}%</span>
            </div>
            <input
              type="range"
              className="slider-input"
              min="0"
              max="30"
              step="1"
              value={targetOptionPoolPercent}
              onChange={(e) => setTargetOptionPoolPercent(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Option Pool Expansion</label>
            <select
              className="form-select"
              value={optionPoolIncreaseType}
              onChange={(e) => setOptionPoolIncreaseType(e.target.value)}
            >
              <option value="dilute_pre_round">Dilute existing holders (Pre-round)</option>
              <option value="no_increase">No option pool increase</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes Conversion Date</label>
            <input
              type="date"
              className="form-input"
              value={conversionDate}
              onChange={(e) => setConversionDate(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
            💡 Adjust terms above to see dilution effects and conversion share prices update in real-time.
          </div>
        </div>

        {/* Simulator Results Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Post-Round Metrics */}
          <div className="metrics-grid" style={{ marginBottom: 0 }}>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div className="metric-header" style={{ marginBottom: '0.5rem' }}>Post-Money Valuation</div>
              <div className="metric-value" style={{ fontSize: '1.5rem' }}>
                ${summary.postMoneyValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="metric-sub">Pre-Money + New Investment + SAFEs</div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div className="metric-header" style={{ marginBottom: '0.5rem' }}>Round Share Price</div>
              <div className="metric-value" style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>
                ${summary.roundPrice.toFixed(4)}
              </div>
              <div className="metric-sub">Per post-round preferred share</div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div className="metric-header" style={{ marginBottom: '0.5rem' }}>New Shares Issued</div>
              <div className="metric-value" style={{ fontSize: '1.5rem' }}>
                {summary.newSharesIssued.toLocaleString()}
              </div>
              <div className="metric-sub">To new round investors</div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div className="metric-header" style={{ marginBottom: '0.5rem' }}>Option Pool Created</div>
              <div className="metric-value" style={{ fontSize: '1.5rem' }}>
                {summary.optionsIncrease.toLocaleString()}
              </div>
              <div className="metric-sub">Additional unallocated option shares</div>
            </div>
          </div>

          {/* side-by-side comparison table */}
          <div className="glass-card">
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Pre-Round vs. Post-Round Ownership</h3>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Shareholder</th>
                    <th>Type</th>
                    <th>Pre-Round Shares</th>
                    <th>Pre-Round %</th>
                    <th>Post-Round Shares</th>
                    <th>Post-Round %</th>
                    <th>Dilution</th>
                  </tr>
                </thead>
                <tbody>
                  {shareholders.map(sh => {
                    const dilutionRelative = sh.prePercentage > 0 
                      ? ((sh.postPercentage - sh.prePercentage) / sh.prePercentage) * 100 
                      : 0;

                    return (
                      <tr key={sh.id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{sh.name}</td>
                        <td>
                          <span className={`badge badge-${sh.type}`}>
                            {sh.type}
                          </span>
                        </td>
                        <td>{sh.preShares.toLocaleString()}</td>
                        <td>{sh.prePercentage.toFixed(2)}%</td>
                        <td style={{ fontWeight: 600 }}>{sh.shares.toLocaleString()}</td>
                        <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{sh.postPercentage.toFixed(2)}%</td>
                        <td>
                          {sh.prePercentage === 0 ? (
                            <span style={{ color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 600 }}>New Entrant</span>
                          ) : dilutionRelative < 0 ? (
                            <span style={{ color: 'var(--color-error)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                              <TrendingDown size={12} /> {dilutionRelative.toFixed(1)}%
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>0.0%</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SAFE / Note conversion detail table */}
          {convertingSecurities.length > 0 && (
            <div className="glass-card">
              <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>SAFE & Note Conversions</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Security</th>
                      <th>Investment</th>
                      <th>Converting Debt</th>
                      <th>Conversion Price</th>
                      <th>Shares Issued</th>
                      <th>Conversion Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convertingSecurities.map(cs => (
                      <tr key={cs.id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{cs.name}</td>
                        <td>${cs.amount.toLocaleString()}</td>
                        <td style={{ fontWeight: 600 }}>${cs.accruedDebt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td>${cs.conversionPrice.toFixed(4)}</td>
                        <td style={{ fontWeight: 600 }}>{cs.shares.toLocaleString()}</td>
                        <td>
                          <span className="badge badge-investor" style={{ textTransform: 'none' }}>
                            {cs.conversionMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Math logs */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 className="logs-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={16} style={{ color: 'var(--color-success)' }} />
              Math & Calculation Engine Console
            </h3>
            <div className="logs-console">
              {logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '0.25rem' }}>
                  {log.startsWith(' -') || log.startsWith('  ') ? (
                    <span style={{ color: 'var(--color-text-secondary)', paddingLeft: '1rem' }}>{log}</span>
                  ) : log.includes('✅') || log.includes('success') ? (
                    <span style={{ color: 'var(--color-success)' }}>{log}</span>
                  ) : log.includes('Solver') || log.includes('circular') ? (
                    <span style={{ color: 'var(--color-info)' }}>{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
