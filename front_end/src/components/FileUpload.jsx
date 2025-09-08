import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import axios from 'axios'

const FileUpload = ({ onFileUpload }) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB')
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      onFileUpload(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  return (
    <div className="file-upload-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="upload-content">
          {uploading ? (
            <>
              <div className="spinner"></div>
              <p>Processing your PDF...</p>
            </>
          ) : (
            <>
              <Upload size={48} className="upload-icon" />
              <h3>Upload your PDF</h3>
              <p>
                {isDragActive
                  ? 'Drop the PDF here...'
                  : 'Drag & drop a PDF file here, or click to select'}
              </p>
              <div className="file-requirements">
                <FileText size={16} />
                <span>PDF files only • Max 20MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <style>{`
        .file-upload-container {
          width: 100%;
          max-width: 400px;
        }

        .dropzone {
          border: 2px dashed rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.1);
        }

        .dropzone:hover {
          border-color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.15);
        }

        .dropzone.active {
          border-color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.2);
        }

        .dropzone.uploading {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .upload-icon {
          color: white;
        }

        .upload-content h3 {
          margin: 0;
          color: white;
          font-size: 1.5rem;
        }

        .upload-content p {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.1rem;
        }

        .file-requirements {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 1rem;
          background: #fed7d7;
          color: #c53030;
          border-radius: 8px;
          border: 1px solid #feb2b2;
        }

        @media (max-width: 768px) {
          .dropzone {
            padding: 2rem 1rem;
          }
          
          .upload-content h3 {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  )
}

export default FileUpload