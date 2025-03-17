import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { spreadsheetService } from '../../services/spreadsheetService';
import { deckService } from '../../services/deckService';
import { useAuth } from '../../contexts/AuthContext';

export default function SpreadsheetImport() {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [columnHeaders, setColumnHeaders] = useState([]);
    const [data, setData] = useState([]);
    const [columnMapping, setColumnMapping] = useState({
        front: '',
        back: ''
    });
    const [decks, setDecks] = useState([]);
    const [selectedDeckId, setSelectedDeckId] = useState('');
    const [importResult, setImportResult] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Load available decks
    useEffect(() => {
        const loadDecks = async () => {
            try {
                const decksData = await deckService.getDecks();
                setDecks(decksData);
                if (decksData.length > 0) {
                    setSelectedDeckId(decksData[0].id);
                }
            } catch (err) {
                console.error('Error loading decks:', err);
                setError('Failed to load decks. Please try again.');
            }
        };

        loadDecks();
    }, []);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
            setError('Please upload a CSV or Excel file');
            return;
        }

        setIsLoading(true);
        setError(null);
        setFile(selectedFile);
        setFileName(selectedFile.name);

        try {
            // Get column headers
            const headers = await spreadsheetService.getColumnHeaders(selectedFile);
            setColumnHeaders(headers);

            // Get data preview
            const parsedData = await spreadsheetService.parseSpreadsheet(selectedFile);
            setData(parsedData.slice(0, 5)); // Show first 5 rows for preview

            // Auto-detect column mappings if possible
            const mapping = {
                front: '',
                back: ''
            };

            headers.forEach(header => {
                const headerLower = header.toLowerCase();
                if (['front', 'question', 'prompt'].some(term => headerLower.includes(term))) {
                    mapping.front = header;
                } else if (['back', 'answer', 'response'].some(term => headerLower.includes(term))) {
                    mapping.back = header;
                }
            });

            setColumnMapping(mapping);
        } catch (err) {
            console.error('Error parsing file:', err);
            setError(`Failed to parse file: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleColumnMappingChange = (field, columnName) => {
        setColumnMapping({
            ...columnMapping,
            [field]: columnName
        });
    };

    const handleImport = async () => {
        if (!file || !selectedDeckId || !columnMapping.front || !columnMapping.back) {
            setError('Please select a file, deck, and map both front and back columns');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Parse the full file
            const allRows = await spreadsheetService.parseSpreadsheet(file);

            // Import cards
            const result = await spreadsheetService.importCards(
                allRows,
                columnMapping,
                selectedDeckId,
                user
            );

            setImportResult(result);
            setIsPreviewMode(false);
        } catch (err) {
            console.error('Error importing cards:', err);
            setError(`Failed to import cards: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setFileName('');
        setColumnHeaders([]);
        setData([]);
        setColumnMapping({
            front: '',
            back: ''
        });
        setImportResult(null);
        setIsPreviewMode(true);
        setError(null);
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Import Cards from Spreadsheet</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {isPreviewMode ? (
                <>
                    {!file && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Spreadsheet (CSV or Excel)
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                        >
                                            <span>Upload a file</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                accept=".csv,.xlsx,.xls"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">CSV, Excel files up to 10MB</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {file && (
                        <>
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-medium text-gray-900">File uploaded: {fileName}</h2>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="text-sm text-blue-600 hover:text-blue-500"
                                    >
                                        Upload a different file
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Deck
                                </label>
                                <select
                                    value={selectedDeckId}
                                    onChange={(e) => setSelectedDeckId(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    {decks.map((deck) => (
                                        <option key={deck.id} value={deck.id}>
                                            {deck.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Map Spreadsheet Columns</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Front Side Content
                                        </label>
                                        <select
                                            value={columnMapping.front}
                                            onChange={(e) => handleColumnMappingChange('front', e.target.value)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        >
                                            <option value="">Select column</option>
                                            {columnHeaders.map((header, index) => (
                                                <option key={index} value={header}>
                                                    {header}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Back Side Content
                                        </label>
                                        <select
                                            value={columnMapping.back}
                                            onChange={(e) => handleColumnMappingChange('back', e.target.value)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        >
                                            <option value="">Select column</option>
                                            {columnHeaders.map((header, index) => (
                                                <option key={index} value={header}>
                                                    {header}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {data.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4">Data Preview</h2>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {columnHeaders.map((header, index) => (
                                                        <th
                                                            key={index}
                                                            scope="col"
                                                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === columnMapping.front
                                                                    ? 'bg-blue-50'
                                                                    : header === columnMapping.back
                                                                        ? 'bg-green-50'
                                                                        : ''
                                                                }`}
                                                        >
                                                            {header}
                                                            {header === columnMapping.front && (
                                                                <span className="ml-2 text-blue-500">(Front)</span>
                                                            )}
                                                            {header === columnMapping.back && (
                                                                <span className="ml-2 text-green-500">(Back)</span>
                                                            )}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {data.map((row, rowIndex) => (
                                                    <tr key={rowIndex}>
                                                        {columnHeaders.map((header, colIndex) => (
                                                            <td
                                                                key={`${rowIndex}-${colIndex}`}
                                                                className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${header === columnMapping.front
                                                                        ? 'bg-blue-50'
                                                                        : header === columnMapping.back
                                                                            ? 'bg-green-50'
                                                                            : ''
                                                                    }`}
                                                            >
                                                                {row[header] || '-'}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Showing first {data.length} rows of the spreadsheet
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/decks')}
                                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleImport}
                                    disabled={isLoading || !columnMapping.front || !columnMapping.back || !selectedDeckId}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {isLoading ? 'Importing...' : 'Import Cards'}
                                </button>
                            </div>
                        </>
                    )}
                </>
            ) : (
                // Import results view
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Import Results</h3>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Total rows</dt>
                                <dd className="mt-1 text-sm text-gray-900">{importResult?.totalRows || 0}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Successfully imported</dt>
                                <dd className="mt-1 text-sm text-green-600 font-semibold">{importResult?.successCount || 0}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Failed rows</dt>
                                <dd className="mt-1 text-sm text-red-600 font-semibold">{importResult?.failedCount || 0}</dd>
                            </div>
                        </dl>

                        {importResult && importResult.failures.length > 0 && (
                            <div className="mt-8">
                                <h4 className="text-md font-medium text-gray-900 mb-2">Failed Rows</h4>
                                <div className="overflow-x-auto border rounded-md">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Row
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Front Content
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Back Content
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Reason
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {importResult.failures.map((failure, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {failure.row[columnMapping.front] || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {failure.row[columnMapping.back] || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                                                        {failure.reason}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => navigate(`/decks/${selectedDeckId}`)}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Go to Deck
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Import Another File
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
