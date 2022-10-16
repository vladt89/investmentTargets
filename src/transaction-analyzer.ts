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

const SKIP_SHOPS_SHORT_NAMES = ["ATM", "TIKHOMIROV", "WEINER"];

const FOOD_SHOPS_FULL_NAMES = ["ALEPA MALMINKARTANO", "LIDL HKI-KONALA", "PRISMA KANNELMAKI", "K-supermarket Konala"];
const FOOD_SHOPS_SHORT_NAMES = ["ALEPA", "LIDL", "PRISMA", "K-supermarket", "K-market", "S-Market", "K-Citymarket"];
const FURNITURE_SHOPS_SHORT_NAMES = ["IKEA", "K-Rauta"];
const CAR_TRANSPORT_SHOPS_SHORT_NAMES = ["NESTE", "HSL"];

export class TransactionAnalyzer {

    run() {
        this.parseTransactionFiles();
    }

    parseTransactionFiles() {
        const csvFilePath = path.resolve(__dirname, '../transactionFiles/familyMay22-Sep22.csv'); //familyMay22-Sep22
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
        let topHighFoodAmounts = new Map<number, any>();
        for (const transaction of transactions) {
            const shop = transaction.title;
            if (this.skip(transaction, shop, SKIP_SHOPS_SHORT_NAMES)) {
                continue;
            }
            let date = new Date(Date.parse(transaction.bookingDate));
            const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            const amountCents = parseInt(transaction.amount.replace(",", ""));
            if (amountCents > 0) { // we don't care about the income as we want to analyze the expenses
                continue;
            }
            let expenses = monthExpenses.get(month);
            if (expenses == undefined) {
                let newExpenses = {
                    food: 0,
                    furniture: 0,
                    carAndTransport: 0,
                    other: 0,
                    sum: amountCents
                };
                if (this.matchShop(shop, FOOD_SHOPS_FULL_NAMES, FOOD_SHOPS_SHORT_NAMES)) {
                    newExpenses.food = amountCents;
                    topHighFoodAmounts.set(Math.abs(amountCents), {shop, date});
                } else if (this.matchShop(shop, [], FURNITURE_SHOPS_SHORT_NAMES)) {
                    newExpenses.furniture = amountCents;
                } else if (this.matchShop(shop, [], CAR_TRANSPORT_SHOPS_SHORT_NAMES)) {
                    newExpenses.carAndTransport = amountCents;
                } else {
                    newExpenses.other = amountCents;
                }
                monthExpenses.set(month, newExpenses);
            } else {
                const updateExpenses = {
                    food: expenses.food,
                    furniture: expenses.furniture,
                    carAndTransport: expenses.carAndTransport,
                    other: expenses.other,
                    sum: expenses.sum + amountCents
                };
                if (this.matchShop(shop, FOOD_SHOPS_FULL_NAMES, FOOD_SHOPS_SHORT_NAMES)) {
                    updateExpenses.food = expenses.food + amountCents;
                    topHighFoodAmounts = this.addToHighestAmounts(topHighFoodAmounts, Math.abs(amountCents), shop, date);
                } else if (this.matchShop(shop, [], FURNITURE_SHOPS_SHORT_NAMES)) {
                    updateExpenses.furniture = expenses.furniture + amountCents;
                } else if (this.matchShop(shop, [], CAR_TRANSPORT_SHOPS_SHORT_NAMES)) {
                    updateExpenses.carAndTransport = expenses.carAndTransport + amountCents;
                } else {
                    updateExpenses.other = expenses.other + amountCents;
                }
                monthExpenses.set(month, updateExpenses);
                const sum = updateExpenses.food + updateExpenses.furniture + updateExpenses.carAndTransport + updateExpenses.other;
                if (updateExpenses.sum != sum) {
                    console.error("Sum is wrong");
                    return;
                }
            }
        }
        const resultTop = new Map([...topHighFoodAmounts].sort((a, b) => b[0] - a[0]));
        console.log(resultTop);
        // console.log(monthExpenses);
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
