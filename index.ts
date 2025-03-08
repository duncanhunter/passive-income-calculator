import { calculateForecast } from "./forecast-calculator";
import { Profile, Settings } from "./types";

const settings: Settings = {
    defaultCapitalGrowthRate: 5,
    defaultIncomeGrowthRate: 3,
    defaultExpenseGrowthRate: 3,
    defaultLoanToValueRatio: 80,
    defaultLoanInterestRate: 6,
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
            incomePerWeek: 700,
            expensesPerYear: 8000,
            loanAmount: 700000,
            loanInterestOnlyPeriod: 3,
        },
        {
            name: "Investment Property 2",
            type: "investmentProperty",
            purchaseYear: 2017,
            purchaseMarketValue: 850000,
            incomePerWeek: 700,
            expensesPerYear: 8000,
            loanAmount: 700000,
            loanInterestOnlyPeriod: 3,
        },
        {
            name: "Investment Property 3",
            type: "investmentProperty",
            purchaseYear: 2020,
            purchaseMarketValue: 850000,
            incomePerWeek: 700,
            expensesPerYear: 8000,
            loanAmount: 700000,
            loanInterestOnlyPeriod: 3,
        },
        {
            name: "Investment Property 4",
            type: "investmentProperty",
            purchaseYear: 2022,
            purchaseMarketValue: 850000,
            incomePerWeek: 700,
            expensesPerYear: 8000,
            loanAmount: 700000,
            loanInterestOnlyPeriod: 3,
        },
        {
            name: "Investment Property 5",
            type: "investmentProperty",
            purchaseYear: 2024,
            purchaseMarketValue: 850000,
            incomePerWeek: 700,
            expensesPerYear: 8000,
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
