/**
 * HTML Report Generator Service
 * Generates executive-grade, interactive HTML reports with Chart.js visualizations
 */

import {
  MonthlyReportData,
  UN_DESIGN_TOKENS,
  AGENCY_BRAND_COLORS
} from '../../types/monthlyReport';

export class HTMLReportGenerator {
  /**
   * Generate complete HTML report
   */
  generateHTMLReport(data: MonthlyReportData): string {
    const brandColors = AGENCY_BRAND_COLORS[data.agency.shortName] || AGENCY_BRAND_COLORS['default'] || { primary: '#009EDB', secondary: '#00477E' };
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.agency.shortName} Monthly HR Strategic Insights Report - ${data.reportPeriod.month}</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+Pro:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
  
  <style>
    ${this.generateCSS(brandColors)}
  </style>
</head>
<body>
  <div class="report-container">
    ${this.generateCoverSection(data)}
    ${this.generateExecutiveSummary(data)}
    ${this.generateMarketPositionSection(data)}
    ${this.generateTemporalTrendsSection(data)}
    ${this.generateWorkforceSection(data)}
    ${this.generateCategorySection(data)}
    ${this.generateSkillsSection(data)}
    ${this.generateRecommendationsSection(data)}
    ${this.generateAppendix(data)}
  </div>
  
  <script>
    ${this.generateChartScripts(data)}
  </script>
</body>
</html>`;
  }

  /**
   * Generate CSS styles
   */
  private generateCSS(brandColors: { primary: string; secondary: string }): string {
    return `
    :root {
      --un-blue: ${brandColors.primary};
      --un-navy: ${brandColors.secondary};
      --accent-orange: #F5A623;
      --accent-green: #34C759;
      --accent-red: #FF3B30;
      --neutral-dark: #333333;
      --neutral-medium: #666666;
      --neutral-light: #F5F5F5;
      --white: #FFFFFF;
      
      --font-heading: 'Playfair Display', Georgia, serif;
      --font-body: 'Source Sans Pro', -apple-system, sans-serif;
      --font-data: 'JetBrains Mono', 'Fira Code', monospace;
      
      --shadow-card: 0 2px 8px rgba(0,0,0,0.08);
      --shadow-hover: 0 4px 16px rgba(0,0,0,0.12);
      --border-radius: 8px;
    }
    
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--font-body);
      font-size: 16px;
      line-height: 1.6;
      color: var(--neutral-dark);
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      min-height: 100vh;
    }
    
    .report-container {
      max-width: 1200px;
      margin: 0 auto;
      background: var(--white);
      box-shadow: var(--shadow-hover);
    }
    
    /* Typography */
    h1, h2, h3, h4 {
      font-family: var(--font-heading);
      font-weight: 600;
      line-height: 1.3;
    }
    
    h1 { font-size: 2.5rem; color: var(--un-blue); }
    h2 { font-size: 1.875rem; color: var(--un-navy); margin-bottom: 1.5rem; }
    h3 { font-size: 1.375rem; color: var(--neutral-dark); margin-bottom: 1rem; }
    h4 { font-size: 1.125rem; color: var(--neutral-medium); }
    
    p { margin-bottom: 1rem; }
    
    /* Cover Section */
    .cover-section {
      background: linear-gradient(135deg, var(--un-blue) 0%, var(--un-navy) 100%);
      color: var(--white);
      padding: 80px 60px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .cover-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.5;
    }
    
    .cover-content {
      position: relative;
      z-index: 1;
    }
    
    .cover-section h1 {
      color: var(--white);
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }
    
    .cover-subtitle {
      font-size: 1.5rem;
      opacity: 0.9;
      margin-bottom: 2rem;
    }
    
    .cover-period {
      font-size: 1.25rem;
      opacity: 0.8;
      font-family: var(--font-data);
    }
    
    .cover-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
      margin-top: 3rem;
    }
    
    .cover-metric {
      text-align: center;
    }
    
    .cover-metric-value {
      font-family: var(--font-data);
      font-size: 3rem;
      font-weight: 600;
      display: block;
    }
    
    .cover-metric-label {
      font-size: 0.875rem;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    /* Sections */
    .report-section {
      padding: 60px;
      border-bottom: 1px solid #eee;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 3px solid var(--un-blue);
    }
    
    .section-number {
      font-family: var(--font-data);
      font-size: 0.875rem;
      color: var(--un-blue);
      background: rgba(0, 158, 219, 0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
    }
    
    /* Cards */
    .card {
      background: var(--white);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-card);
      padding: 1.5rem;
      transition: box-shadow 0.2s ease;
    }
    
    .card:hover {
      box-shadow: var(--shadow-hover);
    }
    
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    
    /* Metric Cards */
    .metric-card {
      background: var(--white);
      border-radius: var(--border-radius);
      padding: 1.5rem;
      box-shadow: var(--shadow-card);
      border-left: 4px solid var(--un-blue);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }
    
    .metric-card.highlight {
      border-left-color: var(--accent-green);
      background: linear-gradient(to right, rgba(52, 199, 89, 0.05), transparent);
    }
    
    .metric-card.warning {
      border-left-color: var(--accent-orange);
      background: linear-gradient(to right, rgba(245, 166, 35, 0.05), transparent);
    }
    
    .metric-card.danger {
      border-left-color: var(--accent-red);
      background: linear-gradient(to right, rgba(255, 59, 48, 0.05), transparent);
    }
    
    .metric-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    
    .metric-value {
      font-family: var(--font-data);
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--un-navy);
      line-height: 1;
    }
    
    .metric-label {
      font-size: 0.875rem;
      color: var(--neutral-medium);
      margin-top: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .metric-trend {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      font-size: 0.875rem;
    }
    
    .metric-trend.positive { color: var(--accent-green); }
    .metric-trend.negative { color: var(--accent-red); }
    .metric-trend.neutral { color: var(--neutral-medium); }
    
    .trend-arrow {
      font-weight: bold;
      font-size: 1rem;
    }
    
    .metric-context {
      font-size: 0.75rem;
      color: var(--neutral-medium);
      margin-top: 0.5rem;
    }
    
    /* Signal Cards */
    .signal-card {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: var(--border-radius);
      margin-bottom: 1rem;
    }
    
    .signal-card.warning {
      background: linear-gradient(to right, rgba(245, 166, 35, 0.1), rgba(245, 166, 35, 0.02));
      border-left: 4px solid var(--accent-orange);
    }
    
    .signal-card.opportunity {
      background: linear-gradient(to right, rgba(52, 199, 89, 0.1), rgba(52, 199, 89, 0.02));
      border-left: 4px solid var(--accent-green);
    }
    
    .signal-card.action {
      background: linear-gradient(to right, rgba(0, 158, 219, 0.1), rgba(0, 158, 219, 0.02));
      border-left: 4px solid var(--un-blue);
    }
    
    .signal-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    
    .signal-content h4 {
      font-family: var(--font-body);
      font-weight: 600;
      color: var(--neutral-dark);
      margin-bottom: 0.5rem;
    }
    
    .signal-content p {
      font-size: 0.9375rem;
      color: var(--neutral-medium);
      margin-bottom: 0.75rem;
    }
    
    .signal-action {
      font-size: 0.875rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 4px;
    }
    
    .signal-action strong {
      color: var(--un-navy);
    }
    
    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.9375rem;
    }
    
    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    
    .data-table th {
      background: var(--neutral-light);
      font-weight: 600;
      color: var(--neutral-dark);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.5px;
    }
    
    .data-table tr:hover td {
      background: rgba(0, 158, 219, 0.03);
    }
    
    .data-table .highlight-row td {
      background: rgba(0, 158, 219, 0.08);
      font-weight: 600;
    }
    
    .data-table .rank-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: var(--font-data);
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .rank-badge.top { background: var(--accent-green); color: white; }
    .rank-badge.mid { background: var(--accent-orange); color: white; }
    .rank-badge.low { background: var(--neutral-medium); color: white; }
    
    /* Charts */
    .chart-container {
      background: var(--white);
      border-radius: var(--border-radius);
      padding: 1.5rem;
      box-shadow: var(--shadow-card);
      margin: 1.5rem 0;
    }
    
    .chart-title {
      font-family: var(--font-heading);
      font-size: 1.125rem;
      color: var(--neutral-dark);
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--neutral-light);
    }
    
    .chart-wrapper {
      position: relative;
      height: 300px;
    }
    
    .chart-wrapper.tall {
      height: 400px;
    }
    
    .chart-wrapper.short {
      height: 200px;
    }
    
    /* Two Column Layout */
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    
    .three-column {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    
    /* Recommendation Cards */
    .recommendation-card {
      background: var(--white);
      border-radius: var(--border-radius);
      padding: 1.5rem;
      box-shadow: var(--shadow-card);
      margin-bottom: 1.5rem;
      position: relative;
      padding-left: 2rem;
    }
    
    .recommendation-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 6px;
      border-radius: var(--border-radius) 0 0 var(--border-radius);
    }
    
    .recommendation-card.high::before { background: var(--accent-red); }
    .recommendation-card.medium::before { background: var(--accent-orange); }
    .recommendation-card.low::before { background: var(--accent-green); }
    
    .recommendation-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .priority-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .priority-badge.high { background: rgba(255, 59, 48, 0.1); color: var(--accent-red); }
    .priority-badge.medium { background: rgba(245, 166, 35, 0.1); color: var(--accent-orange); }
    .priority-badge.low { background: rgba(52, 199, 89, 0.1); color: var(--accent-green); }
    
    .recommendation-area {
      font-size: 0.75rem;
      color: var(--neutral-medium);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .recommendation-title {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      color: var(--neutral-dark);
      margin-bottom: 0.75rem;
    }
    
    .recommendation-rationale {
      color: var(--neutral-medium);
      margin-bottom: 1rem;
      font-size: 0.9375rem;
    }
    
    .recommendation-meta {
      display: flex;
      gap: 2rem;
      font-size: 0.875rem;
      padding-top: 1rem;
      border-top: 1px solid var(--neutral-light);
    }
    
    .recommendation-meta dt {
      font-weight: 600;
      color: var(--un-navy);
    }
    
    .recommendation-meta dd {
      color: var(--neutral-medium);
    }
    
    /* Key Findings */
    .key-findings {
      background: linear-gradient(135deg, rgba(0, 158, 219, 0.05) 0%, rgba(0, 71, 126, 0.05) 100%);
      border-radius: var(--border-radius);
      padding: 1.5rem;
      margin: 1.5rem 0;
    }
    
    .key-findings h4 {
      color: var(--un-navy);
      margin-bottom: 1rem;
      font-family: var(--font-body);
      font-weight: 600;
    }
    
    .key-findings ul {
      list-style: none;
    }
    
    .key-findings li {
      padding: 0.75rem 0 0.75rem 2rem;
      position: relative;
      border-bottom: 1px solid rgba(0, 71, 126, 0.1);
    }
    
    .key-findings li:last-child {
      border-bottom: none;
    }
    
    .key-findings li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: var(--un-blue);
      font-weight: bold;
    }
    
    /* Footer */
    .report-footer {
      background: var(--neutral-light);
      padding: 2rem 60px;
      text-align: center;
      font-size: 0.875rem;
      color: var(--neutral-medium);
    }
    
    .report-footer .generated-info {
      margin-bottom: 0.5rem;
    }
    
    .report-footer .data-freshness {
      font-family: var(--font-data);
      font-size: 0.75rem;
    }
    
    /* Print Styles */
    @media print {
      body {
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .report-container {
        box-shadow: none;
        max-width: none;
      }
      
      .report-section {
        page-break-inside: avoid;
      }
      
      .section-header {
        page-break-after: avoid;
      }
      
      .chart-container {
        page-break-inside: avoid;
      }
      
      .metric-card:hover,
      .card:hover {
        transform: none;
        box-shadow: var(--shadow-card);
      }
      
      h2 {
        page-break-after: avoid;
      }
      
      .cover-section {
        page-break-after: always;
      }
    }
    
    @media (max-width: 1024px) {
      .report-section {
        padding: 40px 30px;
      }
      
      .two-column {
        grid-template-columns: 1fr;
      }
      
      .three-column {
        grid-template-columns: 1fr;
      }
      
      .cover-metrics {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 640px) {
      .cover-metrics {
        grid-template-columns: 1fr;
      }
      
      .card-grid {
        grid-template-columns: 1fr;
      }
      
      .metric-value {
        font-size: 2rem;
      }
      
      h1 { font-size: 2rem; }
      h2 { font-size: 1.5rem; }
    }
    `;
  }

  /**
   * Generate cover section
   */
  private generateCoverSection(data: MonthlyReportData): string {
    const exec = data.executiveSummary;
    
    return `
    <section class="cover-section">
      <div class="cover-content">
        <h1>${data.agency.longName}</h1>
        <div class="cover-subtitle">Monthly HR Strategic Insights Report</div>
        <div class="cover-period">${data.reportPeriod.month}</div>
        
        <div class="cover-metrics">
          <div class="cover-metric">
            <span class="cover-metric-value">${exec.totalPostings.toLocaleString()}</span>
            <span class="cover-metric-label">Total Postings</span>
          </div>
          <div class="cover-metric">
            <span class="cover-metric-value">#${exec.marketShareRank}</span>
            <span class="cover-metric-label">Market Rank</span>
          </div>
          <div class="cover-metric">
            <span class="cover-metric-value">${exec.avgApplicationWindow}d</span>
            <span class="cover-metric-label">Avg Window</span>
          </div>
          <div class="cover-metric">
            <span class="cover-metric-value">${exec.competitiveScore}</span>
            <span class="cover-metric-label">Competitive Score</span>
          </div>
        </div>
      </div>
    </section>`;
  }

  /**
   * Generate executive summary section
   */
  private generateExecutiveSummary(data: MonthlyReportData): string {
    const exec = data.executiveSummary;
    const momTrend = exec.momChange >= 0 ? 'positive' : 'negative';
    const momIcon = exec.momChange >= 0 ? '↑' : '↓';
    
    return `
    <section class="report-section" id="executive-summary">
      <div class="section-header">
        <span class="section-number">01</span>
        <h2>Executive Summary</h2>
      </div>
      
      <div class="card-grid">
        <div class="metric-card ${exec.momChange > 20 ? 'highlight' : exec.momChange < -10 ? 'warning' : ''}">
          <div class="metric-icon">📊</div>
          <div class="metric-value">${exec.totalPostings.toLocaleString()}</div>
          <div class="metric-label">Total Postings</div>
          <div class="metric-trend ${momTrend}">
            <span class="trend-arrow">${momIcon}</span>
            <span>${Math.abs(exec.momChange).toFixed(0)}% vs last month</span>
          </div>
          <div class="metric-context">Ranked #${exec.marketShareRank} of ${exec.totalAgencies} agencies</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">🏆</div>
          <div class="metric-value">#${exec.marketShareRank}</div>
          <div class="metric-label">Market Share Rank</div>
          <div class="metric-context">of ${exec.totalAgencies} total agencies</div>
        </div>
        
        <div class="metric-card ${exec.avgApplicationWindow < exec.marketAvgWindow ? 'highlight' : 'warning'}">
          <div class="metric-icon">⏱️</div>
          <div class="metric-value">${exec.avgApplicationWindow}d</div>
          <div class="metric-label">Avg Application Window</div>
          <div class="metric-trend ${exec.avgApplicationWindow <= exec.marketAvgWindow ? 'positive' : 'negative'}">
            vs ${exec.marketAvgWindow}d market average
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">⚡</div>
          <div class="metric-value">${exec.hiringVelocity.toFixed(1)}</div>
          <div class="metric-label">Jobs/Week Velocity</div>
        </div>
        
        <div class="metric-card ${exec.competitiveScore >= 70 ? 'highlight' : exec.competitiveScore < 50 ? 'warning' : ''}">
          <div class="metric-icon">📈</div>
          <div class="metric-value">${exec.competitiveScore}</div>
          <div class="metric-label">Competitive Score</div>
          <div class="metric-context">Out of 100</div>
        </div>
      </div>
      
      <div class="key-findings">
        <h4>🔑 Key Findings</h4>
        <ul>
          ${exec.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
        </ul>
      </div>
      
      <div class="two-column">
        <div class="chart-container">
          <h4 class="chart-title">At-a-Glance Comparison</h4>
          ${this.generateComparisonTable(exec.comparisonTable)}
        </div>
        
        <div class="chart-container">
          <h4 class="chart-title">Multi-Dimensional Performance</h4>
          <div class="chart-wrapper">
            <canvas id="radarChart"></canvas>
          </div>
        </div>
      </div>
    </section>`;
  }

  /**
   * Generate comparison table HTML
   */
  private generateComparisonTable(table: any[]): string {
    if (!table || table.length === 0) {
      return '<p>No comparison data available</p>';
    }
    
    return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Your Agency</th>
          <th>Market Avg</th>
          <th>Top Performer</th>
          <th>Your Rank</th>
        </tr>
      </thead>
      <tbody>
        ${table.map(row => `
        <tr>
          <td><strong>${row.metric}</strong></td>
          <td>${row.yourAgency}</td>
          <td>${row.marketAvg}</td>
          <td>${row.topPerformer.value} (${row.topPerformer.agency})</td>
          <td><span class="rank-badge ${row.yourRank <= 5 ? 'top' : row.yourRank <= 15 ? 'mid' : 'low'}">#${row.yourRank}</span></td>
        </tr>
        `).join('')}
      </tbody>
    </table>`;
  }

  /**
   * Generate Market Position section
   */
  private generateMarketPositionSection(data: MonthlyReportData): string {
    const comp = data.competitive;
    
    return `
    <section class="report-section" id="market-position">
      <div class="section-header">
        <span class="section-number">02</span>
        <h2>Market Position & Competitive Intelligence</h2>
      </div>
      
      <h3>2.1 Market Share Analysis</h3>
      
      <div class="two-column">
        <div class="chart-container">
          <h4 class="chart-title">Market Share Evolution (6 Months)</h4>
          <div class="chart-wrapper">
            <canvas id="marketShareTrendChart"></canvas>
          </div>
        </div>
        
        <div class="chart-container">
          <h4 class="chart-title">Agency Positioning Matrix</h4>
          <div class="chart-wrapper tall">
            <canvas id="positioningScatterChart"></canvas>
          </div>
        </div>
      </div>
      
      <h3>2.2 Competitive Intelligence Deep-Dive</h3>
      
      <div class="chart-container">
        <h4 class="chart-title">Top Competitors Analysis</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>Agency</th>
              <th>Volume</th>
              <th>Growth</th>
              <th>Category Overlap</th>
              <th>Threat Level</th>
            </tr>
          </thead>
          <tbody>
            ${comp.topCompetitors.slice(0, 5).map(c => `
            <tr>
              <td><strong>${c.agency}</strong></td>
              <td>${c.volume.toLocaleString()}</td>
              <td class="${c.growth >= 0 ? 'positive' : 'negative'}">${c.growth >= 0 ? '+' : ''}${c.growth.toFixed(0)}%</td>
              <td>${c.categoryOverlap} categories</td>
              <td>
                <span class="rank-badge ${c.threatLevel === 'high' ? 'high' : c.threatLevel === 'medium' ? 'mid' : 'low'}" 
                      style="background: ${c.threatLevel === 'high' ? 'var(--accent-red)' : c.threatLevel === 'medium' ? 'var(--accent-orange)' : 'var(--accent-green)'}">
                  ${c.threatLevel.toUpperCase()}
                </span>
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <h3>2.3 Talent War Zones</h3>
      
      <div class="chart-container">
        <h4 class="chart-title">Category Competition Heatmap</h4>
        <div class="chart-wrapper tall">
          <canvas id="talentWarZoneChart"></canvas>
        </div>
      </div>
      
      <h3>2.4 Strategic Intelligence Signals</h3>
      
      <div class="signals-container">
        ${comp.strategicSignals.map(signal => `
        <div class="signal-card ${signal.type}">
          <div class="signal-icon">${signal.type === 'warning' ? '⚠️' : signal.type === 'opportunity' ? '📈' : '🎯'}</div>
          <div class="signal-content">
            <h4>${signal.title}</h4>
            <p>${signal.description}</p>
          </div>
        </div>
        `).join('')}
      </div>
    </section>`;
  }

  /**
   * Generate Temporal Trends section
   */
  private generateTemporalTrendsSection(data: MonthlyReportData): string {
    const temporal = data.temporal;
    const appWin = temporal.applicationWindows;
    
    return `
    <section class="report-section" id="temporal-trends">
      <div class="section-header">
        <span class="section-number">03</span>
        <h2>Hiring Activity & Temporal Trends</h2>
      </div>
      
      <h3>3.1 Volume Trends</h3>
      
      <div class="two-column">
        <div class="chart-container">
          <h4 class="chart-title">Posted vs. Open Jobs Timeline</h4>
          <div class="chart-wrapper">
            <canvas id="postedVsOpenChart"></canvas>
          </div>
        </div>
        
        <div class="chart-container">
          <h4 class="chart-title">Net Change Waterfall</h4>
          <div class="chart-wrapper">
            <canvas id="waterfallChart"></canvas>
          </div>
        </div>
      </div>
      
      <h3>3.2 Seasonal Patterns</h3>
      
      <div class="chart-container">
        <h4 class="chart-title">Historical Seasonal Pattern</h4>
        <div class="chart-wrapper">
          <canvas id="seasonalHeatmapChart"></canvas>
        </div>
      </div>
      
      <div class="two-column" style="margin-top: 1.5rem;">
        <div class="card">
          <h4>🔥 High Activity Months</h4>
          <p style="font-family: var(--font-data); color: var(--accent-green); font-size: 1.125rem;">
            ${temporal.seasonalPattern.highMonths.join(', ') || 'No distinct pattern'}
          </p>
        </div>
        <div class="card">
          <h4>❄️ Low Activity Months</h4>
          <p style="font-family: var(--font-data); color: var(--accent-orange); font-size: 1.125rem;">
            ${temporal.seasonalPattern.lowMonths.join(', ') || 'No distinct pattern'}
          </p>
        </div>
      </div>
      
      <h3>3.3 Application Window Analysis</h3>
      
      <div class="two-column">
        <div class="card-grid" style="grid-template-columns: repeat(2, 1fr);">
          <div class="metric-card ${appWin.urgent.percentage > 30 ? 'warning' : ''}">
            <div class="metric-icon">⚡</div>
            <div class="metric-value">${appWin.urgent.percentage.toFixed(0)}%</div>
            <div class="metric-label">Urgent (0-14 days)</div>
            <div class="metric-context">${appWin.urgent.count} positions</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">📅</div>
            <div class="metric-value">${appWin.normal.percentage.toFixed(0)}%</div>
            <div class="metric-label">Normal (15-30 days)</div>
            <div class="metric-context">${appWin.normal.count} positions</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">📆</div>
            <div class="metric-value">${appWin.extended.percentage.toFixed(0)}%</div>
            <div class="metric-label">Extended (31-60 days)</div>
            <div class="metric-context">${appWin.extended.count} positions</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">🗓️</div>
            <div class="metric-value">${appWin.long.percentage.toFixed(0)}%</div>
            <div class="metric-label">Long (60+ days)</div>
            <div class="metric-context">${appWin.long.count} positions</div>
          </div>
        </div>
        
        <div class="chart-container">
          <h4 class="chart-title">Application Window: You vs. Market</h4>
          <div class="chart-wrapper short">
            <canvas id="windowComparisonChart"></canvas>
          </div>
        </div>
      </div>
    </section>`;
  }

  /**
   * Generate Workforce Composition section
   */
  private generateWorkforceSection(data: MonthlyReportData): string {
    const wf = data.workforce;
    
    return `
    <section class="report-section" id="workforce">
      <div class="section-header">
        <span class="section-number">04</span>
        <h2>Workforce Composition Shifts</h2>
      </div>
      
      <h3>4.1 Grade & Seniority Evolution</h3>
      
      <div class="two-column">
        <div class="chart-container">
          <h4 class="chart-title">Workforce Pyramid: You vs. Market</h4>
          <div class="chart-wrapper">
            <canvas id="workforcePyramidChart"></canvas>
          </div>
        </div>
        
        <div class="chart-container">
          <h4 class="chart-title">Seniority Mix Evolution</h4>
          <div class="chart-wrapper">
            <canvas id="seniorityTrendChart"></canvas>
          </div>
        </div>
      </div>
      
      <h3>4.2 Contract Type Analysis</h3>
      
      <div class="two-column">
        <div class="chart-container">
          <h4 class="chart-title">Contract Type Distribution</h4>
          <div class="chart-wrapper short">
            <canvas id="contractTypeChart"></canvas>
          </div>
        </div>
        
        <div class="card-grid" style="grid-template-columns: repeat(3, 1fr); align-content: center;">
          <div class="metric-card">
            <div class="metric-icon">👔</div>
            <div class="metric-value">${wf.contractTypes.staff.percentage.toFixed(0)}%</div>
            <div class="metric-label">Staff Positions</div>
            <div class="metric-context">${wf.contractTypes.staff.count} positions</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">📄</div>
            <div class="metric-value">${(wf.contractTypes.serviceAgreement?.percentage || 0).toFixed(0)}%</div>
            <div class="metric-label">Service Agreements</div>
            <div class="metric-context">${wf.contractTypes.serviceAgreement?.count || 0} NPSA/IPSA positions</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">📋</div>
            <div class="metric-value">${wf.contractTypes.consultant.percentage.toFixed(0)}%</div>
            <div class="metric-label">Consultants</div>
            <div class="metric-context">${wf.contractTypes.consultant.count} positions</div>
          </div>
        </div>
      </div>
      
      <h3>4.3 Geographic Footprint</h3>
      
      <div class="two-column">
        <div class="chart-container">
          <h4 class="chart-title">Location Type Distribution</h4>
          <div class="chart-wrapper short">
            <canvas id="geoDistributionChart"></canvas>
          </div>
        </div>
        
        <div class="chart-container">
          <h4 class="chart-title">Top Duty Stations</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Positions</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              ${wf.topLocations.slice(0, 8).map(loc => `
              <tr>
                <td><strong>${loc.location}</strong></td>
                <td>${loc.count}</td>
                <td class="${loc.change >= 0 ? 'positive' : 'negative'}">
                  ${loc.trend === 'up' ? '↑' : loc.trend === 'down' ? '↓' : '→'}
                  ${loc.change !== 0 ? Math.abs(loc.change) : ''}
                </td>
              </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>`;
  }

  /**
   * Generate Category Intelligence section
   */
  private generateCategorySection(data: MonthlyReportData): string {
    const cat = data.categories;
    
    return `
    <section class="report-section" id="categories">
      <div class="section-header">
        <span class="section-number">05</span>
        <h2>Functional Category Intelligence</h2>
      </div>
      
      <h3>5.1 Category Portfolio Analysis</h3>
      
      <div class="two-column">
        <div class="chart-container">
          <h4 class="chart-title">BCG Strategic Matrix</h4>
          <div class="chart-wrapper tall">
            <canvas id="bcgMatrixChart"></canvas>
          </div>
          <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1rem; font-size: 0.875rem;">
            <span><span style="color: var(--accent-green);">●</span> Stars</span>
            <span><span style="color: var(--un-blue);">●</span> Question Marks</span>
            <span><span style="color: var(--accent-orange);">●</span> Cash Cows</span>
            <span><span style="color: var(--neutral-medium);">●</span> Dogs</span>
          </div>
        </div>
        
        <div class="chart-container">
          <h4 class="chart-title">Category Dominance</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Your Share</th>
                <th>Leader</th>
                <th>Rank</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              ${cat.dominanceTable.slice(0, 8).map(row => `
              <tr class="${row.yourRank === 1 ? 'highlight-row' : ''}">
                <td><strong>${this.formatCategoryName(row.category)}</strong></td>
                <td>${row.yourShare.toFixed(1)}%</td>
                <td>${row.marketLeader} (${row.leaderShare.toFixed(1)}%)</td>
                <td><span class="rank-badge ${row.yourRank <= 3 ? 'top' : row.yourRank <= 10 ? 'mid' : 'low'}">#${row.yourRank}</span></td>
                <td>${row.trend === 'up' ? '↑' : row.trend === 'down' ? '↓' : '→'}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <h3>5.2 Emerging & Declining Categories</h3>
      
      <div class="two-column">
        <div class="card" style="border-left: 4px solid var(--accent-green);">
          <h4 style="color: var(--accent-green);">🌱 Emerging Categories</h4>
          <ul style="list-style: none; margin-top: 1rem;">
            ${cat.emerging.length > 0 ? cat.emerging.slice(0, 5).map(c => `
            <li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
              <strong>${this.formatCategoryName(c.category)}</strong>
              <span style="float: right; color: var(--accent-green); font-family: var(--font-data);">+${c.growth.toFixed(0)}%</span>
            </li>
            `).join('') : '<li>No emerging categories detected</li>'}
          </ul>
        </div>
        
        <div class="card" style="border-left: 4px solid var(--accent-orange);">
          <h4 style="color: var(--accent-orange);">📉 Declining Categories</h4>
          <ul style="list-style: none; margin-top: 1rem;">
            ${cat.declining.length > 0 ? cat.declining.slice(0, 5).map(c => `
            <li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
              <strong>${this.formatCategoryName(c.category)}</strong>
              <span style="float: right; color: var(--accent-red); font-family: var(--font-data);">${c.decline.toFixed(0)}%</span>
            </li>
            `).join('') : '<li>No declining categories detected</li>'}
          </ul>
        </div>
      </div>
      
      <h3>5.3 Category Evolution Timeline</h3>
      
      <div class="chart-container">
        <h4 class="chart-title">Category Mix Over Time</h4>
        <div class="chart-wrapper tall">
          <canvas id="categoryTimelineChart"></canvas>
        </div>
      </div>
    </section>`;
  }

  /**
   * Generate Skills Intelligence section
   */
  private generateSkillsSection(data: MonthlyReportData): string {
    const skills = data.skills;
    
    return `
    <section class="report-section" id="skills">
      <div class="section-header">
        <span class="section-number">06</span>
        <h2>Skills & Requirements Intelligence</h2>
      </div>
      
      <h3>6.1 In-Demand Skills</h3>
      
      <div class="chart-container">
        <h4 class="chart-title">Skill Demand Landscape</h4>
        <div class="chart-wrapper tall">
          <canvas id="skillBubbleChart"></canvas>
        </div>
      </div>
      
      <div class="chart-container">
        <h4 class="chart-title">Top Skills Analysis</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>Skill</th>
              <th>Demand</th>
              <th>Growth</th>
              <th>You vs Market</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            ${skills.topSkills.slice(0, 10).map(s => `
            <tr>
              <td><strong>${s.skill}</strong></td>
              <td>${s.demand.toFixed(0)}%</td>
              <td class="${s.growth >= 0 ? 'positive' : 'negative'}">${s.growth >= 0 ? '+' : ''}${s.growth.toFixed(0)}%</td>
              <td class="${s.yourVsMarket >= 0 ? 'positive' : 'negative'}">${s.yourVsMarket >= 0 ? '+' : ''}${s.yourVsMarket.toFixed(1)}%</td>
              <td><span class="rank-badge" style="background: ${s.category === 'technical' ? 'var(--un-blue)' : s.category === 'soft' ? 'var(--accent-green)' : s.category === 'language' ? 'var(--accent-orange)' : 'var(--neutral-medium)'}; color: white;">${s.category}</span></td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <h3>6.2 Emerging Skills</h3>
      
      <div class="card-grid">
        ${skills.emerging.length > 0 ? skills.emerging.slice(0, 5).map(s => `
        <div class="signal-card opportunity">
          <div class="signal-icon">🚀</div>
          <div class="signal-content">
            <h4>${s.skill}</h4>
            <p><strong>Growth Rate:</strong> ${s.growthRate.toFixed(0)}%</p>
            <p><strong>First Seen:</strong> ${s.firstSeen}</p>
            <p><strong>Early Adopters:</strong> ${s.earlyAdopters.slice(0, 3).join(', ')}</p>
          </div>
        </div>
        `).join('') : '<p>No emerging skills detected in this period.</p>'}
      </div>
      
      <h3>6.3 Language Requirements</h3>
      
      <div class="two-column">
        <div class="chart-container">
          <h4 class="chart-title">Language Requirements Distribution</h4>
          <div class="chart-wrapper">
            <canvas id="languageChart"></canvas>
          </div>
        </div>
        
        <div class="card" style="align-self: center;">
          <h4 style="margin-bottom: 1rem;">Multilingual Position Rate</h4>
          <div style="display: flex; align-items: center; gap: 2rem;">
            <div class="metric-value" style="font-size: 3rem;">${skills.languages.multilingualRate.toFixed(0)}%</div>
            <div>
              <p>of positions require multiple languages</p>
              <p style="font-size: 0.875rem; color: var(--neutral-medium);">
                Market average: ${skills.languages.marketComparison.marketRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }

  /**
   * Generate Recommendations section
   */
  private generateRecommendationsSection(data: MonthlyReportData): string {
    return `
    <section class="report-section" id="recommendations">
      <div class="section-header">
        <span class="section-number">07</span>
        <h2>Strategic Recommendations</h2>
      </div>
      
      ${data.recommendations.map((rec, index) => `
      <div class="recommendation-card ${rec.priority}">
        <div class="recommendation-header">
          <span class="priority-badge ${rec.priority}">${rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'} ${rec.priority.toUpperCase()}</span>
          <span class="recommendation-area">${rec.area}</span>
        </div>
        <h3 class="recommendation-title">${index + 1}. ${rec.title}</h3>
        <p class="recommendation-rationale">${rec.rationale}</p>
        <dl class="recommendation-meta">
          <div>
            <dt>Expected Impact</dt>
            <dd>${rec.impact}</dd>
          </div>
          <div>
            <dt>Timeline</dt>
            <dd>${rec.timeline === 'immediate' ? '⚡ Immediate' : rec.timeline === 'quarter' ? '📅 This Quarter' : '📆 This Year'}</dd>
          </div>
        </dl>
      </div>
      `).join('')}
    </section>`;
  }

  /**
   * Generate Appendix section
   */
  private generateAppendix(data: MonthlyReportData): string {
    return `
    <section class="report-section" id="appendix">
      <div class="section-header">
        <span class="section-number">08</span>
        <h2>Appendix</h2>
      </div>
      
      <div class="two-column">
        <div>
          <h3>Methodology</h3>
          <p>This report analyzes job posting data from the UN Careers portal and related agency career sites. Metrics are calculated based on:</p>
          <ul style="margin-left: 1.5rem; margin-top: 1rem;">
            <li>Posting date and deadline date for temporal analysis</li>
            <li>Grade classification for seniority distribution</li>
            <li>Duty station mapping for geographic analysis</li>
            <li>Job category classification using standardized UN functional categories</li>
          </ul>
        </div>
        
        <div>
          <h3>Data Freshness</h3>
          <div class="card">
            <p><strong>Last Data Sync:</strong> ${new Date(data.dataFreshness.lastSync).toLocaleString()}</p>
            <p><strong>Total Jobs Analyzed:</strong> ${data.dataFreshness.jobCount.toLocaleString()}</p>
            <p><strong>Agencies in Market:</strong> ${data.dataFreshness.agencyCount}</p>
            <p><strong>Report Generated:</strong> ${new Date(data.reportPeriod.generatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <h3 style="margin-top: 2rem;">Glossary</h3>
      <table class="data-table">
        <tbody>
          <tr><td><strong>Market Share</strong></td><td>Percentage of total UN system job postings attributed to an agency</td></tr>
          <tr><td><strong>Competitive Score</strong></td><td>Composite score (0-100) based on market share, growth rate, category diversity, and application efficiency</td></tr>
          <tr><td><strong>Application Window</strong></td><td>Number of days between posting date and application deadline</td></tr>
          <tr><td><strong>Hiring Velocity</strong></td><td>Average number of new positions posted per week</td></tr>
          <tr><td><strong>BCG Matrix</strong></td><td>Strategic classification of categories based on market share and growth rate</td></tr>
        </tbody>
      </table>
    </section>
    
    <footer class="report-footer">
      <div class="generated-info">
        Generated by UN Jobs Analytics Platform • ${data.reportPeriod.month}
      </div>
      <div class="data-freshness">
        Report ID: ${Date.now().toString(36).toUpperCase()} • Data as of ${new Date(data.dataFreshness.lastSync).toLocaleDateString()}
      </div>
    </footer>`;
  }

  /**
   * Generate Chart.js scripts
   */
  private generateChartScripts(data: MonthlyReportData): string {
    const brandColors = AGENCY_BRAND_COLORS[data.agency.shortName] || AGENCY_BRAND_COLORS['default'] || { primary: '#009EDB', secondary: '#00477E' };
    const primary = brandColors.primary;
    const secondary = brandColors.secondary;
    
    return `
    // Chart.js defaults
    Chart.defaults.font.family = "'Source Sans Pro', sans-serif";
    Chart.defaults.color = '#666666';
    
    const primaryColor = '${primary}';
    const secondaryColor = '${secondary}';
    const colors = {
      primary: primaryColor,
      secondary: secondaryColor,
      green: '#34C759',
      orange: '#F5A623',
      red: '#FF3B30',
      gray: '#999999'
    };
    
    // 1. Radar Chart - Executive Summary
    ${this.generateRadarChartScript(data)}
    
    // 2. Market Share Trend Chart
    ${this.generateMarketShareTrendScript(data)}
    
    // 3. Positioning Scatter Chart
    ${this.generatePositioningScatterScript(data)}
    
    // 4. Posted vs Open Chart
    ${this.generatePostedVsOpenScript(data)}
    
    // 5. Waterfall Chart (simplified as bar)
    ${this.generateWaterfallScript(data)}
    
    // 6. Application Window Comparison
    ${this.generateWindowComparisonScript(data)}
    
    // 7. Workforce Pyramid
    ${this.generateWorkforcePyramidScript(data)}
    
    // 8. Seniority Trend
    ${this.generateSeniorityTrendScript(data)}
    
    // 9. Contract Type Donut
    ${this.generateContractTypeScript(data)}
    
    // 10. Geographic Distribution
    ${this.generateGeoDistributionScript(data)}
    
    // 11. BCG Matrix
    ${this.generateBCGMatrixScript(data)}
    
    // 12. Category Timeline
    ${this.generateCategoryTimelineScript(data)}
    
    // 13. Skill Bubble Chart
    ${this.generateSkillBubbleScript(data)}
    
    // 14. Language Chart
    ${this.generateLanguageChartScript(data)}
    
    // 15. Talent War Zone Heatmap (as bar chart)
    ${this.generateTalentWarZoneScript(data)}
    
    // 16. Seasonal Heatmap (as grouped bar)
    ${this.generateSeasonalHeatmapScript(data)}
    `;
  }

  private generateRadarChartScript(data: MonthlyReportData): string {
    const radar = data.executiveSummary.radarData;
    if (!radar || !radar.dimensions) return '// No radar data available';
    
    return `
    new Chart(document.getElementById('radarChart'), {
      type: 'radar',
      data: {
        labels: ${JSON.stringify(radar.dimensions)},
        datasets: [
          {
            label: '${data.agency.shortName}',
            data: ${JSON.stringify(radar.yourScores)},
            borderColor: primaryColor,
            backgroundColor: primaryColor + '33',
            pointBackgroundColor: primaryColor,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: primaryColor
          },
          {
            label: 'Market Average',
            data: ${JSON.stringify(radar.marketAvgScores)},
            borderColor: colors.gray,
            backgroundColor: colors.gray + '22',
            pointBackgroundColor: colors.gray,
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: { stepSize: 20 }
          }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });`;
  }

  private generateMarketShareTrendScript(data: MonthlyReportData): string {
    const trend = data.competitive.marketShareTrend || [];
    return `
    new Chart(document.getElementById('marketShareTrendChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(trend.map(t => t.period))},
        datasets: [{
          label: 'Market Share %',
          data: ${JSON.stringify(trend.map(t => t.share))},
          borderColor: primaryColor,
          backgroundColor: primaryColor + '22',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Market Share (%)' } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });`;
  }

  private generatePositioningScatterScript(data: MonthlyReportData): string {
    const matrix = data.competitive.positioningMatrix || [];
    const colors = AGENCY_BRAND_COLORS[data.agency.shortName] || AGENCY_BRAND_COLORS['default'] || { primary: '#009EDB', secondary: '#00477E' };
    return `
    new Chart(document.getElementById('positioningScatterChart'), {
      type: 'bubble',
      data: {
        datasets: [{
          label: 'Agencies',
          data: ${JSON.stringify(matrix.map(m => ({
            x: m.volume,
            y: m.growthRate,
            r: Math.max(5, Math.min(20, m.categoryDiversity * 2)),
            agency: m.agency,
            isYou: m.isYou
          })))},
          backgroundColor: ${JSON.stringify(matrix.map(m => m.isYou ? colors.primary : '#999999' + '66'))},
          borderColor: ${JSON.stringify(matrix.map(m => m.isYou ? colors.primary : '#999999'))}
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Total Volume' } },
          y: { title: { display: true, text: 'Growth Rate (%)' } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.raw.agency + ': ' + ctx.raw.x + ' jobs, ' + ctx.raw.y.toFixed(1) + '% growth'
            }
          }
        }
      }
    });`;
  }

  private generatePostedVsOpenScript(data: MonthlyReportData): string {
    const temporal = data.temporal.postedVsOpen || [];
    return `
    new Chart(document.getElementById('postedVsOpenChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(temporal.map(t => t.period))},
        datasets: [
          {
            label: 'Posted',
            data: ${JSON.stringify(temporal.map(t => t.posted))},
            backgroundColor: primaryColor,
            order: 2
          },
          {
            label: 'Open',
            data: ${JSON.stringify(temporal.map(t => t.open))},
            type: 'line',
            borderColor: colors.orange,
            backgroundColor: 'transparent',
            tension: 0.4,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });`;
  }

  private generateWaterfallScript(data: MonthlyReportData): string {
    const latest = data.temporal.postedVsOpen.slice(-3);
    return `
    new Chart(document.getElementById('waterfallChart'), {
      type: 'bar',
      data: {
        labels: ['Start', 'New Posted', 'Closed', 'Current'],
        datasets: [{
          label: 'Positions',
          data: [
            ${latest[0]?.open || 0},
            ${latest.slice(-1)[0]?.posted || 0},
            -${latest.slice(-1)[0]?.closed || 0},
            ${latest.slice(-1)[0]?.open || 0}
          ],
          backgroundColor: [colors.gray, colors.green, colors.red, primaryColor]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });`;
  }

  private generateWindowComparisonScript(data: MonthlyReportData): string {
    const win = data.temporal.applicationWindows;
    return `
    new Chart(document.getElementById('windowComparisonChart'), {
      type: 'bar',
      data: {
        labels: ['0-14 days', '15-30 days', '31-60 days', '60+ days'],
        datasets: [
          {
            label: 'Your Agency',
            data: ${JSON.stringify(win.marketComparison.yourDistribution)},
            backgroundColor: primaryColor
          },
          {
            label: 'Market',
            data: ${JSON.stringify(win.marketComparison.marketDistribution)},
            backgroundColor: colors.gray
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { beginAtZero: true, title: { display: true, text: '%' } }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });`;
  }

  private generateWorkforcePyramidScript(data: MonthlyReportData): string {
    const sen = data.workforce.seniorityDistribution;
    return `
    new Chart(document.getElementById('workforcePyramidChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(sen.map(s => s.level))},
        datasets: [
          {
            label: 'Your Agency',
            data: ${JSON.stringify(sen.map(s => s.percentage))},
            backgroundColor: primaryColor
          },
          {
            label: 'Market Avg',
            data: ${JSON.stringify(sen.map(s => s.marketAvg))},
            backgroundColor: colors.gray
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { title: { display: true, text: 'Percentage' } }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });`;
  }

  private generateSeniorityTrendScript(data: MonthlyReportData): string {
    const trend = data.workforce.seniorityTrend || [];
    return `
    new Chart(document.getElementById('seniorityTrendChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(trend.map(t => t.period))},
        datasets: [
          { label: 'Executive', data: ${JSON.stringify(trend.map(t => t.executive))}, borderColor: '#1a1a2e', fill: false },
          { label: 'Senior', data: ${JSON.stringify(trend.map(t => t.senior))}, borderColor: primaryColor, fill: false },
          { label: 'Mid', data: ${JSON.stringify(trend.map(t => t.mid))}, borderColor: colors.orange, fill: false },
          { label: 'Entry', data: ${JSON.stringify(trend.map(t => t.entry))}, borderColor: colors.green, fill: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, stacked: false, title: { display: true, text: '%' } }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });`;
  }

  private generateContractTypeScript(data: MonthlyReportData): string {
    const ct = data.workforce.contractTypes;
    // Service Agreements (NPSA/IPSA) are Non-Staff - shown separately from Staff
    const saPercentage = ct.serviceAgreement?.percentage || 0;
    return `
    new Chart(document.getElementById('contractTypeChart'), {
      type: 'doughnut',
      data: {
        labels: ['Staff', 'Service Agreements', 'Consultant', 'Intern'],
        datasets: [{
          data: [${ct.staff.percentage}, ${saPercentage}, ${ct.consultant.percentage}, ${ct.intern.percentage}],
          backgroundColor: [primaryColor, '#0EA5E9', colors.orange, colors.green],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });`;
  }

  private generateGeoDistributionScript(data: MonthlyReportData): string {
    const geo = data.workforce.geographic;
    return `
    new Chart(document.getElementById('geoDistributionChart'), {
      type: 'doughnut',
      data: {
        labels: ['HQ', 'Regional', 'Field', 'Remote'],
        datasets: [{
          data: [${geo.hq.percentage}, ${geo.regional.percentage}, ${geo.field.percentage}, ${geo.remote.percentage}],
          backgroundColor: [secondaryColor, primaryColor, colors.green, colors.orange],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });`;
  }

  private generateBCGMatrixScript(data: MonthlyReportData): string {
    const bcg = data.categories.bcgMatrix;
    const allCategories = [
      ...(bcg.stars || []).map(c => ({ ...c, type: 'star' })),
      ...(bcg.questionMarks || []).map(c => ({ ...c, type: 'question' })),
      ...(bcg.cashCows || []).map(c => ({ ...c, type: 'cow' })),
      ...(bcg.dogs || []).map(c => ({ ...c, type: 'dog' }))
    ];
    
    return `
    new Chart(document.getElementById('bcgMatrixChart'), {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Stars',
            data: ${JSON.stringify((bcg.stars || []).map(c => ({ x: c.share, y: c.growth, label: c.category })))},
            backgroundColor: colors.green,
            pointRadius: 8
          },
          {
            label: 'Question Marks',
            data: ${JSON.stringify((bcg.questionMarks || []).map(c => ({ x: c.share, y: c.growth, label: c.category })))},
            backgroundColor: primaryColor,
            pointRadius: 8
          },
          {
            label: 'Cash Cows',
            data: ${JSON.stringify((bcg.cashCows || []).map(c => ({ x: c.share, y: c.growth, label: c.category })))},
            backgroundColor: colors.orange,
            pointRadius: 8
          },
          {
            label: 'Dogs',
            data: ${JSON.stringify((bcg.dogs || []).map(c => ({ x: c.share, y: c.growth, label: c.category })))},
            backgroundColor: colors.gray,
            pointRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Market Share (%)' } },
          y: { title: { display: true, text: 'Growth Rate (%)' } }
        },
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.raw.label || ''
            }
          }
        }
      }
    });`;
  }

  private generateCategoryTimelineScript(data: MonthlyReportData): string {
    const timeline = data.categories.timeline || [];
    const topCategories = data.categories.distribution.slice(0, 5).map(c => c.category);
    const colors = AGENCY_BRAND_COLORS[data.agency.shortName] || AGENCY_BRAND_COLORS['default'] || { primary: '#009EDB', secondary: '#00477E' };
    const chartColors = [colors.primary, colors.secondary, '#34C759', '#F5A623', '#999999'];
    
    const datasets = topCategories.map((cat, i) => ({
      label: this.formatCategoryName(cat),
      data: timeline.map(t => t[cat] || 0),
      borderColor: chartColors[i] || '#999999',
      backgroundColor: 'transparent',
      tension: 0.4
    }));
    
    return `
    new Chart(document.getElementById('categoryTimelineChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(timeline.map(t => t.period))},
        datasets: ${JSON.stringify(datasets)}
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, stacked: false }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });`;
  }

  private generateSkillBubbleScript(data: MonthlyReportData): string {
    const skills = data.skills.skillBubbleData || [];
    return `
    new Chart(document.getElementById('skillBubbleChart'), {
      type: 'bubble',
      data: {
        datasets: [{
          label: 'Skills',
          data: ${JSON.stringify(skills.slice(0, 15).map(s => ({
            x: s.demand,
            y: s.growth,
            r: Math.max(5, Math.min(20, s.agenciesCount)),
            skill: s.skill
          })))},
          backgroundColor: primaryColor + '66',
          borderColor: primaryColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Demand (% of jobs)' } },
          y: { title: { display: true, text: 'Growth Rate (%)' } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.raw.skill + ': ' + ctx.raw.x.toFixed(0) + '% demand, ' + ctx.raw.y.toFixed(0) + '% growth'
            }
          }
        }
      }
    });`;
  }

  private generateLanguageChartScript(data: MonthlyReportData): string {
    const langs = data.skills.languages;
    const topRequired = langs.required.slice(0, 6);
    
    return `
    new Chart(document.getElementById('languageChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(topRequired.map(l => l.language))},
        datasets: [
          {
            label: 'Required',
            data: ${JSON.stringify(topRequired.map(l => l.percentage))},
            backgroundColor: primaryColor
          },
          {
            label: 'Desired',
            data: ${JSON.stringify(topRequired.map(l => {
              const desired = langs.desired.find(d => d.language === l.language);
              return desired ? desired.percentage : 0;
            }))},
            backgroundColor: colors.gray
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { title: { display: true, text: 'Percentage of Positions' } }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });`;
  }

  private generateTalentWarZoneScript(data: MonthlyReportData): string {
    const zones = data.competitive.talentWarZones.slice(0, 8);
    return `
    new Chart(document.getElementById('talentWarZoneChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(zones.map(z => this.formatCategoryName(z.category)))},
        datasets: [
          {
            label: 'Your Share',
            data: ${JSON.stringify(zones.map(z => z.yourShare))},
            backgroundColor: primaryColor
          },
          {
            label: 'Leader Share',
            data: ${JSON.stringify(zones.map(z => z.leaderShare))},
            backgroundColor: colors.gray
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { title: { display: true, text: 'Market Share (%)' } }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });`;
  }

  private generateSeasonalHeatmapScript(data: MonthlyReportData): string {
    const heatmap = data.temporal.seasonalPattern.heatmapData || [];
    const years = [...new Set(heatmap.map(h => h.year))].sort();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const colors = AGENCY_BRAND_COLORS[data.agency.shortName] || AGENCY_BRAND_COLORS['default'] || { primary: '#009EDB', secondary: '#00477E' };
    
    const datasets = years.map((year, i) => ({
      label: year.toString(),
      data: months.map((_, monthIdx) => {
        const entry = heatmap.find(h => h.year === year && h.month === months[monthIdx]);
        return entry ? entry.value : 0;
      }),
      backgroundColor: i === years.length - 1 ? colors.primary : '#999999' + (50 + i * 20).toString(16)
    }));
    
    return `
    new Chart(document.getElementById('seasonalHeatmapChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(months)},
        datasets: ${JSON.stringify(datasets)}
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });`;
  }

  /**
   * Helper: Format category name for display
   */
  private formatCategoryName(category: string): string {
    if (!category) return 'Unknown';
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export default HTMLReportGenerator;

