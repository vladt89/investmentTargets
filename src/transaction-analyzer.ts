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
    food: number,
    houseAndFurniture: number,
    carAndTransport: number,
    kids: number,
    insurance: number,
    travel: number,
    sportEatFun: number,
    health: number,
    other: number,
    sum: number
}

const SKIP_SHOPS_SHORT_NAMES = [
    "ATM",
    "ROMANOV ALEKSANDR",
    "Autodoc AG", // Vasya
    "VERKKOKAUPPA.COM MYYMALAT", // monitor
    "Paysend EU" // personal
];

const FOOD_SHOPS_SHORT_NAMES = ["ALEPA", "LIDL", "PRISMA", "K-supermarket", "K-market", "S-Market", "K-Citymarket",
    "K market", "MINIMARKET", "S MARKET", "LENTA", "EDEKA", "PEREKRESTOK"];
const HOUSE_SHOPS_SHORT_NAMES = ["Asunto Oy Kuparikartano", "IKEA", "K-Rauta", "Helen Oy", "TIKHOMIROV V TAI WEINER C",
    "Elisa Oyj"];
const KIDS_FAMILY_NAMES = ["Phoenix Partners Ky/LaughLearn", "MUSTI JA MIRRI", "VETKLINIKA VOLF", "EVGENIJA KRUGLOVA",
    "TIKHOMIROV VLADIMIR", "PERHEKESKUS MARIA RY"];
const SPORT_FOOD_FUN_NAMES = ["TALIHALLI", "ACTIVE GROUP RY", "VFI*Rami's Coffee Oy", "Inna Repo", "Asian Fusion Oy",
    "SEIKKAILUPUISTO ZIPPY", "INTER RAVINTOLA", "INTER PIZZA", "Electrobike", "XXL", "RESTAURANT", "PoplaCandy",
    "ABC", "BK KONALA", "CAFE", "CITY OF HELSINKI", "Wilhelm Breimaier", "Intelinvest", "RAVINTOLA", "PIZZERIA",
    "Eat Poke Hki Oy", "HIEKKA BEACHSPOT OY", "HSBIKEDISCO", "DIGICLOUDTR", "Taste Creator Oy", "HESBURGER",
    "OCR Factory", "IGELS", "TONI PITKANEN"];
const CAR_TRANSPORT_SHOPS_SHORT_NAMES = ["NESTE", "HSL", "HELPPOKATSASTUS", "PARKMAN", "Parking", "TANKSTELLE",
    "AIMO PARK", "Teboil", "SHELL", "LansiAuto", "ODNO KOLESO", "TANKSTATION", "Aral Station", "TRAFICOM"];
const TRAVEL_NAMES = ["VIKING LINE", "Tallink", "FINNLADY", "FINNLINES", "Hotel"];
const HEALTH_NAMES = ["TERVEYSTALO MYYRMAKI", "Specsavers", "Malminkartanon apteekki", "CENTR KORREKCII ZRENIYA",
    "APTEKA"];
const INSURANCE_NAMES = ["POHJOLA VAKUUTUS OY", "IF VAKUUTUS"];

const fileName = 'personal1.06.21-31.12.21'; //'personal16.10.22'; //'personalMay22-Sep22'; //'personal16.10.22'; //familyMay22-Sep22

type TransactionDetails = { amount: number, shop: string, date: Date };

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
        let foodTransactions: TransactionDetails[] = [];
        let houseAndFurnitureTransactions: TransactionDetails[] = [];
        let carAndTransportTransactions: TransactionDetails[] = [];
        let kidsTransactions: TransactionDetails[] = [];
        let insuranceTransactions: TransactionDetails[] = [];
        let travelTransactions: TransactionDetails[] = [];
        let sportsEatFunTransactions: TransactionDetails[] = [];
        let healthTransactions: TransactionDetails[] = [];
        let otherTransactions: TransactionDetails[] = [];
        for (const transaction of transactions) {
            const shop = transaction.title;
            if (this.skip(transaction, shop, SKIP_SHOPS_SHORT_NAMES)) {
                continue;
            }
            const bookingDate = transaction.bookingDate;
            if (bookingDate === "Reserved") { // skip transactions that were not completed
                continue;
            }
            let date = new Date(Date.parse(bookingDate));
            const month = this.getMonth(date);
            const amountCents = parseInt(transaction.amount.replace(",", ""));
            if (amountCents > 0) { // NOTE: we don't care about the income as we want to analyze the expenses
                continue;
            }
            let expenses: Expenses | undefined = monthExpenses.get(month);
            let updateExpenses: Expenses;
            if (expenses == undefined) {
                updateExpenses = {
                    food: 0,
                    houseAndFurniture: 0,
                    carAndTransport: 0,
                    kids: 0,
                    insurance: 0,
                    travel: 0,
                    sportEatFun: 0,
                    health: 0,
                    other: 0,
                    sum: amountCents
                };
            } else {
                updateExpenses = {
                    food: expenses.food,
                    houseAndFurniture: expenses.houseAndFurniture,
                    carAndTransport: expenses.carAndTransport,
                    kids: expenses.kids,
                    insurance: expenses.insurance,
                    travel: expenses.travel,
                    sportEatFun: expenses.sportEatFun,
                    health: expenses.health,
                    other: expenses.other,
                    sum: expenses.sum + amountCents
                };
            }
            const transactionDetails: TransactionDetails = {amount: Math.abs(amountCents), shop, date};
            if (this.matchShop(shop, FOOD_SHOPS_SHORT_NAMES)) {
                updateExpenses.food = (expenses ? expenses.food : 0) + amountCents;
                foodTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, HOUSE_SHOPS_SHORT_NAMES)) {
                updateExpenses.houseAndFurniture = (expenses ? expenses.houseAndFurniture : 0) + amountCents;
                houseAndFurnitureTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, CAR_TRANSPORT_SHOPS_SHORT_NAMES)) {
                updateExpenses.carAndTransport = (expenses ? expenses.carAndTransport : 0) + amountCents;
                carAndTransportTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, KIDS_FAMILY_NAMES)) {
                updateExpenses.kids = (expenses ? expenses.kids : 0) + amountCents;
                kidsTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, INSURANCE_NAMES)) {
                updateExpenses.insurance = (expenses ? expenses.insurance : 0) + amountCents;
                insuranceTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, TRAVEL_NAMES)) {
                updateExpenses.travel = (expenses ? expenses.travel : 0) + amountCents;
                travelTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, SPORT_FOOD_FUN_NAMES)) {
                updateExpenses.sportEatFun = (expenses ? expenses.sportEatFun : 0) + amountCents;
                sportsEatFunTransactions.push(transactionDetails);
            } else if (this.matchShop(shop, HEALTH_NAMES)) {
                updateExpenses.health = (expenses ? expenses.health : 0) + amountCents;
                healthTransactions.push(transactionDetails);
            } else {
                updateExpenses.other = (expenses ? expenses.other : 0) + amountCents;
                otherTransactions.push(transactionDetails);
            }
            monthExpenses.set(month, updateExpenses);
            const sum = updateExpenses.food + updateExpenses.houseAndFurniture + updateExpenses.carAndTransport
                + updateExpenses.kids + updateExpenses.insurance + updateExpenses.travel + updateExpenses.sportEatFun
                + updateExpenses.health + updateExpenses.other;
            if (updateExpenses.sum != sum) {
                console.error("Sum is wrong");
                throw new Error("Sum is wrong");
            }
        }

        return this.analyzeMonthlyExpenses(monthExpenses, foodTransactions, houseAndFurnitureTransactions,
            carAndTransportTransactions, kidsTransactions, insuranceTransactions, travelTransactions,
            sportsEatFunTransactions, healthTransactions, otherTransactions);
    }

    private getMonth(date: Date) {
        return date.toLocaleString('default', {month: 'long', year: 'numeric'});
    }

    private analyzeMonthlyExpenses(monthExpenses: Map<any, Expenses>,
                                   foodTransactions: TransactionDetails[],
                                   houseAndFurnitureTransactions: TransactionDetails[],
                                   carAndTransportTransactions: TransactionDetails[],
                                   kidsTransactions: TransactionDetails[],
                                   insuranceTransactions: TransactionDetails[],
                                   travelTransactions: TransactionDetails[],
                                   sportsEatFunTransactions: TransactionDetails[],
                                   healthTransactions: TransactionDetails[],
                                   otherTransactions: TransactionDetails[]): any[] {
        let accountData = {expenses: []};
        let polishedExpenses: any[] = [];
        let allFileSumma = 0;
        for (const month of monthExpenses.keys()) {
            const expenses = monthExpenses.get(month);
            if (!expenses) {
                throw new Error("Error: expenses for " + month + " are not defined");
            }
            const monthSumma: number = expenses.sum;
            allFileSumma += monthSumma;
            const foodAmount: number = expenses.food;
            const houseAndFurnitureAmount: number = expenses.houseAndFurniture;
            const carAndTransportAmount = expenses.carAndTransport;
            const travelAmount = expenses.travel;
            const sportEatFunAmount = expenses.sportEatFun;
            const otherAmount = expenses.other;
            const kidsAmount = expenses.kids;
            const insuranceAmount = expenses.insurance;
            const healthAmount = expenses.health;
            polishedExpenses.push({
                month,
                sum: this.centsToFloatEuros(monthSumma) + " euros",
                categories: {
                    food: {
                        amount: this.centsToFloatEuros(foodAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(foodAmount, monthSumma),
                        transactions: this.transactionsToJson(foodTransactions, month)
                    },
                    houseAndFurniture: {
                        amount: this.centsToFloatEuros(houseAndFurnitureAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(houseAndFurnitureAmount, monthSumma),
                        transactions: this.transactionsToJson(houseAndFurnitureTransactions, month)
                    },
                    carAndTransport: {
                        amount: this.centsToFloatEuros(carAndTransportAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(carAndTransportAmount, monthSumma),
                        transactions: this.transactionsToJson(carAndTransportTransactions, month)
                    },
                    kids: {
                        amount: this.centsToFloatEuros(kidsAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(kidsAmount, monthSumma),
                        transactions: this.transactionsToJson(kidsTransactions, month)
                    },
                    insurance: {
                        amount: this.centsToFloatEuros(insuranceAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(insuranceAmount, monthSumma),
                        transactions: this.transactionsToJson(insuranceTransactions, month)
                    },
                    travel: {
                        amount: this.centsToFloatEuros(travelAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(travelAmount, monthSumma),
                        transactions: this.transactionsToJson(travelTransactions, month)
                    },
                    sportEatFun: {
                        amount: this.centsToFloatEuros(sportEatFunAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(sportEatFunAmount, monthSumma),
                        transactions: this.transactionsToJson(sportsEatFunTransactions, month)
                    },
                    health: {
                        amount: this.centsToFloatEuros(healthAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(healthAmount, monthSumma),
                        transactions: this.transactionsToJson(healthTransactions, month)
                    },
                    other: {
                        amount: this.centsToFloatEuros(otherAmount),
                        percentage: TransactionAnalyzer.calculatePercentage(otherAmount, monthSumma),
                        transactions: this.transactionsToJson(otherTransactions, month)
                    }
                }
            });
        }

        const monthCount = monthExpenses.size;
        const averageMonthExpenses = Math.round((this.centsToFloatEuros(allFileSumma) / monthCount) * 100) / 100 + " euros";
        console.log(averageMonthExpenses + " is average monthly expenses during the period of " + monthCount + " month(s)");

        return polishedExpenses;
    }

    private static calculatePercentage(categoryAmountCents: number, monthSummaCents: number) {
        return Math.round(((categoryAmountCents / monthSummaCents) * 100) * 100) / 100;
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
            amount: this.centsToFloatEuros(cents),
            percentage: parseInt(((cents / expenses[1].sum) * 100).toString()),
            transactions: this.transactionsToJson(topHouseAndFurniture, month)
        };
    }

    // using array because Map misses some transactions because the key is the amount which can be repeating
    private transactionsToJson(transactions: TransactionDetails[], currentMonth: string) {
        let result: any = {};
        function compare(tr1: TransactionDetails, tr2: TransactionDetails) {
            if (tr1.amount > tr2.amount) {
                return -1;
            }
            return 0;
        }
        const sortedTransactions = transactions.sort(compare);
        let monthlyTransactionCount = 0;
        for (let i = 0; i < sortedTransactions.length; i++) {
            const topTransaction = transactions[i];
            const amount = topTransaction.amount;
            const transactionDate = new Date(topTransaction.date);
            const month = this.getMonth(transactionDate);
            if (month === currentMonth) {
                monthlyTransactionCount++;
                result[monthlyTransactionCount] = "spent " + this.centsToFloatEuros(amount)
                    + " euros in " + topTransaction.shop + " on " + transactionDate.toDateString();
            }
        }
        return result;
    }

    centsToFloatEuros(amount: number): number {
        const strAmount = Math.abs(amount).toString();
        if (amount == 0) {
            return 0;
        }
        const mainPart = strAmount.slice(0, strAmount.length - 2);
        const restPart = strAmount.slice(strAmount.length - 2);
        return parseFloat(mainPart + "." + restPart);
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
