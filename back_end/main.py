from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import Form
import os
from typing import List, Optional
import uvicorn

from services.pdf_processor import PDFProcessor
from services.chat_service import ChatService
from services.vector_store import VectorStore

app = FastAPI(title="Multi-Modal AI PDF Assistant", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
pdf_processor = PDFProcessor()
vector_store = VectorStore()
chat_service = ChatService(vector_store)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    response: str
    sources: List[dict]
    session_id: str

@app.get("/")
async def root():
    return {"message": "Multi-Modal AI PDF Assistant API"}

class UploadRequest(BaseModel):
    session_id: Optional[str] = "default"

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), session_id: str = "default"):
    """Upload and process a PDF file"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    if file.size > 20 * 1024 * 1024:  # 20MB limit
        raise HTTPException(status_code=400, detail="File size exceeds 20MB limit")
    
    try:
        # Save uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process PDF
        result = await pdf_processor.process_pdf(temp_path)
        
        # Store in vector database
        await vector_store.add_documents(result)
        
        # Mark this session as having uploaded a PDF
        chat_service.mark_session_uploaded(session_id)
        
        # Clean up temp file
        os.remove(temp_path)
        
        return {
            "message": "PDF processed successfully",
            "filename": file.filename,
            "pages": result["pages"],
            "tables": len(result["tables"]),
            "images": len(result["images"])
        }
    
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with the PDF content"""
    try:
        response = await chat_service.get_response(request.message, request.session_id)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)