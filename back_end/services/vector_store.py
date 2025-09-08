import chromadb
from chromadb.config import Settings
from langchain_huggingface import HuggingFaceEmbeddings
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

class VectorStore:
    def __init__(self):
        self.persist_directory = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.collection = self.client.get_or_create_collection(
            name="pdf_documents",
            metadata={"hnsw:space": "cosine"}
        )
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    
    async def add_documents(self, processed_data: Dict[str, Any]):
        """Add processed PDF data to vector store"""
        documents = []
        metadatas = []
        ids = []
        
        # Add text chunks
        for idx, chunk in enumerate(processed_data["text_chunks"]):
            documents.append(chunk["content"])
            metadatas.append({
                "type": chunk["type"],
                "page": chunk["page"],
                "source": "text"
            })
            ids.append(f"text_{idx}")
        
        # Add tables
        for idx, table in enumerate(processed_data["tables"]):
            documents.append(table["content"])
            metadatas.append({
                "type": table["type"],
                "page": table["page"],
                "table_id": table["table_id"],
                "source": "table"
            })
            ids.append(f"table_{idx}")
        
        # Add images (store description for now)
        for idx, image in enumerate(processed_data["images"]):
            documents.append(image["content"])
            metadatas.append({
                "type": image["type"],
                "page": image["page"],
                "image_id": image["image_id"],
                "source": "image"
            })
            ids.append(f"image_{idx}")
        
        if documents:
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
    
    async def search(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant documents"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        return [
            {
                "content": doc,
                "metadata": meta,
                "distance": dist
            }
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            )
        ]