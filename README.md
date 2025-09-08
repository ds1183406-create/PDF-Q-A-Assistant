# Multi-Modal AI PDF Assistant

A web application that allows users to upload PDF documents and interact with them using natural language queries. Built with FastAPI, React, and Google Gemini 2.5 for advanced multi-modal reasoning.

## Features

- 📄 **PDF Upload**: Support for documents up to 20MB
- 🔍 **Text Extraction**: Extract and search through document content
- 📊 **Table Processing**: Parse and query structured data from tables
- 🖼️ **Image Analysis**: Understand charts, diagrams, and visual content
- 💬 **Chat Interface**: Natural language Q&A with context-aware responses
- 🧠 **Memory**: Maintains conversation context across multiple queries
- 📚 **Source References**: Shows page numbers and content sources for answers

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **LangChain**: RAG pipeline orchestration
- **Google Gemini 2.5**: Pro + Flash Vision for reasoning
- **ChromaDB**: Vector database for embeddings
- **PyPDF2/pdfplumber**: PDF text and table extraction
- **pdf2image**: Image extraction from PDFs

### Frontend
- **React 18+**: Modern UI framework
- **Axios**: HTTP client for API calls
- **Lucide React**: Icon library
- **React Dropzone**: File upload component

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- Google AI API key (Gemini)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd back_end
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create environment file:
```bash
cp .env.example .env
```

5. Add your Google AI API key to `.env`:
```
GOOGLE_API_KEY=your_gemini_api_key_here
```

6. Run the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd front_end
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. **Upload PDF**: Drag and drop or click to select a PDF file (max 20MB)
2. **Wait for Processing**: The system extracts text, tables, and images
3. **Start Chatting**: Ask questions about the document content
4. **View Sources**: See page references and source content for each answer

## API Endpoints

- `POST /upload`: Upload and process PDF files
- `POST /chat`: Send messages and get AI responses
- `GET /health`: Health check endpoint

## Project Structure

```
├── back_end/
│   ├── main.py                 # FastAPI application
│   ├── services/
│   │   ├── pdf_processor.py    # PDF extraction logic
│   │   ├── vector_store.py     # ChromaDB integration
│   │   └── chat_service.py     # Gemini AI integration
│   ├── requirements.txt        # Python dependencies
│   └── .env.example           # Environment variables template
├── front_end/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.jsx  # File upload component
│   │   │   └── ChatInterface.jsx # Chat UI component
│   │   ├── App.jsx            # Main application
│   │   └── main.jsx           # React entry point
│   ├── package.json           # Node.js dependencies
│   └── vite.config.js         # Vite configuration
└── README.md                  # This file
```

## Environment Variables

Create a `.env` file in the `back_end` directory:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
CHROMA_PERSIST_DIRECTORY=./chroma_db
MAX_FILE_SIZE_MB=20
```

## Deployment

### Backend Deployment Options
- **Hugging Face Spaces**: Upload backend code with requirements.txt
- **Railway**: Connect GitHub repo and deploy
- **Render**: Deploy with automatic builds

### Frontend Deployment Options
- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Deploy with build command `npm run build`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the GitHub repository.