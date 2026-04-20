'use client'
import { useRef, useState, DragEvent } from 'react'
import { Upload, FileText, X } from 'lucide-react'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onClear: () => void
}

export default function UploadZone({ onFileSelect, selectedFile, onClear }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') onFileSelect(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  if (selectedFile) {
    return (
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <FileText className="h-5 w-5 text-blue-600 shrink-0" />
        <span className="flex-1 text-sm font-medium text-slate-700 truncate">{selectedFile.name}</span>
        <span className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
        <button onClick={onClear} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
      }`}
    >
      <Upload className="h-8 w-8 text-slate-400 mb-3" />
      <p className="text-sm font-medium text-slate-600">Drop your PDF here</p>
      <p className="text-xs text-slate-400 mt-1">or click to browse · max 10 MB</p>
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleChange} />
    </div>
  )
}
