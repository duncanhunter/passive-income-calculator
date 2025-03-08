import { calculateForecast } from './dist/forecast-calculator.js';

// Example usage - replace with your actual data
const profile = {
  currentYear: 2025,
  passiveIncomeGoal: 200000,
  assets: [
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
  ]
};

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

// Run the calculation
const results = calculateForecast(profile, settings);

// Display the results
const resultsDiv = document.getElementById('results');
resultsDiv.innerHTML = `
  <h2>Forecast Results</h2>
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
`;

console.log('Full results:', results);


// DOM references
const chartCanvas = document.getElementById("forecastChart");
const sideDrawer = document.getElementById("sideDrawer");
const drawerContent = document.getElementById("drawerContent");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");

// Create or hold the chart instance
let forecastChart = null;

/**
 * Updates the chart with the latest forecast data.
 */
function updateChart(forecastResults) {
  // 1. Calculate forecast
  // forecastResults = calculateForecast(profile, settings);
  // forecastResults = results;

  const labels = forecastResults.map(r => r.currentYear.toString());
  const debtData = forecastResults.map(r => r.assetLoanBalance);
  const equityData = forecastResults.map(r => r.assetValue - r.assetLoanBalance);
  // const cashflowData = forecastResults.map(r => r.netIncome);
  const cashflowData = forecastResults.map(r => r.cashFlowAfterPrincipal);

  // Destroy existing chart if any
  if (forecastChart) {
    forecastChart.destroy();
  }

  // 2. Create new chart
  forecastChart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Debt",
          data: debtData,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          stack: "combined",
        },
        {
          label: "Equity",
          data: equityData,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          stack: "combined",
        },
        {
          label: "Passive Income",
          data: cashflowData,
          type: "line",
          yAxisID: "y1",
          borderColor: "green",
          borderWidth: 2,
          fill: false,
        },
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          stacked: true,
          title: {
            display: true,
            text: "Asset Value (Debt + Equity)",
          }
        },
        y1: {
          type: "linear",
          position: "right",
          title: {
            display: true,
            text: "Net Income",
          },
          grid: {
            drawOnChartArea: false
          }
        }
      },
      // 3. Add onClick to handle user clicks
      onClick: (evt, elements) => {
        // We want to get the index of the bar (X axis)
        // Using 'index' mode so if user clicks near that bar, we get the index
        const points = forecastChart.getElementsAtEventForMode(evt, 'index', { intersect: false }, false);
        if (points.length) {
          const firstPoint = points[0];
          const index = firstPoint.index; // which year
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
  // 1. Grab the data from forecastResults
  const yearData = results[index];
  if (!yearData) return;

  // 2. Build some HTML to display the year totals
  let html = `
<h2>Year: ${yearData.currentYear}</h2>
<p><strong>Gross Income:</strong> $${yearData.grossIncome}</p>
<p><strong>Expenses:</strong> $${yearData.expenses}</p>
<p><strong>Net Income:</strong> $${yearData.netIncome}</p>
<p><strong>Asset Value:</strong> $${yearData.assetValue}</p>
<p><strong>Loan Balance:</strong> $${yearData.assetLoanBalance}</p>
<p><strong>Equity:</strong> $${yearData.equity}</p>
`;

  // 3. If your `calculateForecast` returns a list of assets in each year, 
  //    you could also loop them here. For example, if you store them as yearData.assets:
  //    yearData.assets.forEach((a) => {
  //      html += `<div>Asset: ${a.name}, NetIncome: ${a.netIncome} ...</div>`;
  //    });

  drawerContent.innerHTML = html;
  sideDrawer.classList.add("open");    // triggers transform
  sideDrawer.classList.remove("hidden");
}

closeDrawerBtn.addEventListener("click", () => {
  sideDrawer.classList.remove("open");
  // We can also re-add "hidden" if we want to fully remove from layout
  // sideDrawer.classList.add("hidden");
});

updateChart(results);