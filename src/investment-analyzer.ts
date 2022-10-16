export class InvestmentAnalyzer {

    private MONTHLY_INVESTMENT: number = 400;
    private INVESTMENT_HORIZON_YEARS: number = 10;

    run() {
        const investmentMonths = this.INVESTMENT_HORIZON_YEARS * 12;
        let result = 0;
        for (let i: number = 1; i <= investmentMonths; i++) {
            result = result + this.MONTHLY_INVESTMENT;
        }
        console.log(`Investment horizon: ${this.INVESTMENT_HORIZON_YEARS} years`);
        console.log(`Monthly investment: ${this.MONTHLY_INVESTMENT} euros`);
        console.log(`Result: ${result} euros`);
    }
}