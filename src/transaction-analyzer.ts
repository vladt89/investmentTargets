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

export class TransactionAnalyzer {

    run() {
        this.parseTransactionFiles();
    }

    parseTransactionFiles() {
        const csvFilePath = path.resolve(__dirname, '../transactionFiles/personal16.10.22.csv');
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
        const foodShops = ["ALEPA MALMINKARTANO", "LIDL HKI-KONALA", "PRISMA KANNELMAKI", "K-supermarket Konala"];
        for (const transaction of transactions) {
            // console.log(transaction);
            if (transaction.bookingDate.endsWith("Booking date")) { // let's skip the column names row
                continue;
            }
            let date = new Date(Date.parse(transaction.bookingDate));
            const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            const shop = transaction.title;
            const amountCents = parseInt(transaction.amount.replace(",", ""));
            if (amountCents > 0) { // we don't care about the income as we want to analyze the expenses
                continue;
            }
            let expenses = monthExpenses.get(month);
            if (expenses == undefined) {
                let newExpenses = {
                    food: 0,
                    other: 0,
                    sum: amountCents
                };
                if (foodShops.includes(shop)) {
                    newExpenses.food = amountCents;
                } else {
                    newExpenses.other = amountCents;
                }
                monthExpenses.set(month, newExpenses);
            } else {
                const updateExpenses = {
                    food: expenses.food,
                    other: expenses.other,
                    sum: expenses.sum + amountCents
                };
                if (foodShops.includes(shop)) {
                    updateExpenses.food = expenses.food + amountCents;
                } else {
                    updateExpenses.other = expenses.other + amountCents;
                }
                monthExpenses.set(month, updateExpenses);
                if (updateExpenses.sum != updateExpenses.food + updateExpenses.other) {
                    console.error("Something went wrong!");
                }
            }
        }
        console.log(monthExpenses);
    }
}
