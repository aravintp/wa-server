import { PhoneS2SAuthClient } from "@zoom/rivet/phone";

export class ZoomPhoneLogs {
    #phoneClient;

    constructor({
        clientId,
        clientSecret,
        webhooksSecretToken,
        accountId
    }) {
        this.#phoneClient = new PhoneS2SAuthClient({
            clientId,
            clientSecret,
            webhooksSecretToken,
            accountId
        });
    }

    async getLogs(monthsBack = 6) {
        console.log("------------- Connecting to Zoom Phone Api ----------------");

        let allData = [];
        const today = new Date();
        const chunkSize = 2;

        for (let i = 0; i < monthsBack; i += chunkSize) {
            const promises = [];

            for (let j = i; j < i + chunkSize && j < monthsBack; j++) {
                const fromDate = new Date(today.getFullYear(), today.getMonth() - j, 1);
                const toDate = new Date(today.getFullYear(), today.getMonth() - j + 1, 0);

                toDate.setHours(23, 59, 59, 999);
                const fromISO = fromDate.toISOString().split("T")[0];
                const toISO = toDate.toISOString().split("T")[0];

                promises.push(this.queryZoom(fromISO, toISO));
            }

            const results = await Promise.all(promises);
            allData.push(...results.flat());
        }

        console.log(`Total records: ${allData.length}`);
        console.log("------------- Completed Zoom Phone Api ----------------");
        return allData;
    }

    async queryZoom(fromISO,toISO){
            console.log(`Fetching: ${fromISO} → ${toISO}`);

            let nextPageToken = "";
            let monthData = [];
            do {
                // console.log(
                //     nextPageToken === ""
                //         ? "Getting first page"
                //         : `Next page token: ${nextPageToken}`
                // );

                const response = await this.#phoneClient
                    .endpoints
                    .callLogs
                    .getAccountsCallHistory({
                        query: {
                            from: fromISO,
                            to: toISO,
                            page_size: 300,
                            next_page_token: nextPageToken
                        }
                    });

                nextPageToken = response.data.next_page_token || "";
                monthData = monthData.concat(response.data.call_logs);

            } while (nextPageToken !== "");

            //console.log(`Month collected: ${monthData.length} records`);
            return monthData;

    }
    async getLogsToday() {
    console.log("------------- Fetching Today's Zoom Phone Logs ----------------");

    const today = new Date();
    const todayISO = today.toISOString().split("T")[0];

    let allData = [];
    let nextPageToken = "";

    do {
        console.log(
            nextPageToken === ""
                ? "Getting first page"
                : `Next page token: ${nextPageToken}`
        );

        const response = await this.#phoneClient
            .endpoints
            .callLogs
            .getAccountsCallHistory({
                query: {
                    from: todayISO,
                    to: todayISO,
                    page_size: 300,
                    next_page_token: nextPageToken
                }
            });

        nextPageToken = response.data.next_page_token || "";
        allData = allData.concat(response.data.call_logs);

    } while (nextPageToken !== "");

    console.log(`Today's total records: ${allData.length}`);

    return allData.reverse();
    }
}