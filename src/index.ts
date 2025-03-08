import { calculateForecast } from "./forecast-calculator.js";
import { Profile, Settings } from "./types.js";


const settings: Settings = {
    defaultCapitalGrowthRate: 5,
    defaultIncomeGrowthRate: 3,
    defaultExpenseGrowthRate: 3,
    defaultLoanToValueRatio: 80,
    defaultLoanInterestRate: 5,
    defaultLoanInterestOnlyPeriod: 3,
    defaultLoanTermYears: 30,
    defaultPrincipalResidenceLoanTermYears: 20,
};

const profile: Profile = {
    currentYear: 2025,
    yearsToGoal: 15,
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
    ],
};

const forecastResults = calculateForecast(profile, settings);

console.log(JSON.stringify(forecastResults));
