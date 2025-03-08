import { calculateForecast } from './dist/forecast-calculator.js';

// Default settings
const settings = {
  defaultCapitalGrowthRate: 3,
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
  assets: []
};

// Example assets (will be loaded from URL or defaults)
const defaultAssets = [
  {
    name: "Investment Property 1",
    type: "investmentProperty",
    purchaseYear: 2017,
    purchaseMarketValue: 850000,
    incomePerWeek: 800,
    expensesPerYear: 5000,
    loanAmount: 700000,
    loanInterestOnlyPeriod: 3,
  },
  {
    name: "Investment Property 2",
    type: "investmentProperty",
    purchaseYear: 2017,
    purchaseMarketValue: 850000,
    incomePerWeek: 800,
    expensesPerYear: 5000,
    loanAmount: 700000,
    loanInterestOnlyPeriod: 3,
  },
  {
    name: "Investment Property 3",
    type: "investmentProperty",
    purchaseYear: 2020,
    purchaseMarketValue: 850000,
    incomePerWeek: 800,
    expensesPerYear: 5000,
    loanAmount: 700000,
    loanInterestOnlyPeriod: 3,
  },
  {
    name: "Investment Property 4",
    type: "investmentProperty",
    purchaseYear: 2022,
    purchaseMarketValue: 850000,
    incomePerWeek: 800,
    expensesPerYear: 5000,
    loanAmount: 700000,
    loanInterestOnlyPeriod: 3,
  },
  {
    name: "Investment Property 5",
    type: "investmentProperty",
    purchaseYear: 2026,
    purchaseMarketValue: 1500000,
    incomePerWeek: 1400,
    expensesPerYear: 10000,
    loanAmount: 1300000,
    loanInterestOnlyPeriod: 3,
  },
  {
    name: "Commercial Property",
    type: "commercialProperty",
    purchaseYear: 2028,
    purchaseMarketValue: 1000000,
    incomePerWeek: 800,
    expensesPerYear: 10000,
    loanAmount: 700000,
    loanInterestOnlyPeriod: 3,
    capitalGrowthRate: 4,
  },
  {
    name: "Self Managed Super Fund",
    type: "selfManagedSuperFund",
    purchaseYear: 2024,
    purchaseMarketValue: 1000000,
    incomePerWeek: 900,
    expensesPerYear: 5000,
    loanAmount: 700000,
    loanInterestOnlyPeriod: 3,
  },
  {
    name: "Stock Portfolio",
    type: "stockPortfolio",
    purchaseYear: 2027,
    purchaseMarketValue: 200000,
    incomePerWeek: 200,
    expensesPerYear: 200,
    loanAmount: 0,
  },
  {
    name: "Principal Place of Residence",
    type: "principalPlaceOfResidence",
    purchaseYear: 2025,
    purchaseMarketValue: 600000,
    incomePerWeek: 0,
    expensesPerYear: 3000,
    loanAmount: 450000,
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
  "principalPlaceOfResidence"
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
    <table class="assets-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Purchase Year</th>
          <th>Market Value</th>
          <th>Weekly Income</th>
          <th>Annual Expenses</th>
          <th>Loan Amount</th>
          <th>IO Period</th>
          <th>Growth Rate (%)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="assetsTableBody">
        <!-- Asset rows will be added here -->
      </tbody>
    </table>
  `;

  const assetsTableBody = document.getElementById('assetsTableBody');

  // Add a row for each asset
  profile.assets.forEach((asset, index) => {
    addAssetTableRow(asset, index, assetsTableBody);
  });
}

/**
 * Creates a table row for an asset
 */
function addAssetTableRow(asset = {}, index, tableBody) {
  const assetRow = document.createElement('tr');
  assetRow.className = asset.hidden ? 'asset-row hidden-asset' : 'asset-row';
  assetRow.dataset.index = index;

  // Create HTML for the table row with all asset fields
  assetRow.innerHTML = `
    <td>
      <input type="text" name="name" value="${asset.name || ''}" data-field="name">
    </td>
    <td>
      <select name="type" data-field="type">
        ${assetTypes.map(type => `<option value="${type}" ${asset.type === type ? 'selected' : ''}>${type}</option>`).join('')}
      </select>
    </td>
    <td>
      <input type="number" name="purchaseYear" value="${asset.purchaseYear || ''}" data-field="purchaseYear">
    </td>
    <td>
      <input type="number" name="purchaseMarketValue" value="${asset.purchaseMarketValue || ''}" data-field="purchaseMarketValue">
    </td>
    <td>
      <input type="number" name="incomePerWeek" value="${asset.incomePerWeek || ''}" data-field="incomePerWeek">
    </td>
    <td>
      <input type="number" name="expensesPerYear" value="${asset.expensesPerYear || ''}" data-field="expensesPerYear">
    </td>
    <td>
      <input type="number" name="loanAmount" value="${asset.loanAmount || ''}" data-field="loanAmount">
    </td>
    <td>
      <input type="number" name="loanInterestOnlyPeriod" value="${asset.loanInterestOnlyPeriod || ''}" data-field="loanInterestOnlyPeriod">
    </td>
    <td>
      <input type="number" name="capitalGrowthRate" value="${asset.capitalGrowthRate || ''}" data-field="capitalGrowthRate" step="0.1">
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
    incomePerWeek: 0,
    expensesPerYear: 0,
    loanAmount: 0,
    loanInterestOnlyPeriod: settings.defaultLoanInterestOnlyPeriod,
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
  const labels = forecastResults.map(r => r.currentYear.toString());
  const debtData = forecastResults.map(r => r.assetLoanBalance);
  const equityData = forecastResults.map(r => r.assetValue - r.assetLoanBalance);
  const cashflowData = forecastResults.map(r => r.cashFlowAfterPrincipal);

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
 * Recalculate forecast and update the UI
 */
function recalculateAndUpdate() {
  try {
    // Only include valid and visible assets in calculation
    const validVisibleAssets = profile.assets.filter(asset =>
      isAssetValid(asset) && !asset.hidden
    );

    const calculationProfile = {
      ...profile,
      assets: validVisibleAssets
    };

    // Run the calculation
    results = calculateForecast(calculationProfile, settings);
    console.log({ results })

    // Update the chart and table
    updateChart(results);
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
            ${results.slice(0, 30).map(year => `
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

    // Create state object with current year and assets
    const state = {
      cy: profile.currentYear,
      pig: profile.passiveIncomeGoal,
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