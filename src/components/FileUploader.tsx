import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileLoad: (data: string) => void;
  loading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoad, loading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      setError('File size too large. Please select a file smaller than 100MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      onFileLoad(csvData);
    };
    
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
  }, [onFileLoad]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const loadDefaultFile = useCallback(() => {
    // Load the jobs.csv file from the public directory
    fetch('/jobs.csv')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load default data file');
        }
        return response.text();
      })
      .then(csvData => {
        onFileLoad(csvData);
      })
      .catch(err => {
        setError('Could not load default data file. Please upload your own CSV file.');
        console.error('Error loading default file:', err);
      });
  }, [onFileLoad]);

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="loading-spinner mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Data</h3>
        <p className="text-gray-600">This may take a moment for large files...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive 
            ? 'border-un-blue bg-blue-50' 
            : error 
            ? 'border-red-300 bg-red-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={loading}
        />
        
        <div className="space-y-4">
          {error ? (
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          ) : (
            <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-un-blue' : 'text-gray-400'}`} />
          )}
          
          <div>
            <h3 className={`text-lg font-medium ${error ? 'text-red-900' : 'text-gray-900'}`}>
              {error ? 'Upload Error' : 'Upload UN Jobs Data'}
            </h3>
            <p className={`text-sm mt-1 ${error ? 'text-red-600' : 'text-gray-600'}`}>
              {error || 'Drag and drop your CSV file here, or click to select'}
            </p>
          </div>
          
          {!error && (
            <div className="text-xs text-gray-500">
              <FileText className="inline h-4 w-4 mr-1" />
              Supports CSV files up to 100MB
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-center">
          <button
            onClick={() => setError(null)}
            className="btn-secondary text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="text-center border-t pt-4">
        <p className="text-sm text-gray-600 mb-3">
          Don't have a CSV file? Use our sample data to explore the dashboard.
        </p>
        <button
          onClick={loadDefaultFile}
          className="btn-primary"
          disabled={loading}
        >
          Load Sample UN Jobs Data
        </button>
      </div>
    </div>
  );
};

export default FileUploader; 