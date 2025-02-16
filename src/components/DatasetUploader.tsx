import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { medicalModel } from '../utils/mlModel';
import { DataProcessor } from '../utils/DataProcessor';
import { isSupabaseConfigured } from '../utils/supabase';

export function DatasetUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isSupabaseConfigured) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Database Connection Required</h2>
          <p className="text-gray-600 mb-4">
            Please click the "Connect to Supabase" button in the top right corner to set up your database connection.
          </p>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setStatusMessage('');

    try {
      const text = await file.text();
      const cleanText = text.replace(/^\uFEFF/, ''); // Remove BOM if present
      
      // Process the CSV data
      const diseases = DataProcessor.processCSVData(cleanText);
      
      if (diseases.length === 0) {
        throw new Error('No valid records found in file');
      }

      // Update the model with the new dataset
      await medicalModel.updateDataset(diseases);
      
      setUploadStatus('success');
      setStatusMessage(`Dataset uploaded successfully! Processed ${diseases.length} records. The model has been retrained with the new data.`);
    } catch (error) {
      setUploadStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to upload dataset');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await medicalModel.refreshModel();
      setStatusMessage('Model successfully refreshed with latest data');
      setUploadStatus('success');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to refresh model');
      setUploadStatus('error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Upload Medical Dataset</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Model'}
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="dataset-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="dataset-upload"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600">
              {isUploading ? 'Uploading...' : 'Click to upload medical dataset'}
            </span>
            <div className="text-xs text-gray-500">
              <p>Supported format: CSV with headers</p>
              <p>Required columns: Disease, Fever, Cough, Fatigue, Difficulty Breathing, Age, Gender, Blood Pressure, Cholesterol Level, Outcome Variable</p>
            </div>
          </label>
        </div>

        {uploadStatus !== 'idle' && (
          <div className={`p-4 rounded-lg flex items-center space-x-2 ${
            uploadStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {uploadStatus === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}