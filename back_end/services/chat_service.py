import google.generativeai as genai
from typing import Dict, List, Any
import os
from dotenv import load_dotenv

load_dotenv()

class ChatService:
    def __init__(self, vector_store):
        self.vector_store = vector_store
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.chat_memory = {}
        self.uploaded_sessions = set()  # Track which sessions have uploaded PDFs
    
    async def get_response(self, message: str, session_id: str) -> Dict[str, Any]:
        """Generate response using RAG with Gemini"""
        
        # Check if this is a general greeting or conversation
        if self._is_general_message(message):
            if session_id not in self.uploaded_sessions:
                return {
                    "response": "Hello! I'm your PDF assistant. Please upload a PDF document and I'll help you analyze and answer questions about it.",
                    "sources": [],
                    "session_id": session_id
                }
            else:
                return {
                    "response": "Hello! I can help you with questions about your uploaded PDF. What would you like to know?",
                    "sources": [],
                    "session_id": session_id
                }
        
        # Check if this session has uploaded a PDF
        if session_id not in self.uploaded_sessions:
            return {
                "response": "Please upload a PDF document first before asking questions about it.",
                "sources": [],
                "session_id": session_id
            }
        
        # Search for relevant context
        relevant_docs = await self.vector_store.search(message, n_results=5)
        
        # Build context from retrieved documents
        context = self._build_context(relevant_docs)
        
        # Get chat history for this session
        chat_history = self.chat_memory.get(session_id, [])
        
        # Build prompt
        prompt = self._build_prompt(message, context, chat_history)
        
        try:
            # Generate response
            response = self.model.generate_content(prompt)
            
            # Update chat memory
            self._update_memory(session_id, message, response.text)
            
            return {
                "response": response.text,
                "sources": self._format_sources(relevant_docs) if relevant_docs else [],
                "session_id": session_id
            }
        
        except Exception as e:
            return {
                "response": f"I apologize, but I encountered an error: {str(e)}",
                "sources": [],
                "session_id": session_id
            }
    
    def _build_context(self, relevant_docs: List[Dict[str, Any]]) -> str:
        """Build context string from relevant documents"""
        context_parts = []
        
        for doc in relevant_docs:
            source_type = doc["metadata"].get("source", "unknown")
            page = doc["metadata"].get("page", "unknown")
            
            context_parts.append(
                f"[{source_type.upper()} - Page {page}]: {doc['content'][:500]}..."
            )
        
        return "\n\n".join(context_parts)
    
    def _build_prompt(self, message: str, context: str, chat_history: List[Dict]) -> str:
        """Build the complete prompt for Gemini"""
        
        history_text = ""
        if chat_history:
            history_text = "\n".join([
                f"User: {turn['user']}\nAssistant: {turn['assistant']}"
                for turn in chat_history[-3:]  # Last 3 turns
            ])
        
        if not context.strip():
            prompt = f"""You are a helpful AI assistant that answers questions about PDF documents.
The user has uploaded a PDF but no relevant content was found for their question.

Chat History:
{history_text}

Current Question: {message}

Please inform the user that you couldn't find relevant information in the uploaded PDF to answer their question.

Answer:"""
        else:
            prompt = f"""You are a helpful AI assistant that answers questions about PDF documents. 
Use the provided context to answer the user's question accurately and concisely.

Context from PDF:
{context}

Chat History:
{history_text}

Current Question: {message}

Instructions:
- Answer based ONLY on the provided context
- If the context doesn't contain relevant information, say so clearly
- Be specific and cite page numbers when possible
- For tables, format the data clearly
- For images/charts, describe what you can infer from the context
- Use markdown formatting: **bold** for emphasis and * for bullet points
- Organize information clearly with proper structure

Answer:"""
        
        return prompt
    
    def _update_memory(self, session_id: str, user_message: str, assistant_response: str):
        """Update chat memory for the session"""
        if session_id not in self.chat_memory:
            self.chat_memory[session_id] = []
        
        self.chat_memory[session_id].append({
            "user": user_message,
            "assistant": assistant_response
        })
        
        # Keep only last 10 turns
        if len(self.chat_memory[session_id]) > 10:
            self.chat_memory[session_id] = self.chat_memory[session_id][-10:]
    
    def _is_general_message(self, message: str) -> bool:
        """Check if message is a general greeting or conversation starter"""
        message_lower = message.lower().strip()
        
        # Exact greetings only
        exact_greetings = [
            "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
            "how are you", "what's up", "greetings", "thanks", "thank you",
            "bye", "goodbye", "see you", "nice to meet you"
        ]
        
        # Check if it's an exact match or very short greeting
        return message_lower in exact_greetings or (len(message_lower) <= 5 and message_lower in ["hi", "hey", "hello"])
    
    def mark_session_uploaded(self, session_id: str):
        """Mark a session as having uploaded a PDF"""
        self.uploaded_sessions.add(session_id)
    
    def _format_sources(self, relevant_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format sources for frontend display"""
        sources = []
        
        for doc in relevant_docs:
            sources.append({
                "type": doc["metadata"].get("source", "unknown"),
                "page": doc["metadata"].get("page", "unknown"),
                "content": doc["content"][:200] + "..." if len(doc["content"]) > 200 else doc["content"],
                "relevance": 1 - doc["distance"]  # Convert distance to relevance score
            })
        
        return sources