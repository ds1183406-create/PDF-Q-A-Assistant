import PyPDF2
import pdfplumber
from pdf2image import convert_from_path
from PIL import Image
import io
import base64
from typing import Dict, List, Any
import pandas as pd

class PDFProcessor:
    def __init__(self):
        pass
    
    async def process_pdf(self, file_path: str) -> Dict[str, Any]:
        """Process PDF and extract text, tables, and images"""
        result = {
            "text_chunks": [],
            "tables": [],
            "images": [],
            "pages": 0
        }
        
        # Extract text and tables using pdfplumber
        with pdfplumber.open(file_path) as pdf:
            result["pages"] = len(pdf.pages)
            
            for page_num, page in enumerate(pdf.pages):
                # Extract text
                text = page.extract_text()
                if text and text.strip():
                    result["text_chunks"].append({
                        "content": text,
                        "page": page_num + 1,
                        "type": "text"
                    })
                
                # Extract tables
                tables = page.extract_tables()
                for table_idx, table in enumerate(tables):
                    if table:
                        df = pd.DataFrame(table[1:], columns=table[0])
                        result["tables"].append({
                            "content": df.to_string(),
                            "data": df.to_dict('records'),
                            "page": page_num + 1,
                            "table_id": f"table_{page_num}_{table_idx}",
                            "type": "table"
                        })
        
        # Extract images
        try:
            images = convert_from_path(file_path)
            for img_idx, img in enumerate(images):
                # Convert to base64 for storage
                buffer = io.BytesIO()
                img.save(buffer, format='PNG')
                img_base64 = base64.b64encode(buffer.getvalue()).decode()
                
                result["images"].append({
                    "content": f"Image from page {img_idx + 1}",
                    "image_data": img_base64,
                    "page": img_idx + 1,
                    "image_id": f"image_{img_idx}",
                    "type": "image"
                })
        except Exception as e:
            print(f"Error extracting images: {e}")
        
        return result