const csv = require('csv-parser');
const { Readable } = require('stream');

// Helper function to parse a CSV buffer into an array of objects
const parseCsv = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

exports.compareFiles = async (req, res) => {
  try {
    // 1. Check if files were uploaded
    if (!req.files || !req.files.file1 || !req.files.file2) {
      return res.status(400).json({ message: 'Please upload both files.' });
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

    // 3. Find common headers (fields)
    const headers1 = Object.keys(data1[0]);
    const headers2 = Object.keys(data2[0]);
    const commonHeaders = headers1.filter(header => headers2.includes(header));

    if (commonHeaders.length === 0) {
      return res.status(400).json({ message: 'No common columns found between the files.' });
    }

    let totalUniqueItemsFile1 = 0;
    let totalMatches = 0;
    const matchedRows = [];
    const addedRowIndices = new Set(); // Use a Set to prevent duplicate rows in the output

    // 4. Compare data for each common header
    commonHeaders.forEach(header => {
      // Get unique values for the current header from each file
      const uniqueValues1 = new Set(data1.map(row => row[header]?.trim()).filter(Boolean));
      const uniqueValues2 = new Set(data2.map(row => row[header]?.trim()).filter(Boolean));
      
      totalUniqueItemsFile1 += uniqueValues1.size;

      // Count how many items from file 1 are present in file 2
      uniqueValues1.forEach(value => {
        if (uniqueValues2.has(value)) {
          totalMatches++;
        }
      });

      // Find and collect the actual rows from file 1 that contain matching data
      data1.forEach((row, index) => {
          const valueFromFile1 = row[header]?.trim();
          // If the value exists in file 2 and we haven't already added this row
          if (valueFromFile1 && uniqueValues2.has(valueFromFile1) && !addedRowIndices.has(index)) {
              matchedRows.push(row);
              addedRowIndices.add(index);
          }
      });
    });

    // 5. Calculate the final matching percentage
    const percentage = totalUniqueItemsFile1 > 0 ? (totalMatches / totalUniqueItemsFile1) * 100 : 0;

    // 6. Send the response including the matched data
    res.status(200).json({
      message: 'Comparison successful!',
      percentage: parseFloat(percentage.toFixed(2)),
      commonHeaders: commonHeaders,
      totalMatches: totalMatches,
      totalUniqueInFile1: totalUniqueItemsFile1,
      matchedData: matchedRows, // This is the new data being sent
    });

  } catch (error) {
    console.error('Error during file comparison:', error);
    res.status(500).json({ message: 'Server error during file processing.' });
  }
};