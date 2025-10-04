import React, { useState } from 'react';
import axios from 'axios';

/**
 * A component for uploading, comparing, and downloading matched data from two CSV files.
 */
function Matching() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [result, setResult] = useState(null);
  const [matchedData, setMatchedData] = useState([]); // State to hold matched rows
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setResult(null);
    setMatchedData([]);
    setError('');
  };

  const handleFile1Change = (e) => {
    setFile1(e.target.files[0]);
    resetState();
  };

  const handleFile2Change = (e) => {
    setFile2(e.target.files[0]);
    resetState();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file1 || !file2) {
      setError('Please select both CSV files.');
      return;
    }

    setLoading(true);
    resetState();

    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);

    try {
      const response = await axios.post('http://localhost:5001/api/compare', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
      setMatchedData(response.data.matchedData || []); // Store the matched data
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Converts an array of objects to a CSV string and triggers a download.
   */
  const handleDownload = () => {
    if (matchedData.length === 0) {
      setError('No matching data to download.');
      return;
    }

    // Get headers from the first object in the array
    const headers = Object.keys(matchedData[0]);
    
    // Convert data array to a CSV string
    const csvContent = [
      headers.join(','), // Header row
      ...matchedData.map(row =>
        headers.map(header => {
          let cell = row[header] === null || row[header] === undefined ? '' : row[header];
          cell = String(cell);
          // Escape quotes and wrap cell in quotes if it contains a comma, quote, or newline
          if (cell.includes('"') || cell.includes(',') || cell.includes('\n')) {
            cell = "${cell.replace(/"/g, '""')}";
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    // Create a Blob to download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'matched_data.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <h1>📊 CSV Data Matcher</h1>
      <p>Upload two CSV files to find the percentage of matching data in common columns.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="file-input-container">
          <div className="file-input">
            <label htmlFor="file1">Select First CSV File</label>
            <input id="file1" type="file" accept=".csv" onChange={handleFile1Change} />
            {file1 && <p className="file-name">Selected: {file1.name}</p>}
          </div>
          <div className="file-input">
            <label htmlFor="file2">Select Second CSV File</label>
            <input id="file2" type="file" accept=".csv" onChange={handleFile2Change} />
            {file2 && <p className="file-name">Selected: {file2.name}</p>}
          </div>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Comparing...' : 'Compare Files'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      
      {result && (
        <div className="result-card">
          <h2>Comparison Result</h2>
          <div className="percentage-display">
            {result.percentage}<span>%</span>
          </div>
          <p><strong>Data Match Percentage</strong></p>
          <div className="result-details">
            <p><strong>Common Columns Compared:</strong> {result.commonHeaders.join(', ')}</p>
            <p><strong>Total Unique Items in File 1:</strong> {result.totalUniqueInFile1}</p>
            <p><strong>Matching Items Found:</strong> {result.totalMatches}</p>
          </div>
          
          {/* Download button - only shows if there's data to download */}
          {matchedData.length > 0 && (
            <div className="download-container">
              <button onClick={handleDownload} className="download-button">
                Download Matched Data (.csv)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Matching;