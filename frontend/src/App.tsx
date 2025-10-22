import { useState, useCallback } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ConversionOptions {
  resize: boolean
  enhance: boolean
  threshold: number | null
  colorMode: 'binary' | 'grayscale'
  simplify: boolean
  useCache: boolean
  streaming: boolean
  background: boolean
}

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [svgResult, setSvgResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [processingTime, setProcessingTime] = useState<string>('')
  const [taskId, setTaskId] = useState<string>('')
  const [options, setOptions] = useState<ConversionOptions>({
    resize: true,
    enhance: false,
    threshold: null,
    colorMode: 'binary',
    simplify: true,
    useCache: true,
    streaming: false,
    background: false
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setSvgResult('')
      setError('')
      setProcessingTime('')
      setTaskId('')
    }
  }

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    setSvgResult('')
    setTaskId('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const params = new URLSearchParams({
        resize: options.resize.toString(),
        enhance: options.enhance.toString(),
        color_mode: options.colorMode,
        simplify: options.simplify.toString(),
      })

      if (options.threshold !== null) {
        params.append('threshold', options.threshold.toString())
      }

      let endpoint = '/convert'
      if (options.background) {
        endpoint = '/convert/background'
      } else if (options.streaming) {
        endpoint = '/convert/streaming'
      } else {
        params.append('use_cache', options.useCache.toString())
      }

      const startTime = Date.now()
      const response = await axios.post(
        `${API_BASE_URL}${endpoint}?${params.toString()}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: options.background ? 'json' : 'text'
        }
      )

      const endTime = Date.now()
      const clientTime = ((endTime - startTime) / 1000).toFixed(2)

      if (options.background) {
        setTaskId(response.data.task_id)
        pollTaskStatus(response.data.task_id)
      } else {
        setSvgResult(response.data)
        const serverTime = response.headers['x-processing-time']
        setProcessingTime(serverTime ? `Server: ${serverTime}, Client: ${clientTime}s` : `Client: ${clientTime}s`)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Conversion failed')
    } finally {
      if (!options.background) {
        setLoading(false)
      }
    }
  }

  const pollTaskStatus = async (id: string) => {
    try {
      const statusResponse = await axios.get(`${API_BASE_URL}/tasks/${id}`)
      
      if (statusResponse.data.status === 'completed') {
        const resultResponse = await axios.get(`${API_BASE_URL}/tasks/${id}/result`)
        setSvgResult(resultResponse.data)
        setLoading(false)
      } else if (statusResponse.data.status === 'failed') {
        setError('Task failed: ' + (statusResponse.data.error || 'Unknown error'))
        setLoading(false)
      } else {
        setTimeout(() => pollTaskStatus(id), 1000)
      }
    } catch (err: any) {
      setError('Failed to check task status: ' + err.message)
      setLoading(false)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([svgResult], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file?.name.replace(/\.[^/.]+$/, '') + '.svg' || 'converted.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="App">
      <div className="container">
        <h1>Image to SVG Converter</h1>
        <p className="subtitle">High-performance vectorization with caching</p>

        <div className="upload-section">
          <input
            type="file"
            id="file-input"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            {file ? file.name : 'Choose an image'}
          </label>
        </div>

        <div className="options-section">
          <h3>Conversion Options</h3>
          <div className="options-grid">
            <label>
              <input
                type="checkbox"
                checked={options.resize}
                onChange={(e) => setOptions({ ...options, resize: e.target.checked })}
              />
              Resize large images
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.enhance}
                onChange={(e) => setOptions({ ...options, enhance: e.target.checked })}
              />
              Enhance quality
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.simplify}
                onChange={(e) => setOptions({ ...options, simplify: e.target.checked })}
              />
              Simplify paths
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.useCache}
                onChange={(e) => setOptions({ ...options, useCache: e.target.checked })}
                disabled={options.streaming || options.background}
              />
              Use cache
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.streaming}
                onChange={(e) => setOptions({ ...options, streaming: e.target.checked, background: false })}
              />
              Streaming mode
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.background}
                onChange={(e) => setOptions({ ...options, background: e.target.checked, streaming: false })}
              />
              Background processing
            </label>
          </div>

          <div className="select-group">
            <label htmlFor="color-mode">Color Mode:</label>
            <select
              id="color-mode"
              value={options.colorMode}
              onChange={(e) => setOptions({ ...options, colorMode: e.target.value as 'binary' | 'grayscale' })}
            >
              <option value="binary">Binary</option>
              <option value="grayscale">Grayscale</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleConvert}
          disabled={!file || loading}
          className="convert-button"
        >
          {loading ? 'Processing...' : 'Convert to SVG'}
        </button>

        {taskId && (
          <div className="info-message">
            Task ID: {taskId} - Checking status...
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {processingTime && (
          <div className="info-message">
            Processing time: {processingTime}
          </div>
        )}

        {svgResult && (
          <div className="result-section">
            <div className="result-header">
              <h3>Result</h3>
              <button onClick={handleDownload} className="download-button">
                Download SVG
              </button>
            </div>
            <div className="preview-container">
              <div dangerouslySetInnerHTML={{ __html: svgResult }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
