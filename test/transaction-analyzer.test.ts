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
        // expect(transactions.length).toBe(16);

        const analyzeResult = transactionAnalyzer.analyze(transactions);
        expect(analyzeResult).toEqual([{
            "diagram": {
                "carAndTransport": "55 euros (2%)",
                "food": {
                    "amount": "70",
                    "percentage": 2,
                    "topTransactions": {
                        "1": "spent 27 euros in ALEPA MALMINKARTANO on Tue Oct 11 2022",
                        "2": "spent 5 euros in ALEPA MALMINKARTANO on Mon Oct 10 2022",
                        "3": "spent 27 euros in ALEPA MALMINKARTANO on Mon Oct 10 2022",
                        "4": "spent 10 euros in K-supermarket Konala on Mon Oct 10 2022"
                    }
                },
                "houseAndFurniture": {
                    "amount": "1018",
                    "percentage": 38,
                    "topTransactions": {
                        "1": "spent 734 euros in Asunto Oy Kuparikartano on Wed Oct 05 2022",
                        "2": "spent 173 euros in TIKHOMIROV V TAI WEINER C on Wed Oct 05 2022",
                        "3": "spent 55 euros in Helen Oy on Wed Oct 05 2022",
                        "4": "spent 55 euros in Helen Oy on Wed Oct 05 2022"
                    }
                },
                "kids": "265 euros (10%)",
                "other": {
                    "amount": "13",
                    "percentage": 0,
                    "topTransactions": {
                        "1": "spent  euros in APPLE.COM/BILL on Mon Oct 10 2022",
                        "2": "spent  euros in APPLE.COM/BILL on Mon Oct 10 2022",
                        "3": "spent 6 euros in Espoon kaupunki on Mon Oct 10 2022",
                        "4": "spent 5 euros in Motonet Helsinki, Konala on Mon Oct 10 2022"
                    }
                },
                "sportEatFun": "10 euros (0%)",
                "sum": "2624 euros",
                "travel": "1189 euros (45%)"
            },
            "month": "October 2022"
        }]);
    });
});
