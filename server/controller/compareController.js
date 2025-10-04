const csv = require('csv-parser');
const { Readable } = require('stream');

// Helper function to parse a CSV buffer into an array of objects
const parseCsv = (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(buffer.toString());
        stream
            .pipe(csv({
                skipComments: true,
                skipEmptyLines: true,
                mapHeaders: ({ header }) => header.trim(),
                mapValues: ({ value }) => value.trim()
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

exports.compareFiles = async (req, res) => {
    try {
        // 1. Check if files were uploaded
        if (!req.files || !req.files.file1 || !req.files.file2) {
            return res.status(400).json({ message: 'Please upload both files with field names "file1" and "file2".' });
        }

        const file1Buffer = req.files.file1[0].buffer;
        const file2Buffer = req.files.file2[0].buffer;

        // 2. Parse both CSV files concurrently
        const [data1, data2] = await Promise.all([
            parseCsv(file1Buffer),
            parseCsv(file2Buffer),
        ]);

        if (data1.length === 0 || data2.length === 0) {
            return res.status(400).json({ message: 'One or both CSV files are empty.' });
        }

        // 3. Find a common primary key to join the files (e.g., 'id', 'toi', 'kic')
        const headers1 = Object.keys(data1[0]);
        const headers2 = Object.keys(data2[0]);
        const commonIdKeys = ['id', 'ID', 'toi', 'TOI', 'tid', 'TID', 'kic', 'KIC'];
        const primaryKey = commonIdKeys.find(key => headers1.includes(key) && headers2.includes(key));

        if (!primaryKey) {
            return res.status(400).json({ message: 'No common identifier (ID, TOI, KIC, etc.) found in the files for comparison.' });
        }
        
        // 4. Create a map of file 2 for quick lookup
        const data2Map = new Map();
        data2.forEach(row => {
            if (row[primaryKey]) {
                data2Map.set(row[primaryKey], row);
            }
        });
        
        const commonHeaders = headers1.filter(header => headers2.includes(header) && header !== primaryKey);

        const summary = {
            totalItemsFile1: data1.length,
            totalItemsFile2: data2.length,
            totalMatches: 0,
            matchingPercentage: 0,
            commonHeaders: commonHeaders,
            matchingRows: [],
            unmatchedRows: []
        };

        const unmatchedKeys = new Set();
        
        // 5. Compare rows based on the primary key
        data1.forEach(row1 => {
            const key = row1[primaryKey];
            const row2 = data2Map.get(key);
            
            if (row2) {
                // If a matching row is found, compare the common fields
                const rowComparison = {
                    id: key,
                    file1: row1,
                    file2: row2,
                    matches: {},
                    mismatches: {},
                    numMatches: 0,
                    numMismatches: 0
                };
                
                commonHeaders.forEach(header => {
                    const value1 = String(row1[header] || '').trim();
                    const value2 = String(row2[header] || '').trim();
                    
                    if (value1 === value2) {
                        rowComparison.matches[header] = value1;
                        rowComparison.numMatches++;
                    } else if (value1 !== '' && value2 !== '') {
                        rowComparison.mismatches[header] = { file1: value1, file2: value2 };
                        rowComparison.numMismatches++;
                    }
                });
                
                // We consider a row a "match" if the ID exists in both files
                summary.totalMatches++;
                summary.matchingRows.push(rowComparison);

            } else {
                // No match found for this key
                unmatchedKeys.add(key);
            }
        });

        summary.unmatchedRows = Array.from(unmatchedKeys);
        
        // 6. Calculate the final matching percentage
        const totalRowsCompared = data1.length;
        if (totalRowsCompared > 0) {
            summary.matchingPercentage = ((summary.totalMatches / totalRowsCompared) * 100).toFixed(2);
        }
        
        // Final sanity check and data cleanup for response
        delete summary.unmatchedKeys;
        
        res.status(200).json({
            success: true,
            message: 'File comparison complete.',
            summary: summary
        });

    } catch (error) {
        console.error('Error during file comparison:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during file processing.',
            error: error.message 
        });
    }
};