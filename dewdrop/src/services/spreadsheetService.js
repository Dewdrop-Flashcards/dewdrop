import * as XLSX from 'xlsx';
import { cardService } from './cardService';

export const spreadsheetService = {
    /**
     * Parse a spreadsheet file (CSV or XLSX) and return an array of row objects
     * @param {File} file - The file object to parse
     * @returns {Promise<Array>} Array of row objects with column headers as keys
     */
    parseSpreadsheet: async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get the first worksheet
                    const worksheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[worksheetName];

                    // Convert to JSON with headers
                    const rows = XLSX.utils.sheet_to_json(worksheet);
                    resolve(rows);
                } catch (error) {
                    reject(new Error(`Failed to parse spreadsheet: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Get column headers from a spreadsheet file
     * @param {File} file - The file object to parse
     * @returns {Promise<Array>} Array of column headers
     */
    getColumnHeaders: async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get the first worksheet
                    const worksheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[worksheetName];

                    // Convert to JSON with headers
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    // First row contains headers
                    if (rows.length > 0) {
                        resolve(rows[0]);
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse spreadsheet headers: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Import cards from parsed spreadsheet data
     * @param {Array} rows - Array of row objects
     * @param {Object} columnMapping - Mapping of card fields to spreadsheet columns (e.g., { front: 'Question', back: 'Answer' })
     * @param {string} deckId - ID of the deck to import cards into
     * @param {Object} user - Current user object
     * @returns {Promise<Object>} Result object with counts of success/failure
     */
    importCards: async (rows, columnMapping, deckId, user) => {
        const result = {
            totalRows: rows.length,
            successCount: 0,
            failedCount: 0,
            failures: []
        };

        for (const row of rows) {
            try {
                // Extract front and back content using column mapping
                const frontContent = row[columnMapping.front];
                const backContent = row[columnMapping.back];

                // Skip rows that are missing required content
                if (!frontContent || !backContent) {
                    result.failedCount++;
                    result.failures.push({
                        row,
                        reason: 'Missing front or back content'
                    });
                    continue;
                }

                // Create card
                await cardService.createCard({
                    front_content: frontContent,
                    back_content: backContent,
                    deck_id: deckId,
                    user_id: user.id
                });

                result.successCount++;
            } catch (error) {
                result.failedCount++;
                result.failures.push({
                    row,
                    reason: error.message
                });
            }
        }

        return result;
    }
};
