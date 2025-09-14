'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileImage, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'

interface IdVerificationProps {
  entityId: string
}

interface IdDocument {
  id: string
  type: 'PASSPORT' | 'DRIVERS_LICENSE' | 'MEDICARE_CARD' | 'BIRTH_CERTIFICATE'
  documentNumber: string
  expiryDate?: string
  fileName: string
  uploadedAt: Date
  dvsStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'NOT_CHECKED'
  dvsDetails?: string
}

export function IdVerification({ entityId }: IdVerificationProps) {
  const [documents, setDocuments] = useState<IdDocument[]>([
    // Mock existing document
    {
      id: '1',
      type: 'DRIVERS_LICENSE',
      documentNumber: 'DL123456789',
      expiryDate: '2025-12-31',
      fileName: 'drivers_license.jpg',
      uploadedAt: new Date('2024-01-15'),
      dvsStatus: 'VERIFIED',
      dvsDetails: 'Document verified against DVS database'
    }
  ])
  const [isUploading, setIsUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    type: '',
    documentNumber: '',
    expiryDate: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'NOT_CHECKED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'PENDING':
        return <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.type || !uploadForm.documentNumber) {
      return
    }

    setIsUploading(true)

    try {
      // Simulate upload and DVS check
      await new Promise(resolve => setTimeout(resolve, 2000))

      const newDocument: IdDocument = {
        id: Date.now().toString(),
        type: uploadForm.type as any,
        documentNumber: uploadForm.documentNumber,
        expiryDate: uploadForm.expiryDate || undefined,
        fileName: selectedFile.name,
        uploadedAt: new Date(),
        dvsStatus: Math.random() > 0.3 ? 'VERIFIED' : 'FAILED',
        dvsDetails: Math.random() > 0.3 
          ? 'Document verified against DVS database' 
          : 'Document could not be verified - details do not match DVS records'
      }

      setDocuments([...documents, newDocument])
      setShowUpload(false)
      setSelectedFile(null)
      setUploadForm({ type: '', documentNumber: '', expiryDate: '' })
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileImage className="w-5 h-5" />
            <span>Identity Documents</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowUpload(!showUpload)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Form */}
        {showUpload && (
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="docType">Document Type</Label>
                  <Select
                    value={uploadForm.type}
                    onValueChange={(value) => setUploadForm({ ...uploadForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASSPORT">Passport</SelectItem>
                      <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                      <SelectItem value="MEDICARE_CARD">Medicare Card</SelectItem>
                      <SelectItem value="BIRTH_CERTIFICATE">Birth Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docNumber">Document Number</Label>
                  <Input
                    id="docNumber"
                    value={uploadForm.documentNumber}
                    onChange={(e) => setUploadForm({ ...uploadForm, documentNumber: e.target.value })}
                    placeholder="Enter document number"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={uploadForm.expiryDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Document Image</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>

              {selectedFile && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <FileImage className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">{selectedFile.name}</span>
                    <span className="text-xs text-blue-600">
                      ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile || !uploadForm.type || !uploadForm.documentNumber}
                  size="sm"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {isUploading ? 'Uploading & Verifying...' : 'Upload & Verify'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowUpload(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document List */}
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <FileImage className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">
                          {doc.type.replace('_', ' ')}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {doc.documentNumber}
                      </Badge>
                      {doc.expiryDate && (
                        <Badge variant="outline" className="text-xs">
                          Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(doc.dvsStatus)}
                      <Badge className={getStatusColor(doc.dvsStatus)} variant="outline">
                        DVS Status: {doc.dvsStatus}
                      </Badge>
                    </div>
                    
                    {doc.dvsDetails && (
                      <p className="text-sm text-gray-600">{doc.dvsDetails}</p>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Uploaded: {doc.uploadedAt.toLocaleDateString()} • File: {doc.fileName}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(doc.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {documents.length === 0 && !showUpload && (
            <div className="text-center py-6 text-gray-500">
              <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p>No identity documents uploaded</p>
              <p className="text-sm">Upload documents for identity verification</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}