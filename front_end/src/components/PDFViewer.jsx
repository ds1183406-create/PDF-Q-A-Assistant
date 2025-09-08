import { FileText } from 'lucide-react'

const PDFViewer = ({ filename, onUploadNew }) => {
  return (
    <div className="pdf-viewer">
      <div className="pdf-document">
        <div className="pdf-header">
          <FileText size={24} />
          <span>Q&A Bot</span>
        </div>
        <div className="pdf-content">
          <div className="pdf-pages">
            {/* Simulated PDF pages */}
            <div className="pdf-page">
              <div className="page-lines">
                {Array.from({ length: 25 }, (_, i) => (
                  <div key={i} className="line" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                ))}
              </div>
            </div>
          </div>
          <div className="pdf-pagination">
            <span>• • •</span>
          </div>
        </div>
      </div>
      
      <button className="upload-btn" onClick={onUploadNew}>
        <FileText size={20} />
        Upload File
      </button>

      <style>{`
        .pdf-viewer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          width: 100%;
          max-width: 400px;
        }

        .pdf-document {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 350px;
        }

        .pdf-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e0e0e0;
          color: #2c3e50;
          font-weight: 600;
        }

        .pdf-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .pdf-pages {
          background: #fafafa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
          min-height: 300px;
        }

        .pdf-page {
          background: white;
          padding: 1rem;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .page-lines {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .line {
          height: 3px;
          background: #bdc3c7;
          border-radius: 2px;
        }

        .pdf-pagination {
          text-align: center;
          color: #7f8c8d;
          font-size: 1.2rem;
        }

        .upload-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.2s;
          width: 100%;
          max-width: 200px;
          justify-content: center;
        }

        .upload-btn:hover {
          background: #2980b9;
        }
      `}</style>
    </div>
  )
}

export default PDFViewer