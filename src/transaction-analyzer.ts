import * as fs from "fs";
import * as path from "path";
import {CsvError, parse} from 'csv-parse';

type Transaction = {
    bookingDate: string;
    amount: string;
    sender: string;
    recipient: string;
    name: string;
    title: string;
    referenceNumber: string;
    currency: string;
};

interface Expenses {
    [key: string]: any
    // food: number,
    // houseAndFurniture: number,
    // carAndTransport: number,
    // kids: number,
    // travel: number,
    // sportEatFun: number,
    // other: number,
    // sum: number
}

const SKIP_SHOPS_SHORT_NAMES = [
    "ATM",
    "ROMANOV ALEKSANDR",
    "Autodoc AG", // Vasya
    "VERKKOKAUPPA.COM MYYMALAT" // monitor
];

const FOOD_SHOPS_SHORT_NAMES = ["ALEPA", "LIDL", "PRISMA", "K-supermarket", "K-market", "S-Market", "K-Citymarket"];
const HOUSE_SHOPS_SHORT_NAMES = ["Asunto Oy Kuparikartano", "IKEA", "K-Rauta", "Helen Oy", "TIKHOMIROV V TAI WEINER C"];
const KIDS_EXPENSES_NAMES = ["Phoenix Partners Ky/LaughLearn"];
const SPORT_FOOD_FUN_NAMES = ["TALIHALLI", "ACTIVE GROUP RY", "VFI*Rami's Coffee Oy", "Inna Repo", "Asian Fusion Oy",
    "SEIKKAILUPUISTO ZIPPY", "INTER RAVINTOLA", "Electrobike", "XXL", "RESTAURANT", "PoplaCandy"];
const CAR_TRANSPORT_SHOPS_SHORT_NAMES = ["NESTE", "HSL", "HELPPOKATSASTUS", "PARKMAN", "Parking", "TANKSTELLE"];
const TRAVEL_NAMES = ["VIKING LINE", "Tallink", "FINNLADY", "FINNLINES"]
const HEALTH_NAMES = ["TERVEYSTALO MYYRMAKI", "Specsavers", "Malminkartanon apteekki"]

const fileName = 'personal16.10.22'; //'personalMay22-Sep22'; //'personal16.10.22'; //familyMay22-Sep22

export class TransactionAnalyzer {

    async run() {
        const fileContent = this.readFile();
        const transactions = await this.parseTransactionFiles(fileContent);
        const analysis = this.analyze(transactions);
        if (analysis) {
            this.saveFile(JSON.stringify(analysis, null, 4));
        }
    }

    async parseTransactionFiles(fileContent: string): Promise<Transaction[]> {
        const headers = ['bookingDate', 'amount', 'sender', 'recipient', 'name', 'title', 'referenceNumber', 'currency'];
        return new Promise((resolve, reject) => {
            parse(fileContent, {
                delimiter: ';',
                columns: headers,
            }, (error: CsvError | undefined, transactions: Transaction[]) => {
                if (error) {
                    console.error(error);
                    reject(error);
                }
                resolve(transactions);
            });
        });
    }

    private readFile() {
        const csvFilePath = path.resolve(__dirname, '../transactionFiles/' + fileName + ".csv");
        return fs.readFileSync(csvFilePath, {encoding: 'utf-8'});
    }

    analyze(transactions: Transaction[]): any[] {
        const monthExpenses = new Map<string, Expenses>();
        let foodAmountsTOP: any[] = [];
        let houseAndFurnitureAmountsTOP: any[] = [];
        let otherAmountsTOP: any[] = [];
        for (const transaction of transactions) {
            const shop = transaction.title;
            if (this.skip(transaction, shop, SKIP_SHOPS_SHORT_NAMES)) {
                continue;
            }
            let date = new Date(Date.parse(transaction.bookingDate));
            const month = this.getMonth(date);
            const amountCents = parseInt(transaction.amount.replace(",", ""));
            if (amountCents > 0) { // we don't care about the income as we want to analyze the expenses
                continue;
            }
            let expenses: Expenses | undefined = monthExpenses.get(month);
            if (expenses == undefined) {
                let newExpenses: Expenses = {
                    food: 0,
                    houseAndFurniture: 0,
                    carAndTransport: 0,
                    kids: 0,
                    travel: 0,
                    sportEatFun: 0,
                    other: 0,
                    sum: amountCents
                };
                if (this.matchShop(shop, FOOD_SHOPS_SHORT_NAMES)) {
                    newExpenses.food = amountCents;
                    foodAmountsTOP.push({amount: Math.abs(amountCents), details: {shop, date}});
                } else if (this.matchShop(shop, HOUSE_SHOPS_SHORT_NAMES)) {
                    newExpenses.houseAndFurniture = amountCents;
                    houseAndFurnitureAmountsTOP.push({amount: Math.abs(amountCents), details: {shop, date}});
                } else if (this.matchShop(shop, CAR_TRANSPORT_SHOPS_SHORT_NAMES)) {
                    newExpenses.carAndTransport = amountCents;
                } else if (this.matchShop(shop, KIDS_EXPENSES_NAMES)) {
                    newExpenses.kids = amountCents;
                } else if (this.matchShop(shop, TRAVEL_NAMES)) {
                    newExpenses.travel = amountCents;
                } else if (this.matchShop(shop, SPORT_FOOD_FUN_NAMES)) {
                    newExpenses.sportEatFun = amountCents;
                } else {
                    newExpenses.other = amountCents;
                    otherAmountsTOP.push({amount: Math.abs(amountCents), details: {shop, date}});
                }
                monthExpenses.set(month, newExpenses);
            } else {
                const updateExpenses: Expenses = {
                    food: expenses.food,
                    houseAndFurniture: expenses.houseAndFurniture,
                    carAndTransport: expenses.carAndTransport,
                    kids: expenses.kids,
                    travel: expenses.travel,
                    sportEatFun: expenses.sportEatFun,
                    other: expenses.other,
                    sum: expenses.sum + amountCents
                };
                if (this.matchShop(shop, FOOD_SHOPS_SHORT_NAMES)) {
                    updateExpenses.food = expenses.food + amountCents;
                    foodAmountsTOP = this.addToHighestAmounts2(foodAmountsTOP, Math.abs(amountCents), shop, date);
                } else if (this.matchShop(shop, HOUSE_SHOPS_SHORT_NAMES)) {
                    updateExpenses.houseAndFurniture = expenses.houseAndFurniture + amountCents;
                    houseAndFurnitureAmountsTOP = this.addToHighestAmounts2(houseAndFurnitureAmountsTOP, Math.abs(amountCents), shop, date);
                } else if (this.matchShop(shop, CAR_TRANSPORT_SHOPS_SHORT_NAMES)) {
                    updateExpenses.carAndTransport = expenses.carAndTransport + amountCents;
                } else if (this.matchShop(shop, KIDS_EXPENSES_NAMES)) {
                    updateExpenses.kids = expenses.kids + amountCents;
                } else if (this.matchShop(shop, TRAVEL_NAMES)) {
                    updateExpenses.travel = expenses.travel + amountCents;
                } else if (this.matchShop(shop, SPORT_FOOD_FUN_NAMES)) {
                    updateExpenses.sportEatFun = expenses.sportEatFun + amountCents;
                } else {
                    updateExpenses.other = expenses.other + amountCents;
                    otherAmountsTOP = this.addToHighestAmounts2(otherAmountsTOP, Math.abs(amountCents), shop, date);
                }
                monthExpenses.set(month, updateExpenses);
                const sum = updateExpenses.food + updateExpenses.houseAndFurniture + updateExpenses.carAndTransport
                    + updateExpenses.kids + updateExpenses.travel + updateExpenses.sportEatFun + updateExpenses.other;
                if (updateExpenses.sum != sum) {
                    console.error("Sum is wrong");
                    throw new Error("Sum is wrong");
                }
            }
        }

        return this.analyzeMonthlyExpenses(monthExpenses, foodAmountsTOP, houseAndFurnitureAmountsTOP, otherAmountsTOP);
    }

    private getMonth(date: Date) {
        return date.toLocaleString('default', {month: 'long', year: 'numeric'});
    }

    private analyzeMonthlyExpenses(monthExpenses: Map<any, any>, topFood: any[],
                                   topHouseAndFurniture: any[], topOther: any[]): any[] {
        let accountData = {expenses: []};
        let polishedExpenses: any[] = [];
        for (const expenses of monthExpenses) {
            const month = expenses[0];
            polishedExpenses.push({
                month,
                sum: this.printExpense(expenses[1].sum) + " euros",
                categories: {
                    food: {
                        amount: this.printExpense(expenses[1].food),
                        percentage: Math.round(((expenses[1].food / expenses[1].sum) * 100) * 100) / 100,
                        topTransactions: this.transactionsToJson(topFood, month)
                    },
                    houseAndFurniture: {
                        amount: this.printExpense(expenses[1].houseAndFurniture),
                        percentage: Math.round(((expenses[1].houseAndFurniture / expenses[1].sum) * 100) * 100) / 100,
                        topTransactions: this.transactionsToJson(topHouseAndFurniture, month)
                    },
                    carAndTransport: {
                        amount: this.printExpense(expenses[1].carAndTransport),
                        percentage: Math.round(((expenses[1].carAndTransport / expenses[1].sum) * 100) * 100) / 100,
                        topTransactions: [] // this.transactionsToJson(topHouseAndFurniture, month)
                    },
                    kids: {
                        amount: this.printExpense(expenses[1].kids),
                        percentage: Math.round(((expenses[1].kids / expenses[1].sum) * 100) * 100) / 100,
                        topTransactions: [] // this.transactionsToJson(topHouseAndFurniture, month)
                    },
                    travel: {
                        amount: this.printExpense(expenses[1].travel),
                        percentage: Math.round(((expenses[1].travel / expenses[1].sum) * 100) * 100) / 100,
                        topTransactions: [] // this.transactionsToJson(topHouseAndFurniture, month)
                    },
                    sportEatFun: {
                        amount: this.printExpense(expenses[1].sportEatFun),
                        percentage: Math.round(((expenses[1].sportEatFun / expenses[1].sum) * 100) * 100) / 100,
                        topTransactions: [] // this.transactionsToJson(topHouseAndFurniture, month)
                    },
                    other: {
                        amount: this.printExpense(expenses[1].other),
                        percentage: Math.round(((expenses[1].other / expenses[1].sum) * 100) * 100) / 100,
                        topTransactions: this.transactionsToJson(topOther, month)
                    }
                }
            });
        }
        return polishedExpenses;
    }

    private saveFile(result: string) {
        const path = "analyzeResults/analysis_" + fileName + ".json";
        fs.writeFile(path, result, function (err) {
            if (err) {
                console.log(err);
            }
            console.log("Analyzed file is saved to " + path);
        });
    }

    private getCategoryAnalysis(expenses: [any, any], topHouseAndFurniture: any[], month: any) {
        const cents = expenses[1].houseAndFurniture;
        let transactionSum = 0;
        for (const transaction of topHouseAndFurniture) {
            transactionSum += transaction.amount;
        }
        if (transactionSum != cents) {
            console.error("Month's expenses are not matching");
        }
        return {
            amount: this.printExpense(cents),
            percentage: parseInt(((cents / expenses[1].sum) * 100).toString()),
            topTransactions: this.transactionsToJson(topHouseAndFurniture, month)
        };
    }

    // using array because Map misses some transactions because the key is the amount which can be repeating
    private transactionsToJson(topTransactions: any[], currentMonth: string) {
        let result: any = {};
        for (let i = 0; i < topTransactions.length; i++) {
            const topTransaction = topTransactions[i];
            const amount = topTransaction.amount;
            const expense = topTransaction.details;
            const transactionDate = new Date(expense.date);
            const month = this.getMonth(transactionDate);
            if (month === currentMonth) {
                // TODO make it more precise (cents are not in place)
                result[i + 1] = "spent " + amount.toString().slice(0, amount.toString().length - 2)
                    + " euros in " + expense.shop + " on " + transactionDate.toDateString();
            }
        }
        return result;
    }


    private printExpense(amount: number) {
        const strAmount = amount.toString();
        if (amount == 0) {
            return strAmount;
        }
        const mainPart = strAmount.slice(1, strAmount.length - 2);
        const restPart = strAmount.slice(strAmount.length - 2);
        return parseFloat(mainPart + "." + restPart);
    }

    private addToHighestAmounts(inTopHighAmounts: Map<number, any>, amountCents: number, shop: string, date: Date) {
        const newTopNighAmounts = inTopHighAmounts;
        if (inTopHighAmounts.size == 0) {
            newTopNighAmounts.set(amountCents, {shop, date});
        } else {
            // for (const topHighAmount of inTopHighAmounts.keys()) {
                // if (amountCents > topHighAmount) {
                    newTopNighAmounts.set(amountCents, {shop, date});
                // }
            // }
        }
        return newTopNighAmounts;
    }

    private addToHighestAmounts2(inTopHighAmounts: {amount: number, details: any}[], amountCents: number, shop: string, date: Date) {
        const newTopNighAmounts = inTopHighAmounts;
        if (inTopHighAmounts.length == 0) {
            newTopNighAmounts.push({amount: amountCents, details: {shop, date}});
        } else {
            // for (const inTopHighAmount of inTopHighAmounts) {
            //     if (amountCents > inTopHighAmount.amount) {
                    newTopNighAmounts.push({amount: amountCents, details: {shop, date}});
                // }
            // }
        }
        return newTopNighAmounts;
    }

    private skip(transaction: Transaction, shop: string, shopShortNames: string[]) {
        const skipFirstRow = transaction.bookingDate.endsWith("Booking date");
        if (!skipFirstRow) {
            for (const shortShopName of shopShortNames) {
                if (shop.toLowerCase().includes(shortShopName.toLowerCase())) {
                    return true;
                }
            }
        } else {
            return skipFirstRow;
        }
        return false;
    }

    private matchShop(shop: string, shopShortNames: string[]) {
        for (const shortShopName of shopShortNames) {
            if (shop.toLowerCase().includes(shortShopName.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
}
