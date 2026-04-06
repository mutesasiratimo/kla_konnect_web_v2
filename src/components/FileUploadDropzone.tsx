import React, { useId, useRef, useState } from 'react'
import { resolveApiMediaUrl } from '../api/client'
import { uploads } from '../api/endpoints'
import type { UploadFileKind } from '../api/types'

export function uploadKindForFile(file: File): UploadFileKind {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'image'
}

type ImageUploadDropzoneProps = {
  label: string
  valueUrl: string | null
  onUrlChange: (url: string | null) => void
  disabled?: boolean
}

/** Single image: uploads to API, stores returned URL (no manual URL field). */
export function ImageUploadDropzone({
  label,
  valueUrl,
  onUrlChange,
  disabled,
}: ImageUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const reactId = useId()
  const inputId = `img-drop-${reactId}`
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openPicker = () => {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  const runUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const res = await uploads.file(file, 'image')
      onUrlChange(res.url)
    } catch (e) {
      console.error(e)
      setError('Upload failed. Try again or check you are signed in.')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    if (disabled || uploading) return
    const f = e.dataTransfer.files[0]
    if (f) void runUpload(f)
  }

  return (
    <div className="dashboard-file-dropzone-wrap">
      <span className="dashboard-file-dropzone-label">{label}</span>
      <div
        className={`dashboard-file-dropzone ${dragOver ? 'dashboard-file-dropzone--drag' : ''} ${error ? 'dashboard-file-dropzone--error' : ''}`}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openPicker()
          }
        }}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !uploading) setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragOver(false)
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || uploading}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="dashboard-file-dropzone-input"
          accept="image/*"
          disabled={disabled || uploading}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void runUpload(f)
            e.target.value = ''
          }}
        />
        {valueUrl ? (
          <div className="dashboard-file-dropzone-preview-split">
            <div className="dashboard-file-dropzone-preview-pane">
              <img src={resolveApiMediaUrl(valueUrl) ?? valueUrl} alt="" />
              <button
                type="button"
                className="dashboard-file-dropzone-close"
                onClick={(e) => {
                  e.stopPropagation()
                  onUrlChange(null)
                  setError(null)
                }}
                disabled={disabled || uploading}
                aria-label="Remove image"
                title="Remove image"
              >
                ×
              </button>
            </div>
            <div className="dashboard-file-dropzone-widget-pane">
              <div className="dashboard-file-dropzone-inner">
                <span className="dashboard-file-dropzone-icon" aria-hidden="true">
                  ↑
                </span>
                <p className="dashboard-file-dropzone-text">
                  {uploading ? 'Uploading…' : 'Drag an image here or click to replace'}
                </p>
                <p className="dashboard-file-dropzone-sub">PNG, JPG, WebP, …</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard-file-dropzone-inner">
            <span className="dashboard-file-dropzone-icon" aria-hidden="true">
              ↑
            </span>
            <p className="dashboard-file-dropzone-text">
              {uploading ? 'Uploading…' : 'Drag an image here or click to upload'}
            </p>
            <p className="dashboard-file-dropzone-sub">PNG, JPG, WebP, …</p>
          </div>
        )}
      </div>
      {error && (
        <p className="dashboard-file-dropzone-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

type PendingMediaDropzoneProps = {
  label: string
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
  accept?: string
}

/** Queue files for later upload (e.g. attach after incident is created). */
export function PendingMediaDropzone({
  label,
  files,
  onFilesChange,
  disabled,
  accept = 'image/*,video/*,audio/*',
}: PendingMediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const reactId = useId()
  const inputId = `media-drop-${reactId}`
  const [dragOver, setDragOver] = useState(false)

  const openPicker = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list)
    if (arr.length === 0) return
    onFilesChange([...files, ...arr])
  }

  return (
    <div className="dashboard-file-dropzone-wrap">
      <span className="dashboard-file-dropzone-label">{label}</span>
      <div
        className={`dashboard-file-dropzone ${dragOver ? 'dashboard-file-dropzone--drag' : ''}`}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openPicker()
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDragOver(false)
          if (disabled) return
          addFiles(e.dataTransfer.files)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragOver(false)
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="dashboard-file-dropzone-input"
          accept={accept}
          multiple
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <div className="dashboard-file-dropzone-inner">
          <span className="dashboard-file-dropzone-icon" aria-hidden="true">
            ↑
          </span>
          <p className="dashboard-file-dropzone-text">
            Drag files here or click to browse
          </p>
          <p className="dashboard-file-dropzone-sub">Images, video, or audio</p>
        </div>
      </div>
      {files.length > 0 && (
        <ul className="dashboard-file-dropzone-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}-${f.size}`}>
              <span>{f.name}</span>
              <button
                type="button"
                className="dashboard-file-dropzone-remove"
                onClick={() => onFilesChange(files.filter((_, j) => j !== i))}
                disabled={disabled}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
