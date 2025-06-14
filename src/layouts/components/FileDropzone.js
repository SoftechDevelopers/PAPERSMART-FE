import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Box, Typography } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

const validAccept = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.ms-excel': ['.xls']
}

const FileDropzone = React.memo(
  ({
    onDrop,
    onDropRejected,
    acceptedFiles = validAccept,
    maxSize = Infinity,
    dropzoneText = 'Drag & Drop files here or click to upload',
    iconSize = 50,
    disabled
  }) => {
    const handleDrop = useCallback(
      acceptedFiles => {
        onDrop(acceptedFiles)
      },
      [onDrop]
    )

    const handleDropRejected = useCallback(
      fileRejections => {
        if (onDropRejected) {
          onDropRejected(fileRejections)
        }
      },
      [onDropRejected]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      disabled,
      onDrop: handleDrop,
      onDropRejected: handleDropRejected,
      accept: acceptedFiles,
      maxSize
    })

    return (
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed #888',
          borderRadius: '8px',
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper'
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: iconSize, color: disabled ? 'secondary.main' : 'primary.main' }} />
        <Typography variant='h6' sx={{ mt: 2 }} color={disabled ? 'secondary.main' : 'textPrimary'}>
          {isDragActive ? 'Drop the files here...' : dropzoneText}
        </Typography>
        <Typography variant='body2' color={disabled ? 'secondary.main' : 'textSecondary'}>
          (Accepted formats: {Object.keys(acceptedFiles).join(', ')}, Max size: {maxSize / (1024 * 1024)} MB)
        </Typography>
      </Box>
    )
  }
)

export default FileDropzone
