// const axios = require('axios');
// const XLSX = require('xlsx');
import axios from 'axios';
import {read,utils} from "xlsx"

export class GoogleSheetsService {
    #url = 'https://docs.google.com/spreadsheets/d/';
    #requiredFields = [];
    #principalColumnName = "";
    #sheet_id = "";
    #worksheet = ""


    constructor() {

        this._leads = [];
        this._checksumfilter = [];
        this._checksumfiltered = 0;
        this._df = [];

    }

    // getter setters

    get requiredFields() {
        return this.#requiredFields; 
    }

    get principalColumn() {
        return this.#principalColumnName;
    }

    get worksheet() {
        return this.#worksheet;
    }
    get sheet_id() {
        return this.#sheet_id;
    }

    set requiredFields(fields) {
        this.#requiredFields = fields
    }

    set principalColumn(coloumn_name) { 
        this.#principalColumnName = coloumn_name 
    }

    set sheet_id(sheet_id) {
        this.#sheet_id = sheet_id;
    }

    set worksheet(worksheet) {
        this.#worksheet = worksheet
    }
    //------------------------------

    async loadSheets() {
        try {
            //console.log("getting data ...\n");

            const url = `${this.#url}${this.#sheet_id}/export?format=xlsx`;

            // Fetch the file
            const response = await axios.get(url, {
                responseType: 'arraybuffer'
            });

            // Read Excel file
            const workbook = read(response.data, { type: 'buffer' });

            // Get specific worksheet
            if (this.#requiredFields.length === 0)
            {
                const sheetName = workbook.SheetNames[this.#worksheet] || this.#worksheet;
                const worksheet = workbook.Sheets[sheetName];
                this._df = this.#single_sheets(worksheet)
            }
            else{
                this._df = await this.#multiple_sheets(workbook)
            }
            
        } catch (error) {
            console.error("Error loading sheets:", error.message);
            return [];
        }
        
        return this._df ;

    }

    #multiple_sheets(workbook) {
        
        console.log(`Loaded sheet ${this.#sheet_id}`)
        var allData = []
            // Loop through ALL sheets
        workbook.SheetNames.forEach(sheetName => {

            const worksheet = workbook.Sheets[sheetName];

            // why use me if the worksheet is not valid? why bro
            if (!worksheet) 
            {
                console.log("not proper worksheet")
                return;
            }

            // Convert sheet → JSON
            let data = utils.sheet_to_json(worksheet, { defval: "" });
            if (!data.length)
            {
                console.log("No proper data in worksheet")
                return;
            }

            // Get columns from first row
            const columns = Object.keys(data[0]);

            // Check if sheet contains ALL required fields
            const requiredFields = this.#requiredFields;
            const isValidSheet = requiredFields.every(field => columns.includes(field));

            // check out from life if sheet is not valid
            if (!isValidSheet) {
                return;
            }
            
            // use coloum to check if the row is valid principalColumnName 
            const principalColumnName = [this.#principalColumnName];
            const filtered  = data.filter(row => 
                principalColumnName.every(field => row[field] !== "")
            );

            const cleaned = filtered.map(row => ({
                URL: `https://docs.google.com/spreadsheets/d/${this.#sheet_id}`,
                SheetName: sheetName,
                Index: row['Index'],
                Name: row['Name'],
                Numbers: row['Numbers'],
                Status: row['Status'],
                'Apt Date': row['Apt Date'],
                Time: row['Time'],
                Location: row['Location']

            }));

            // add to array
            allData.push(...cleaned);
        });

        return allData;
    }

    #single_sheets(worksheet) {
            // Convert to JSON
            let data = utils.sheet_to_json(worksheet, { defval: "" });

            // use coloum to check if the row is valid principalColumnName 
            const principalColumnName = [this.#principalColumnName];
            const filtered  = data.filter(row => 
                principalColumnName.every(field => row[field] !== "")
            );

            return filtered.map(row =>({
               
                URL: `https://docs.google.com/spreadsheets/d/${this.#sheet_id}`,
                SheetName: worksheet,
                Index: row['Index'],
                Name: row['Name'],
                Numbers: row['Numbers'],
                Status: row['Status'],
                'Apt Date': row['Apt Date'],
                Time: row['Time'],
                Location: row['Location']

            }));
    }
}
