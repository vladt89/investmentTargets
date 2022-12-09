import {TransactionAnalyzer} from "../src/transaction-analyzer";


describe('Transaction analyzer', () => {
    const transactionAnalyzer = new TransactionAnalyzer();

    it('should verify all categories for 1 month', async () => {
        const fileContent =
            "﻿Booking date;Amount;Sender;Recipient;Name;Title;Reference number;Currency\n" +
            // carAndTransport
            "2022/10/07;-50,00;FI57 1040 3500 4294 14;;;NESTE EXPRESS HEL MALMIN;;EUR\n" +
            "2022/10/07;-2,80;FI57 1040 3500 4294 14;;;HSL Mobiili;;EUR\n" +
            "2022/10/07;-2,80;FI57 1040 3500 4294 14;;;HSL Mobiili;;EUR\n" +
            // food
            "2022/10/11;-27,37;FI57 1040 3500 4294 14;;;ALEPA MALMINKARTANO;;EUR\n" +
            "2022/10/10;-5,27;FI57 1040 3500 4294 14;;;ALEPA MALMINKARTANO;;EUR\n" +
            "2022/10/10;-27,37;FI57 1040 3500 4294 14;;;ALEPA MALMINKARTANO;;EUR\n" +
            "2022/10/10;-10,96;FI57 1040 3500 4294 14;;;K-supermarket Konala;;EUR\n" +
            // houseAndFurniture
            "2022/10/05;-734,80;FI57 1040 3500 4294 14;;;Asunto Oy Kuparikartano;;EUR\n" +
            "2022/10/05;-173,00;FI57 1040 3500 4294 14;;;TIKHOMIROV V TAI WEINER C;;EUR\n" +
            "2022/10/05;-55,46;FI57 1040 3500 4294 14;;;Helen Oy;;EUR\n" +
            "2022/10/05;-55,46;FI57 1040 3500 4294 14;;;Helen Oy;;EUR\n" +
            // kids
            "2022/10/31;-265,94;FI57 1040 3500 4294 14;;;Phoenix Partners Ky/LaughLearn;;EUR\n" +
            // other
            "2022/10/10;-0,99;FI57 1040 3500 4294 14;;;APPLE.COM/BILL;;EUR\n" +
            "2022/10/10;-0,99;FI57 1040 3500 4294 14;;;APPLE.COM/BILL;;EUR\n" +
            "2022/10/10;-6,00;FI57 1040 3500 4294 14;;;Espoon kaupunki;;EUR\n" +
            "2022/10/10;-5,99;FI57 1040 3500 4294 14;;;Motonet Helsinki, Konala;;EUR\n" +
            // sportEatFun
            "2022/10/10;-10,10;FI57 1040 3500 4294 14;;;VFI*Rami's Coffee Oy;;EUR\n" +
            // travel
            "2022/10/10;-1189,68;FI57 1040 3500 4294 14;;;FINNLINES OYJ;;EUR";

        const transactions = await transactionAnalyzer.parseTransactionFiles(fileContent);
        // exercise
        const analyzeResult = transactionAnalyzer.analyze(transactions);
        expect(analyzeResult).toEqual({
            "averageMonthExpenses": "2624.98 euros",
            "monthlyExpenses": [{
                "categories": {
                    "carAndTransport": {
                        "amount": 55.6,
                        "percentage": 2.12,
                        "transactions": {
                            "1": "spent 50 euros in NESTE EXPRESS HEL MALMIN on Fri Oct 07 2022",
                            "2": "spent 2.8 euros in HSL Mobiili on Fri Oct 07 2022",
                            "3": "spent 2.8 euros in HSL Mobiili on Fri Oct 07 2022",
                            "on average": "spent 18.53 euros"
                        }
                    },
                    "food": {
                        "amount": 70.97,
                        "percentage": 2.7,
                        "transactions": {
                            "1": "spent 27.37 euros in ALEPA MALMINKARTANO on Tue Oct 11 2022",
                            "2": "spent 27.37 euros in ALEPA MALMINKARTANO on Mon Oct 10 2022",
                            "3": "spent 10.96 euros in K-supermarket Konala on Mon Oct 10 2022",
                            "4": "spent 5.27 euros in ALEPA MALMINKARTANO on Mon Oct 10 2022",
                            "on average": "spent 17.74 euros"
                        }
                    },
                    "health": {
                        "amount": 0,
                        "percentage": 0,
                        "transactions": {}
                    },
                    "houseAndFurniture": {
                        "amount": 1018.72,
                        "percentage": 38.81,
                        "transactions": {
                            "1": "spent 734.8 euros in Asunto Oy Kuparikartano on Wed Oct 05 2022",
                            "2": "spent 173 euros in TIKHOMIROV V TAI WEINER C on Wed Oct 05 2022",
                            "3": "spent 55.46 euros in Helen Oy on Wed Oct 05 2022",
                            "4": "spent 55.46 euros in Helen Oy on Wed Oct 05 2022",
                            "on average": "spent 254.68 euros"
                        }
                    },
                    "insurance": {
                        "amount": 0,
                        "percentage": 0,
                        "transactions": {}
                    },
                    "kids": {
                        "amount": 265.94,
                        "percentage": 10.13,
                        "transactions": {
                            "1": "spent 265.94 euros in Phoenix Partners Ky/LaughLearn on Mon Oct 31 2022",
                            "on average": "spent 265.94 euros"
                        }
                    },
                    "other": {
                        "amount": 13.97,
                        "percentage": 0.53,
                        "transactions": {
                            "1": "spent 6 euros in Espoon kaupunki on Mon Oct 10 2022",
                            "2": "spent 5.99 euros in Motonet Helsinki, Konala on Mon Oct 10 2022",
                            "3": "spent 0.99 euros in APPLE.COM/BILL on Mon Oct 10 2022",
                            "4": "spent 0.99 euros in APPLE.COM/BILL on Mon Oct 10 2022",
                            "on average": "spent 3.49 euros"
                        }
                    },
                    "sportEatFun": {
                        "amount": 10.1,
                        "percentage": 0.38,
                        "transactions": {
                            "1": "spent 10.1 euros in VFI*Rami's Coffee Oy on Mon Oct 10 2022",
                            "on average": "spent 10.1 euros"
                        }
                    },
                    "travel": {
                        "amount": 1189.68,
                        "percentage": 45.32,
                        "transactions": {
                            "1": "spent 1189.68 euros in FINNLINES OYJ on Mon Oct 10 2022",
                            "on average": "spent 1189.68 euros"
                        }
                    }
                },
                "month": "October 2022",
                "sum": "2624.98 euros"}
            ]
        });
    });

    it('should verify that the sum is correct for 1 month', async () => {
        const fileContent =
            "﻿Booking date;Amount;Sender;Recipient;Name;Title;Reference number;Currency\n" +
            // carAndTransport
            "2022/10/07;-50,00;FI57 1040 3500 4294 14;;;NESTE EXPRESS HEL MALMIN;;EUR\n" +
            "2022/10/07;-2,80;FI57 1040 3500 4294 14;;;HSL Mobiili;;EUR\n" +
            "2022/10/07;-2,80;FI57 1040 3500 4294 14;;;HSL Mobiili;;EUR\n" +
            // food
            "2022/10/11;-27,37;FI57 1040 3500 4294 14;;;ALEPA MALMINKARTANO;;EUR\n" +
            "2022/10/10;-5,27;FI57 1040 3500 4294 14;;;ALEPA MALMINKARTANO;;EUR\n" +
            "2022/10/10;-27,37;FI57 1040 3500 4294 14;;;ALEPA MALMINKARTANO;;EUR\n" +
            "2022/10/10;-10,96;FI57 1040 3500 4294 14;;;K-supermarket Konala;;EUR\n" +
            // houseAndFurniture
            "2022/10/05;-734,80;FI57 1040 3500 4294 14;;;Asunto Oy Kuparikartano;;EUR\n" +
            "2022/10/05;-173,00;FI57 1040 3500 4294 14;;;TIKHOMIROV V TAI WEINER C;;EUR\n" +
            "2022/10/05;-55,46;FI57 1040 3500 4294 14;;;Helen Oy;;EUR\n" +
            "2022/10/05;-55,46;FI57 1040 3500 4294 14;;;Helen Oy;;EUR\n" +
            // kids
            "2022/10/31;-265,94;FI57 1040 3500 4294 14;;;Phoenix Partners Ky/LaughLearn;;EUR\n" +
            // other
            "2022/10/10;-0,99;FI57 1040 3500 4294 14;;;APPLE.COM/BILL;;EUR\n" +
            "2022/10/10;-0,99;FI57 1040 3500 4294 14;;;APPLE.COM/BILL;;EUR\n" +
            "2022/10/10;-6,00;FI57 1040 3500 4294 14;;;Espoon kaupunki;;EUR\n" +
            "2022/10/10;-5,99;FI57 1040 3500 4294 14;;;Motonet Helsinki, Konala;;EUR\n" +
            // sportEatFun
            "2022/10/10;-10,10;FI57 1040 3500 4294 14;;;VFI*Rami's Coffee Oy;;EUR\n" +
            // travel
            "2022/10/10;-1189,68;FI57 1040 3500 4294 14;;;FINNLINES OYJ;;EUR";
        const transactions = await transactionAnalyzer.parseTransactionFiles(fileContent);
        // exercise
        const analyzeResult = transactionAnalyzer.analyze(transactions);
        // verify
        expect(analyzeResult).toBeDefined();
        expect(analyzeResult.monthlyExpenses.length).toEqual(1);
        const categories = analyzeResult.monthlyExpenses[0].categories;
        const foodAmount = categories.food.amount;
        const houseAndFurnitureAmount = categories.houseAndFurniture.amount;
        const carAndTransportAmount = categories.carAndTransport.amount;
        const kidsAmount = categories.kids.amount;
        const travelAmount = categories.travel.amount;
        const sportEatFunAmount = categories.sportEatFun.amount;
        const otherAmount = categories.other.amount;

        const sum = foodAmount + houseAndFurnitureAmount + carAndTransportAmount + kidsAmount + travelAmount
            + sportEatFunAmount + otherAmount;
        expect(analyzeResult.monthlyExpenses[0].sum).toEqual(Math.round(sum * 100) / 100 + " euros");

        const foodPercentage = categories.food.percentage;
        const houseAndFurniturePercentage = categories.houseAndFurniture.percentage;
        const carAndTransportPercentage = categories.carAndTransport.percentage;
        const kidsPercentage = categories.kids.percentage;
        const travelPercentage = categories.travel.percentage;
        const sportEatFunPercentage = categories.sportEatFun.percentage;
        const otherPercentage = categories.other.percentage;
        expect(100).toEqual(Math.round(((foodPercentage + houseAndFurniturePercentage + carAndTransportPercentage
            + kidsPercentage + travelPercentage + sportEatFunPercentage + otherPercentage) * 100) / 100)
        );
    });

    it('should verify transformation from cents to float euros', function () {
        const centsToFloatEuros = transactionAnalyzer.centsToFloatEuros(2345);
        expect(centsToFloatEuros).toEqual(23.45);
    });
});
