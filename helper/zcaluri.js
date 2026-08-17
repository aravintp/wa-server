import { send_log } from "./global.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class ZoomOutgoingCalls {
    #defaultCallerId;
    #defaultCountryCode;

    constructor({
        defaultCallerId = "",
        defaultCountryCode = "+65"
    } = {}) {
        this.#defaultCallerId = defaultCallerId;
        this.#defaultCountryCode = defaultCountryCode;
    }

    normalizePhoneNumber(phoneNumber) {
        if (!phoneNumber) {
            throw new Error("phoneNumber is required");
        }

        let cleaned = String(phoneNumber)
            .trim()
            .replace(/[^\d+]/g, "");

        // Singapore handling: 8-digit local number becomes +65XXXXXXXX
        if (!cleaned.startsWith("+") && cleaned.length === 8) {
            cleaned = `${this.#defaultCountryCode}${cleaned}`;
        }

        // Generic fallback: if no +, add default country code
        if (!cleaned.startsWith("+")) {
            cleaned = `${this.#defaultCountryCode}${cleaned}`;
        }

        if (!/^\+\d{8,15}$/.test(cleaned)) {
            throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }

        return cleaned;
    }

    normalizeCallerId(callerId) {
        if (!callerId) return "";

        const cleaned = String(callerId)
            .trim()
            .replace(/[^\d+]/g, "");

        // Zoom callerid can be extension or E.164 number.
        // So allow pure digits or +number.
        if (!/^(\+\d{8,15}|\d{3,10})$/.test(cleaned)) {
            throw new Error(`Invalid caller ID format: ${callerId}`);
        }

        return cleaned;
    }

    buildZoomPhoneUri({
        phoneNumber,
        callerId = this.#defaultCallerId,
        extraParams = {}
    }) {
        const toNumber = this.normalizePhoneNumber(phoneNumber);
        const fromCallerId = this.normalizeCallerId(callerId);

        const params = new URLSearchParams();

        if (fromCallerId) {
            params.set("callerid", fromCallerId);
        }

        // Optional metadata params.
        // Example: project=mediway, lead_id=abc123
        Object.entries(extraParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                params.set(key, String(value));
            }
        });

        const queryString = params.toString();

        return queryString
            ? `zoomphonecall://${toNumber}?${queryString}`
            : `zoomphonecall://${toNumber}`;
    }

    buildTelUri(phoneNumber) {
        const toNumber = this.normalizePhoneNumber(phoneNumber);
        return `tel:${toNumber}`;
    }

    buildCalltoUri(phoneNumber) {
        const toNumber = this.normalizePhoneNumber(phoneNumber);
        return `callto:${toNumber}`;
    }

    async call({
        phoneNumber,
        callerId = this.#defaultCallerId,
        project = "",
        leadId = "",
        launchClient = false
    }) {
        try {
            const uri = this.buildZoomPhoneUri({
                phoneNumber,
                callerId,
                extraParams: {
                    project,
                    lead_id: leadId
                }
            });

            send_log({
                type: "debug",
                msg: `Generated Zoom outgoing call URI for ${phoneNumber}`
            });

            if (launchClient) {
                await this.openUri(uri);

                send_log({
                    type: "success",
                    msg: `Zoom client launched for outgoing call to ${phoneNumber}`
                });
            }

            return {
                success: true,
                launched: launchClient,
                uri
            };
        } catch (error) {
            send_log({
                type: "error",
                msg: `Failed to create outgoing Zoom call: ${error.message}`
            });

            throw error;
        }
    }

    async openUri(uri) {
        const platform = process.platform;

        if (platform === "darwin") {
            await execFileAsync("open", [uri]);
            return;
        }

        if (platform === "win32") {
            await execFileAsync("rundll32", [
                "url.dll,FileProtocolHandler",
                uri
            ]);
            return;
        }

        await execFileAsync("xdg-open", [uri]);
    }
}

//**

// import { ZoomOutgoingCalls } from "./ZoomOutgoingCalls.js";

// const zoomCaller = new ZoomOutgoingCalls({
//     defaultCallerId: "+6561234567",
//     defaultCountryCode: "+65"
// });

// // Best for backend / n8n / web dashboard:
// // generate the call link, then show it to the agent.
// const result = await zoomCaller.call({
//     phoneNumber: "91234567",
//     project: "mediway",
//     leadId: "LEAD-001",
//     launchClient: false
// });

// console.log(result.uri);
// zoomphonecall://+6591234567?callerid=%2B6561234567&project=mediway&lead_id=LEAD-001


// Local machine usage

// Only use this if the code runs on the agent’s own computer with Zoom installed and logged in:
// await zoomCaller.call({
//     phoneNumber: "91234567",
//     project: "algomax",
//     leadId: "LEAD-002",
//     launchClient: true
// });
//  */