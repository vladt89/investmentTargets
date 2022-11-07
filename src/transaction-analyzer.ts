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

const SKIP_SHOPS_SHORT_NAMES = ["ATM", "ROMANOV ALEKSANDR"];

const FOOD_SHOPS_FULL_NAMES = ["ALEPA MALMINKARTANO", "LIDL HKI-KONALA", "PRISMA KANNELMAKI", "K-supermarket Konala"];
const FOOD_SHOPS_SHORT_NAMES = ["ALEPA", "LIDL", "PRISMA", "K-supermarket", "K-market", "S-Market", "K-Citymarket"];
const HOUSE_SHOPS_SHORT_NAMES = ["Asunto Oy Kuparikartano", "IKEA", "K-Rauta"];
const KIDS_EXPENSES_NAMES = ["Phoenix Partners Ky/LaughLearn"];
const CAR_TRANSPORT_SHOPS_SHORT_NAMES = ["NESTE", "HSL", "HELPPOKATSASTUS"];

export class TransactionAnalyzer {

    run() {
        this.parseTransactionFiles();
    }

    parseTransactionFiles() {
        const csvFilePath = path.resolve(__dirname, '../transactionFiles/personal16.10.22.csv'); //familyMay22-Sep22
        const headers = ['bookingDate', 'amount', 'sender', 'recipient', 'name', 'title', 'referenceNumber', 'currency'];
        const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
        parse(fileContent, {
            delimiter: ';',
            columns: headers,
        }, (error: CsvError | undefined, transactions: Transaction[]) => {
            if (error) {
                console.error(error);
            }
            this.analyze(transactions);
        });
    }

    private analyze(transactions: Transaction[]) {
        const monthExpenses = new Map();
        let foodAmountsTOP = new Map<number, any>();
        let otherAmountsTOP = new Map<number, any>();
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
            let expenses = monthExpenses.get(month);
            if (expenses == undefined) {
                let newExpenses = {
                    food: 0,
                    houseAndFurniture: 0,
                    carAndTransport: 0,
                    kids: 0,
                    other: 0,
                    sum: amountCents
                };
                if (this.matchShop(shop, FOOD_SHOPS_FULL_NAMES, FOOD_SHOPS_SHORT_NAMES)) {
                    newExpenses.food = amountCents;
                    foodAmountsTOP.set(Math.abs(amountCents), {shop, date});
                } else if (this.matchShop(shop, [], HOUSE_SHOPS_SHORT_NAMES)) {
                    newExpenses.houseAndFurniture = amountCents;
                } else if (this.matchShop(shop, [], CAR_TRANSPORT_SHOPS_SHORT_NAMES)) {
                    newExpenses.carAndTransport = amountCents;
                } else if (this.matchShop(shop, [], KIDS_EXPENSES_NAMES)) {
                    newExpenses.kids = amountCents;
                } else {
                    newExpenses.other = amountCents;
                    otherAmountsTOP.set(Math.abs(amountCents), {shop, date});
                }
                monthExpenses.set(month, newExpenses);
            } else {
                const updateExpenses = {
                    food: expenses.food,
                    houseAndFurniture: expenses.houseAndFurniture,
                    carAndTransport: expenses.carAndTransport,
                    kids: expenses.kids,
                    other: expenses.other,
                    sum: expenses.sum + amountCents
                };
                if (this.matchShop(shop, FOOD_SHOPS_FULL_NAMES, FOOD_SHOPS_SHORT_NAMES)) {
                    updateExpenses.food = expenses.food + amountCents;
                    foodAmountsTOP = this.addToHighestAmounts(foodAmountsTOP, Math.abs(amountCents), shop, date);
                } else if (this.matchShop(shop, [], HOUSE_SHOPS_SHORT_NAMES)) {
                    updateExpenses.houseAndFurniture = expenses.houseAndFurniture + amountCents;
                } else if (this.matchShop(shop, [], CAR_TRANSPORT_SHOPS_SHORT_NAMES)) {
                    updateExpenses.carAndTransport = expenses.carAndTransport + amountCents;
                } else if (this.matchShop(shop, [], KIDS_EXPENSES_NAMES)) {
                    updateExpenses.kids = expenses.kids + amountCents;
                } else {
                    updateExpenses.other = expenses.other + amountCents;
                    otherAmountsTOP = this.addToHighestAmounts(otherAmountsTOP, Math.abs(amountCents), shop, date);
                }
                monthExpenses.set(month, updateExpenses);
                const sum = updateExpenses.food + updateExpenses.houseAndFurniture + updateExpenses.carAndTransport
                    + updateExpenses.kids + updateExpenses.other;
                if (updateExpenses.sum != sum) {
                    console.error("Sum is wrong");
                    return;
                }
            }
        }
        const topFood = new Map([...foodAmountsTOP].sort((a, b) => b[0] - a[0]));
        const topOther = new Map([...otherAmountsTOP].sort((a, b) => b[0] - a[0]));
        // console.log(foodAmountsTOP);
        // console.log(monthExpenses);
        this.analyzeMonthlyExpenses(monthExpenses, topFood, topOther);
    }

    private getMonth(date: Date) {
        return date.toLocaleString('default', {month: 'long', year: 'numeric'});
    }

    private analyzeMonthlyExpenses(monthExpenses: Map<any, any>, topFood: Map<number, unknown>, topOther: Map<number, unknown>) {
        let accountData = {expenses: []};
        let polishedExpenses: any[] = [];
        for (const expenses of monthExpenses) {
            const month = expenses[0];
            polishedExpenses.push({
                month,
                diagram: {
                    //  this.printExpense(expenses[1].food) + " euros ("  + parseInt(((expenses[1].food / expenses[1].sum) * 100).toString()) + "%)"
                    food: {
                        amount: this.printExpense(expenses[1].food),
                        percentage: parseInt(((expenses[1].food / expenses[1].sum) * 100).toString()),
                        topTransactions: this.transactionsToJson(topFood, month)
                    },
                    houseAndFurniture: this.printExpense(expenses[1].houseAndFurniture) + " euros ("  + parseInt(((expenses[1].houseAndFurniture / expenses[1].sum) * 100).toString())  + "%)",
                    carAndTransport: this.printExpense(expenses[1].carAndTransport) + " euros ("  + parseInt(((expenses[1].carAndTransport / expenses[1].sum) * 100).toString())  + "%)",
                    kids: this.printExpense(expenses[1].kids) + " euros ("  + parseInt(((expenses[1].kids / expenses[1].sum) * 100).toString())  + "%)",
                    other: {
                        amount: this.printExpense(expenses[1].other),
                        percentage: parseInt(((expenses[1].other / expenses[1].sum) * 100).toString()),
                        topTransactions: this.transactionsToJson(topOther, month)
                    },
                    sum: this.printExpense(expenses[1].sum) + " euros",
                }
            });
        }
        fs.writeFile("analyzeResults/test.json", JSON.stringify(polishedExpenses, null, 4), function(err) {
            if (err) {
                console.log(err);
            }
        });
        console.log(polishedExpenses);
    }

    private transactionsToJson(topTransactions: Map<number, any>, currentMonth: string) {
        let result: any = {};
        let i = 1;
        for (const amount of topTransactions.keys()) {
            const expense = topTransactions.get(amount);
            const transactionDate = new Date(expense.date);
            const month = this.getMonth(transactionDate);
            if (month === currentMonth) {
                // TODO make it more precise (cents are not in place)
                result[i] = "spent " + amount.toString().slice(0, amount.toString().length - 2)
                    + " euros in " + expense.shop + " on " + transactionDate.toDateString();
                i++;
            }
            // console.log("");
        }
        return result;
    }

    private printExpense(something: number) {
        if (something == 0) {
            return something.toString();
        }
        return something.toString().slice(1, something.toString().length - 2);
    }

    private addToHighestAmounts(inTopHighAmounts: Map<number, any>, amountCents: number, shop: string, date: Date) {
        const newTopNighAmounts = inTopHighAmounts;
        if (inTopHighAmounts.size == 0) {
            newTopNighAmounts.set(amountCents, {shop, date});
        } else {
            for (const topHighAmount of inTopHighAmounts.keys()) {
                if (amountCents > topHighAmount) {
                    newTopNighAmounts.set(amountCents, {shop, date});
                }
            }
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

    private matchShop(shop: string, shopFullNames: string[], shopShortNames: string[]) {
        const foundFullName = shopFullNames.includes(shop);
        if (!foundFullName) {
            for (const shortShopName of shopShortNames) {
                if (shop.toLowerCase().includes(shortShopName.toLowerCase())) {
                    return true;
                }
            }
        } else {
            return foundFullName;
        }
        return false;
    }
}
