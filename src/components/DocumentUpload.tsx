import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, X, AlertCircle, FileText } from 'lucide-react';
import { Button } from './Button';
import { handleDocumentUpload } from '../lib/document-upload';
import * as Progress from '@radix-ui/react-progress';

interface DocumentUploadProps {
  clientName?: string;
  clientId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DocumentUpload({ clientName, clientId, onSuccess, onCancel }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    // Get the first file
    const file = acceptedFiles[0];
    
    // Validate file type
    if (!file.type.match('application/pdf')) {
      setError('Please upload a PDF file only');
      return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);
      
      const result = await handleDocumentUpload(
        file,
        !clientId, // isClientsPage is true when no clientId is provided
        clientId,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      // Wait a moment to show 100% progress before closing
      setTimeout(() => {
        onSuccess();
      }, 500);
      
    } catch (err: any) {
      setError(err.message || 'Failed to upload document. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Upload Referral Document</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
          disabled={uploading}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {clientName && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Client Name</label>
          <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200">
            {clientName}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${error ? 'border-red-300 bg-red-50' : ''}
              ${file ? 'border-green-300 bg-green-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {file ? (
              <div className="flex items-center justify-center space-x-3">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div>
                <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900">
                    {isDragActive ? 'Drop the file here' : 'Drag and drop your file here'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">or click to browse</p>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  PDF files only, up to 10MB
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Uploading...</span>
              <span className="text-gray-500">{uploadProgress}%</span>
            </div>
            <Progress.Root
              className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200"
              value={uploadProgress}
            >
              <Progress.Indicator
                className="h-full bg-blue-500 transition-all duration-500 ease-in-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </Progress.Root>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!file || uploading}
            className="min-w-[100px]"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </form>
    </div>
  );
}
