import { calculateForecast } from './dist/forecast-calculator.js';

// Default settings
const settings = {
  defaultCapitalGrowthRate: 5,
  defaultIncomeGrowthRate: 2,
  defaultExpenseGrowthRate: 2,
  defaultLoanToValueRatio: 0.8,
  defaultLoanInterestRate: 5,
  defaultLoanInterestOnlyPeriod: 5,
  defaultLoanTermYears: 30,
  defaultPrincipalResidenceLoanTermYears: 20
};

// Default profile setup
let profile = {
  currentYear: 2025,
  passiveIncomeGoal: 200000,
  yearsToGoal: 15,  // Default years to goal
  chartYears: 30,   // Default to 5 years past yearsToGoal
  assets: []
};

// Example assets (will be loaded from URL or defaults)
const defaultAssets = [
  {
    name: "Investment Property 1",
    type: "investmentProperty",
    purchaseYear: 2025,
    purchaseMarketValue: 850000,
    incomePerYear: 800 * 52,
    expensesPerYear: 5000,
    loanAmount: 700000,
    loanInterestOnlyPeriod: 3,
  },
  {
    name: "Investment Property 2",
    type: "investmentProperty",
    purchaseYear: 2026,
    purchaseMarketValue: 850000,
    incomePerYear: 800 * 52,
    expensesPerYear: 5000,
    loanAmount: 700000,
    loanInterestOnlyPeriod: 3,
  },
  {
    name: "Investment Property 3",
    type: "investmentProperty",
    purchaseYear: 2027,
    purchaseMarketValue: 850000,
    incomePerYear: 800 * 52,
    expensesPerYear: 5000,
    loanAmount: 700000,
    loanInterestOnlyPeriod: 3,
  },
  {
    name: "Commercial Property",
    type: "commercialProperty",
    purchaseYear: 2028,
    purchaseMarketValue: 1000000,
    incomePerYear: 800 * 52,
    expensesPerYear: 10000,
    loanAmount: 700000,
    loanInterestOnlyPeriod: 3,
    capitalGrowthRate: 4,
    loanInterestRate: 7
  },
  {
    name: "Self Managed Super Fund",
    type: "selfManagedSuperFund",
    purchaseYear: 2028,
    purchaseMarketValue: 1000000,
    incomePerYear: 900 * 52,
    expensesPerYear: 5000,
    loanAmount: 700000,
    loanInterestOnlyPeriod: 3,
    loanInterestRate: 7
  },
  {
    name: "Stock Portfolio",
    type: "stockPortfolio",
    purchaseYear: 2025,
    purchaseMarketValue: 200000,
    incomePerYear: 20000,
    expensesPerYear: 1000,
    loanAmount: 0,
    loanInterestOnlyPeriod: 0,
    loanInterestRate: 0,
    loanTermYears: 0,
  },
  {
    name: "Principal Place of Residence",
    type: "principalPlaceOfResidence",
    purchaseYear: 2025,
    purchaseMarketValue: 1000000,
    incomePerYear: 0,
    expensesPerYear: 5000,
    loanAmount: 600000,
  },
];

// DOM references
const chartCanvas = document.getElementById("forecastChart");
const sideDrawer = document.getElementById("sideDrawer");
const drawerContent = document.getElementById("drawerContent");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");
const addAssetBtn = document.getElementById("addAssetBtn");
const assetsForm = document.getElementById("assetsForm");
const generateShareLink = document.getElementById("generateShareLink");
const shareModal = document.getElementById("shareModal");
const shareLinkInput = document.getElementById("shareLinkInput");
const copyLinkBtn = document.getElementById("copyLinkBtn");

// Create or hold the chart instance
let forecastChart = null;
let results = [];

// Asset types for dropdown
const assetTypes = [
  "investmentProperty",
  "commercialProperty",
  "selfManagedSuperFund",
  "stockPortfolio",
  "principalPlaceOfResidence",
  "crypto"
];

/**
 * Initialize the app: load assets from URL or use defaults, render form, calculate results
 */
function initializeApp() {
  // Try to load assets from URL
  loadStateFromUrl();

  // If no assets loaded from URL, use defaults
  if (profile.assets.length === 0) {
    profile.assets = [...defaultAssets];
  }

  // Render the form with loaded/default assets
  renderAssetForm();

  // Calculate and update the chart and results
  recalculateAndUpdate();

  // Set up event listeners
  setupEventListeners();
}

/**
 * Renders the asset form with current profile.assets
 */
function renderAssetForm() {
  // Create a table structure for Excel-like layout
  assetsForm.innerHTML = `
    <div class="profile-controls">
      <div class="profile-form">
        <div class="form-field">
          <label for="currentYearInput">Current Year:</label>
          <input type="number" id="currentYearInput" value="${profile.currentYear}">
        </div>
        <div class="form-field">
          <label for="passiveIncomeGoalInput">Income Goal ($):</label>
          <input type="number" id="passiveIncomeGoalInput" value="${profile.passiveIncomeGoal}">
        </div>
        <div class="form-field">
          <label for="yearsToGoalInput">Years to Goal:</label>
          <input type="number" id="yearsToGoalInput" value="${profile.yearsToGoal || 10}">
        </div>
        <div class="form-field">
          <label for="chartYearsFilter">Chart Years:</label>
          <select id="chartYearsFilter">
            ${[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(years =>
    `<option value="${years}" ${years === (profile.chartYears || 15) ? 'selected' : ''}>${years}</option>`
  ).join('')}
          </select>
        </div>
      </div>
      <div class="form-controls">
        <button id="addAssetBtn" class="btn">Add Asset</button>
        <button id="generateShareLink" class="btn">Share</button>
      </div>
    </div>
    <table class="assets-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Purchase Year</th>
          <th>Purchase Value</th>
          <th>Annual Income</th>
          <th>Annual Expenses</th>
          <th class="loan-header">Loan Amount</th>
          <th class="loan-header">Interest Rate (%)</th>
          <th class="loan-header">IO Period (Years)</th>
          <th class="loan-header">Loan Term (Years)</th>
          <th class="growth-header">Capital Growth (%)</th>
          <th class="growth-header">Income Growth (%)</th>
          <th class="growth-header">Expense Growth (%)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="assetsTableBody">
        <!-- Asset rows will be added here -->
      </tbody>
    </table>
  `;

  const assetsTableBody = document.getElementById('assetsTableBody');

  // Add event listeners for profile inputs
  document.getElementById('currentYearInput').addEventListener('change', handleProfileChange);
  document.getElementById('passiveIncomeGoalInput').addEventListener('change', handleProfileChange);
  document.getElementById('yearsToGoalInput').addEventListener('change', handleProfileChange);
  document.getElementById('chartYearsFilter').addEventListener('change', handleProfileChange);

  // Create a copy of the assets array and sort by purchase year
  const sortedAssets = [...profile.assets].sort((a, b) => {
    // Convert to numbers for reliable comparison
    const yearA = parseInt(a.purchaseYear) || 0;
    const yearB = parseInt(b.purchaseYear) || 0;
    return yearA - yearB; // Sort low to high
  });

  // Add a row for each asset using the sorted array
  sortedAssets.forEach((asset, sortedIndex) => {
    // Find the original index in profile.assets to maintain data integrity
    const originalIndex = profile.assets.findIndex(a => a === asset);
    addAssetTableRow(asset, originalIndex, assetsTableBody);
  });
}

/**
 * Handle changes to profile inputs
 */
function handleProfileChange(event) {
  const input = event.target;
  const value = input.type === 'number' ? parseInt(input.value) : input.value;

  switch (input.id) {
    case 'currentYearInput':
      profile.currentYear = value;
      break;
    case 'passiveIncomeGoalInput':
      profile.passiveIncomeGoal = value;
      break;
    case 'yearsToGoalInput':
      profile.yearsToGoal = value;
      // Update chart years to yearsToGoal + 5 as default
      if (!profile.chartYears) {
        profile.chartYears = value + 5;
        const chartYearsFilter = document.getElementById('chartYearsFilter');
        if (chartYearsFilter) {
          // Find the closest available option
          const options = Array.from(chartYearsFilter.options).map(opt => parseInt(opt.value));
          const closest = options.reduce((prev, curr) =>
            (Math.abs(curr - profile.chartYears) < Math.abs(prev - profile.chartYears) ? curr : prev)
          );
          chartYearsFilter.value = closest;
        }
      }
      break;
    case 'chartYearsFilter':
      profile.chartYears = parseInt(input.value);
      break;
  }

  recalculateAndUpdate();
  updateUrlState();
}

/**
 * Convert a camelCase string to sentence case
 */
function toSentenceCase(camelCaseString) {
  // First, split the camel case string at capital letters
  const words = camelCaseString.replace(/([A-Z])/g, ' $1').trim();
  // Then capitalize the first letter
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Creates a table row for an asset
 */
function addAssetTableRow(asset = {}, index, tableBody) {
  const assetRow = document.createElement('tr');
  assetRow.className = asset.hidden ? 'asset-row hidden-asset' : 'asset-row';
  assetRow.dataset.index = index;

  // Helper function to get default loan term based on asset type
  const getDefaultLoanTerm = (assetType) => {
    return assetType === "principalPlaceOfResidence"
      ? settings.defaultPrincipalResidenceLoanTermYears
      : settings.defaultLoanTermYears;
  };

  // Helper function to display 0 instead of empty string for numeric fields
  const getNumericDisplay = (value) => {
    return value !== undefined && value !== null && value !== '' ? value : 0;
  };

  // Get values or appropriate defaults
  const loanInterestRate = asset.loanInterestRate !== undefined ? asset.loanInterestRate : settings.defaultLoanInterestRate;
  const loanInterestOnlyPeriod = asset.loanInterestOnlyPeriod !== undefined ? asset.loanInterestOnlyPeriod : settings.defaultLoanInterestOnlyPeriod;
  const loanTermYears = asset.loanTermYears !== undefined ? asset.loanTermYears : getDefaultLoanTerm(asset.type);
  const capitalGrowthRate = asset.capitalGrowthRate !== undefined ? asset.capitalGrowthRate : settings.defaultCapitalGrowthRate;
  const incomeGrowthRate = asset.incomeGrowthRate !== undefined ? asset.incomeGrowthRate : settings.defaultIncomeGrowthRate;
  const expenseGrowthRate = asset.expenseGrowthRate !== undefined ? asset.expenseGrowthRate : settings.defaultExpenseGrowthRate;

  // If asset has incomePerWeek but not incomePerYear, convert it
  // This is for backward compatibility with older data
  let incomePerYear = asset.incomePerYear;
  if (!incomePerYear && asset.incomePerWeek) {
    incomePerYear = asset.incomePerWeek * 52;
  }

  // Create HTML for the table row with all asset fields
  assetRow.innerHTML = `
    <td>
      <input type="text" name="name" value="${asset.name || ''}" data-field="name">
    </td>
    <td>
      <select name="type" data-field="type">
        ${assetTypes.map(type => `<option value="${type}" ${asset.type === type ? 'selected' : ''}>${toSentenceCase(type)}</option>`).join('')}
      </select>
    </td>
    <td>
      <input type="number" name="purchaseYear" value="${getNumericDisplay(asset.purchaseYear)}" data-field="purchaseYear">
    </td>
    <td>
      <input type="number" name="purchaseMarketValue" value="${getNumericDisplay(asset.purchaseMarketValue)}" data-field="purchaseMarketValue">
    </td>
    <td>
      <input type="number" name="incomePerYear" value="${getNumericDisplay(incomePerYear)}" data-field="incomePerYear">
    </td>
    <td>
      <input type="number" name="expensesPerYear" value="${getNumericDisplay(asset.expensesPerYear)}" data-field="expensesPerYear">
    </td>
    <td class="loan-cell">
      <input type="number" name="loanAmount" value="${getNumericDisplay(asset.loanAmount)}" data-field="loanAmount">
    </td>
    <td class="loan-cell">
      <input type="number" name="loanInterestRate" value="${getNumericDisplay(loanInterestRate)}" data-field="loanInterestRate" step="0.01" placeholder="${settings.defaultLoanInterestRate}">
    </td>
    <td class="loan-cell">
      <input type="number" name="loanInterestOnlyPeriod" value="${getNumericDisplay(loanInterestOnlyPeriod)}" data-field="loanInterestOnlyPeriod" placeholder="${settings.defaultLoanInterestOnlyPeriod}">
    </td>
    <td class="loan-cell">
      <input type="number" name="loanTermYears" value="${getNumericDisplay(loanTermYears)}" data-field="loanTermYears" placeholder="${getDefaultLoanTerm(asset.type)}">
    </td>
    <td class="growth-cell">
      <input type="number" name="capitalGrowthRate" value="${getNumericDisplay(capitalGrowthRate)}" data-field="capitalGrowthRate" step="0.1" placeholder="${settings.defaultCapitalGrowthRate}">
    </td>
    <td class="growth-cell">
      <input type="number" name="incomeGrowthRate" value="${getNumericDisplay(incomeGrowthRate)}" data-field="incomeGrowthRate" step="0.1" placeholder="${settings.defaultIncomeGrowthRate}">
    </td>
    <td class="growth-cell">
      <input type="number" name="expenseGrowthRate" value="${getNumericDisplay(expenseGrowthRate)}" data-field="expenseGrowthRate" step="0.1" placeholder="${settings.defaultExpenseGrowthRate}">
    </td>
    <td class="asset-actions">
      <button class="toggle-asset-btn" title="${asset.hidden ? 'Show asset' : 'Hide asset'}" data-index="${index}">
        ${asset.hidden ? 'Show' : 'Hide'}
      </button>
      <button class="remove-asset-btn" title="Remove asset" data-index="${index}">
        Remove
      </button>
    </td>
  `;

  // Add event listeners to inputs and select
  assetRow.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('change', handleAssetInputChange);
  });

  // Add event listener to update loan term when asset type changes
  const typeSelect = assetRow.querySelector('select[data-field="type"]');
  typeSelect.addEventListener('change', (e) => {
    const loanTermInput = assetRow.querySelector('input[data-field="loanTermYears"]');
    // Only update if the user hasn't explicitly set a value
    if (!asset.loanTermYears) {
      const newType = e.target.value;
      const defaultTerm = getDefaultLoanTerm(newType);
      loanTermInput.value = defaultTerm;
      loanTermInput.placeholder = defaultTerm;
      // Trigger change event to update the asset
      loanTermInput.dispatchEvent(new Event('change'));
    }
  });

  // Add the row to the table body
  tableBody.appendChild(assetRow);
}

/**
 * Handle changes to asset form inputs
 */
function handleAssetInputChange(event) {
  const input = event.target;
  const field = input.dataset.field;
  const index = parseInt(input.closest('.asset-row').dataset.index);
  let value = input.value;

  // Convert numeric fields to numbers
  if (field !== 'name' && field !== 'type') {
    value = value === '' ? '' : Number(value);
  }

  // Update the profile asset
  profile.assets[index] = {
    ...profile.assets[index],
    [field]: value
  };

  // Only recalculate if the asset data is valid
  if (isAssetValid(profile.assets[index])) {
    recalculateAndUpdate();
    updateUrlState();
  }
}

/**
 * Check if asset data is valid for calculation
 */
function isAssetValid(asset) {
  // Basic validation - ensure required fields have values
  const requiredFields = ['purchaseYear', 'purchaseMarketValue'];
  return requiredFields.every(field =>
    asset[field] !== undefined && asset[field] !== null && asset[field] !== '');
}

/**
 * Add a new blank asset to the table
 */
function addAsset() {
  const newAsset = {
    name: `Asset ${profile.assets.length + 1}`,
    type: "investmentProperty",
    purchaseYear: new Date().getFullYear(),
    purchaseMarketValue: 0,
    incomePerYear: 0,  // Changed from incomePerWeek
    expensesPerYear: 0,
    loanAmount: 0,
    loanInterestRate: settings.defaultLoanInterestRate,
    loanInterestOnlyPeriod: settings.defaultLoanInterestOnlyPeriod,
    loanTermYears: settings.defaultLoanTermYears,
    capitalGrowthRate: settings.defaultCapitalGrowthRate,
    incomeGrowthRate: settings.defaultIncomeGrowthRate,
    expenseGrowthRate: settings.defaultExpenseGrowthRate,
    hidden: false
  };

  profile.assets.push(newAsset);

  const assetsTableBody = document.getElementById('assetsTableBody');
  if (assetsTableBody) {
    addAssetTableRow(newAsset, profile.assets.length - 1, assetsTableBody);
  } else {
    // Fall back to re-rendering the whole form if needed
    renderAssetForm();
  }
}

/**
 * Remove an asset from the form and profile
 */
function removeAsset(index) {
  profile.assets.splice(index, 1);
  renderAssetForm();
  recalculateAndUpdate();
  updateUrlState();
}

/**
 * Toggle asset visibility in calculations
 */
function toggleAssetVisibility(index) {
  if (profile.assets[index]) {
    profile.assets[index].hidden = !profile.assets[index].hidden;

    // Update row appearance
    const assetRow = document.querySelector(`.asset-row[data-index="${index}"]`);
    if (assetRow) {
      assetRow.classList.toggle('hidden-asset');

      // Update toggle button text
      const toggleBtn = assetRow.querySelector('.toggle-asset-btn');
      if (toggleBtn) {
        toggleBtn.textContent = profile.assets[index].hidden ? 'Show' : 'Hide';
        toggleBtn.title = profile.assets[index].hidden ? 'Show asset' : 'Hide asset';
      }
    }

    // Recalculate with the updated visibility
    recalculateAndUpdate();
    updateUrlState();
  }
}

/**
 * Updates the chart with the latest forecast data.
 */
function updateChart(forecastResults) {
  // If chartYears is set, limit the data points
  const yearsToShow = profile.chartYears || 15;
  const limitedResults = forecastResults.slice(0, yearsToShow);

  const labels = limitedResults.map(r => r.currentYear.toString());
  const debtData = limitedResults.map(r => r.assetLoanBalance);
  const equityData = limitedResults.map(r => r.assetValue - r.assetLoanBalance);
  const cashflowData = limitedResults.map(r => r.cashFlowAfterPrincipal);

  // Destroy existing chart if any
  if (forecastChart) {
    forecastChart.destroy();
  }

  // Refined financial color palette with better contrast
  const colors = {
    debt: "#E63946",        // Modern red for debt
    equity: "#6EA8C0",      // Lighter blue for equity (was #457B9D)
    income: "#D96704",      // Darker amber for income (was #F9C74F)
    incomeHover: "#F3A712"  // Accent color for hover states
  };

  // Create new chart
  forecastChart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Debt",
          data: debtData,
          backgroundColor: colors.debt,
          stack: "combined",
          borderRadius: 4,
          order: 2, // Lower order = drawn first (behind)
        },
        {
          label: "Equity",
          data: equityData,
          backgroundColor: colors.equity,
          stack: "combined",
          borderRadius: 4,
          order: 1, // Lower order = drawn first (behind)
        },
        {
          label: "Passive Income",
          data: cashflowData,
          type: "line",
          yAxisID: "y1",
          borderColor: colors.income,
          backgroundColor: colors.incomeHover,
          borderWidth: 3,
          pointBackgroundColor: colors.income,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: false,
          order: 0, // Higher priority (drawn on top)
          // Add shadow effect to make line stand out more
          shadowOffsetX: 0,
          shadowOffsetY: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              family: "'Arial', sans-serif"
            }
          }
        },
        tooltip: {
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          titleColor: "#333",
          bodyColor: "#333",
          borderColor: "#ddd",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          usePointStyle: true,
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0
                }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          stacked: true,
          title: {
            display: true,
            text: "Asset Value (Debt + Equity)",
            font: {
              family: "'Arial', sans-serif",
              weight: 'bold'
            }
          },
          ticks: {
            callback: function (value) {
              return '$' + value.toLocaleString();
            }
          }
        },
        y1: {
          type: "linear",
          position: "right",
          title: {
            display: true,
            text: "Passive Income",
            color: colors.income,
            font: {
              family: "'Arial', sans-serif",
              weight: 'bold'
            }
          },
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            color: colors.income,
            callback: function (value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      },
      onClick: (evt, elements) => {
        const points = forecastChart.getElementsAtEventForMode(evt, 'index', { intersect: false }, false);
        if (points.length) {
          const firstPoint = points[0];
          const index = firstPoint.index;
          showYearDetail(index);
        }
      },
    },
  });
}

/**
 * Show a side drawer with details for the forecast year at `index`.
 */
function showYearDetail(index) {
  const yearData = results[index];
  if (!yearData) return;

  let html = `
<h2>Year: ${yearData.currentYear}</h2>
<p><strong>Gross Income:</strong> $${Math.round(yearData.grossIncome).toLocaleString()}</p>
<p><strong>Expenses:</strong> $${Math.round(yearData.expenses).toLocaleString()}</p>
<p><strong>Net Income:</strong> $${Math.round(yearData.netIncome).toLocaleString()}</p>
<p><strong>Asset Value:</strong> $${Math.round(yearData.assetValue).toLocaleString()}</p>
<p><strong>Loan Balance:</strong> $${Math.round(yearData.assetLoanBalance).toLocaleString()}</p>
<p><strong>Equity:</strong> $${Math.round(yearData.equity).toLocaleString()}</p>
`;

  drawerContent.innerHTML = html;
  sideDrawer.classList.add("open");
  sideDrawer.classList.remove("hidden");
}

/**
 * Find the earliest purchase year among all assets
 */
function getEarliestPurchaseYear() {
  const purchaseYears = profile.assets
    .filter(asset => !asset.hidden && isAssetValid(asset))
    .map(asset => asset.purchaseYear)
    .filter(Boolean);
  return purchaseYears.length > 0 ? Math.min(...purchaseYears) : profile.currentYear;
}

/**
 * Recalculate forecast and update the UI
 */
function recalculateAndUpdate() {
  try {
    // Only include valid and visible assets in calculation
    const validVisibleAssets = profile.assets.filter(asset =>
      isAssetValid(asset) && !asset.hidden
    );

    // Find the earliest purchase year for historical data
    const earliestYear = getEarliestPurchaseYear();

    // Create a modified profile with the earliest year as the start year
    // This ensures calculation begins from the earliest purchase year
    const calculationProfile = {
      ...profile,
      assets: validVisibleAssets,
      startYear: earliestYear // Use this instead of calculationStartYear
    };

    // Run the calculation starting from earliest purchase year
    results = calculateForecast(calculationProfile, settings);
    console.log({ results, earliestYear, currentYear: profile.currentYear });

    // Filter results for chart to show only current year and beyond
    const currentYearIndex = results.findIndex(r => r.currentYear >= profile.currentYear);
    const currentYearResults = currentYearIndex >= 0 ? results.slice(currentYearIndex) : results;

    // Update the chart with filtered results (current year onward)
    updateChart(currentYearResults);

    // Update the table with full historical results
    updateResultsTable(results);
  } catch (error) {
    console.error('Calculation error:', error);
  }
}

/**
 * Update the results table with forecast data
 */
function updateResultsTable(results) {
  const resultsDiv = document.getElementById('results');

  // Find index for yearsToGoal if defined
  const targetYear = profile.currentYear + (profile.yearsToGoal || 10);
  const targetYearIndex = results.findIndex(r => r.currentYear >= targetYear);

  // Default to showing the first 30 years
  const yearsToShow = targetYearIndex > 0 ? targetYearIndex + 5 : 30;

  resultsDiv.innerHTML = `
    <details class="forecast-details">
      <summary>
        <h2>Forecast Results <span class="details-hint">(Click to expand/collapse)</span></h2>
      </summary>
      <div class="details-content">
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Expenses</th>
              <th>Net Income</th>
              <th>Cash Flow After Principal</th>
              <th>Gap to Goal</th>
              <th>Equity</th>
            </tr>
          </thead>
          <tbody>
            ${results.slice(0, yearsToShow).map(year => `
              <tr>
                <td>${year.currentYear}</td>
                <td>$${Math.round(year.expenses).toLocaleString()}</td>
                <td>$${Math.round(year.netIncome).toLocaleString()}</td>
                <td>$${Math.round(year.cashFlowAfterPrincipal).toLocaleString()}</td>
                <td>$${Math.round(year.gapToIncomeGoal).toLocaleString()}</td>
                <td>$${Math.round(year.equity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </details>
  `;
}

/**
 * Save current profile state to URL
 */
function updateUrlState() {
  try {
    // Create a simplified copy of assets for URL (only keep essential fields)
    const minimalAssets = profile.assets.map(asset => {
      const minAsset = {};

      // Include only non-empty fields to keep URL shorter
      for (const [key, value] of Object.entries(asset)) {
        if (value !== undefined && value !== null && value !== '') {
          minAsset[key] = value;
        }
      }

      return minAsset;
    });

    // Create state object with all profile properties and assets
    const state = {
      cy: profile.currentYear,
      pig: profile.passiveIncomeGoal,
      ytg: profile.yearsToGoal,
      chy: profile.chartYears,
      a: minimalAssets
    };

    // Serialize to base64 and update URL
    const stateStr = JSON.stringify(state);
    const stateBase64 = btoa(encodeURIComponent(stateStr));
    const url = new URL(window.location);
    url.searchParams.set('state', stateBase64);

    // Update URL without reloading page
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.error('Error updating URL state:', error);
  }
}

/**
 * Load state from URL
 */
function loadStateFromUrl() {
  try {
    const url = new URL(window.location);
    const stateParam = url.searchParams.get('state');

    if (!stateParam) return;

    // Decode and parse the state
    const stateStr = decodeURIComponent(atob(stateParam));
    const state = JSON.parse(stateStr);

    // Update profile with loaded state
    if (state.cy) profile.currentYear = Number(state.cy);
    if (state.pig) profile.passiveIncomeGoal = Number(state.pig);
    if (state.ytg) profile.yearsToGoal = Number(state.ytg);
    if (state.chy) profile.chartYears = Number(state.chy);
    if (state.a && Array.isArray(state.a)) {
      profile.assets = state.a;
    }
  } catch (error) {
    console.error('Error loading state from URL:', error);
    // If there's an error, we'll keep the default profile
  }
}

/**
 * Generate and show share link
 */
function showShareLink() {
  updateUrlState();
  shareLinkInput.value = window.location.href;
  shareModal.classList.remove('hidden');
}

/**
 * Copy share link to clipboard
 */
function copyShareLink() {
  shareLinkInput.select();
  document.execCommand('copy');

  // Show feedback
  copyLinkBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyLinkBtn.textContent = 'Copy';
  }, 2000);
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Add asset button
  addAssetBtn.addEventListener('click', addAsset);

  // Close drawer button
  closeDrawerBtn.addEventListener('click', () => {
    sideDrawer.classList.remove("open");
  });

  // Generate share link button
  generateShareLink.addEventListener('click', showShareLink);

  // Copy link button
  copyLinkBtn.addEventListener('click', copyShareLink);

  // Close modal when clicking X
  document.querySelector('.close-modal').addEventListener('click', () => {
    shareModal.classList.add('hidden');
  });

  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === shareModal) {
      shareModal.classList.add('hidden');
    }
  });

  // Delegate event for remove asset buttons (for buttons that don't exist yet)
  assetsForm.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-asset-btn')) {
      const index = parseInt(event.target.dataset.index);
      removeAsset(index);
    } else if (event.target.classList.contains('toggle-asset-btn')) {
      const index = parseInt(event.target.dataset.index);
      toggleAssetVisibility(index);
    }
  });
}

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);