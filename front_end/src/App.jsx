import { useState } from 'react'
import ChatInterface from './components/ChatInterface'
import './App.css'

function App() {
  const [uploadedFile, setUploadedFile] = useState(null)

  const handleFileUpload = (fileInfo) => {
    setUploadedFile(fileInfo)
  }

  return (
    <div className="app">
      <ChatInterface onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />
    </div>
  )
}

export default App
