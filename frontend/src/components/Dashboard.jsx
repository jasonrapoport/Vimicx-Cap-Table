import React from 'react';
import { PieChart, DollarSign, Users, Briefcase } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard({ data }) {
  const { shareholders = [], shareClasses = [], convertibleSecurities = [] } = data;

  // Calculate Metrics
  const totalShares = shareholders.reduce((sum, s) => sum + s.shares, 0);
  
  // Aggregate by Type (Founder, Employee, Investor)
  const statsByType = shareholders.reduce((acc, sh) => {
    acc[sh.type] = (acc[sh.type] || 0) + sh.shares;
    return acc;
  }, { founder: 0, employee: 0, investor: 0 });

  // Calculate Valuation based on a baseline common price
  const commonClass = shareClasses.find(sc => sc.type === 'common') || { pricePerShare: 1.0 };
  const basePrice = commonClass.pricePerShare || 1.0;
  const impliedValuation = totalShares * basePrice;

  // Option Pool stats
  const unallocatedOption = shareholders.find(s => s.id === 'sh-employee-pool-unallocated') || { shares: 0 };
  const allocatedOption = shareholders.find(s => s.id === 'sh-employee-pool-allocated') || { shares: 0 };
  const totalOptions = unallocatedOption.shares + allocatedOption.shares;
  const optionPoolPercentage = totalShares > 0 ? (totalOptions / totalShares) * 100 : 0;

  // Chart Data
  const chartData = {
    labels: ['Founders', 'Employees & Options', 'Investors'],
    datasets: [
      {
        data: [
          statsByType.founder || 0,
          statsByType.employee || 0,
          statsByType.investor || 0
        ],
        backgroundColor: [
          '#6366f1', // Electric Indigo
          '#06b6d4', // Cyan
          '#10b981'  // Emerald Green
        ],
        borderColor: [
          '#0f1422',
          '#0f1422',
          '#0f1422'
        ],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const val = context.raw || 0;
            const percentage = totalShares > 0 ? ((val / totalShares) * 100).toFixed(2) : 0;
            return ` ${context.label}: ${val.toLocaleString()} shares (${percentage}%)`;
          }
        }
      }
    },
    cutout: '75%'
  };

  return (
    <div className="fade-in">
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="glass-card">
          <div className="metric-header">
            <span>Implied Valuation</span>
            <div className="metric-icon-wrap" style={{ color: '#10b981' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="metric-value">${impliedValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="metric-sub">Based on $${basePrice.toFixed(2)}/share</div>
        </div>

        <div className="glass-card">
          <div className="metric-header">
            <span>Total Outstanding Shares</span>
            <div className="metric-icon-wrap" style={{ color: '#6366f1' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="metric-value">{totalShares.toLocaleString()}</div>
          <div className="metric-sub">Fully diluted capitalization</div>
        </div>

        <div className="glass-card">
          <div className="metric-header">
            <span>Option Pool %</span>
            <div className="metric-icon-wrap" style={{ color: '#06b6d4' }}>
              <Briefcase size={18} />
            </div>
          </div>
          <div className="metric-value">{optionPoolPercentage.toFixed(2)}%</div>
          <div className="metric-sub">
            {totalOptions.toLocaleString()} total pool options
          </div>
        </div>

        <div className="glass-card">
          <div className="metric-header">
            <span>Convertibles/SAFEs</span>
            <div className="metric-icon-wrap" style={{ color: '#f59e0b' }}>
              <PieChart size={18} />
            </div>
          </div>
          <div className="metric-value">
            {convertibleSecurities.length}
          </div>
          <div className="metric-sub">
            ${convertibleSecurities.reduce((sum, s) => sum + s.amount, 0).toLocaleString()} principal value
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="dashboard-grid">
        {/* Share Classes table */}
        <div className="glass-card">
          <div className="card-title-bar">
            <h2 className="card-title">Capitalization Table Summary</h2>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Share Class</th>
                  <th>Type</th>
                  <th>Price Per Share</th>
                  <th>Shares</th>
                  <th>Value</th>
                  <th>% Ownership</th>
                </tr>
              </thead>
              <tbody>
                {shareClasses.map(sc => {
                  const classShares = shareholders
                    .filter(s => s.shareClassId === sc.id)
                    .reduce((sum, s) => sum + s.shares, 0);
                  const classVal = classShares * (sc.pricePerShare || 1.0);
                  const ownership = totalShares > 0 ? (classShares / totalShares) * 100 : 0;
                  
                  return (
                    <tr key={sc.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{sc.name}</td>
                      <td>
                        <span className={`badge badge-${sc.type === 'common' ? 'founder' : 'investor'}`}>
                          {sc.type}
                        </span>
                      </td>
                      <td>${(sc.pricePerShare || 0).toFixed(2)}</td>
                      <td>{classShares.toLocaleString()}</td>
                      <td>${classVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td>{ownership.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Allocation */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Equity Allocation Split</h2>
          
          <div className="chart-container" style={{ flexGrow: 1, position: 'relative' }}>
            <Doughnut data={chartData} options={chartOptions} />
            <div style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Capital</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>100%</span>
            </div>
          </div>

          <div className="chart-legend" style={{ marginTop: '1.5rem' }}>
            <div className="legend-item">
              <span className="legend-label">
                <span className="legend-color-dot" style={{ backgroundColor: '#6366f1' }}></span>
                Founders
              </span>
              <span className="legend-val">
                {totalShares > 0 ? ((statsByType.founder / totalShares) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-label">
                <span className="legend-color-dot" style={{ backgroundColor: '#06b6d4' }}></span>
                Employees & Options
              </span>
              <span className="legend-val">
                {totalShares > 0 ? ((statsByType.employee / totalShares) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-label">
                <span className="legend-color-dot" style={{ backgroundColor: '#10b981' }}></span>
                Investors
              </span>
              <span className="legend-val">
                {totalShares > 0 ? ((statsByType.investor / totalShares) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
