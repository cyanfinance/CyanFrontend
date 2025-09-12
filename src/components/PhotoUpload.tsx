import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Image as ImageIcon, Trash2, Eye } from 'lucide-react';

interface Photo {
  id: string;
  file: File;
  preview: string;
  uploaded?: boolean;
  photoId?: string;
  readyForUpload?: boolean;
}

interface PhotoUploadProps {
  loanId: string;
  goldItemIndex: number;
  token: string;
  onPhotosChange?: (photos: Photo[]) => void;
  maxPhotos?: number;
  className?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  loanId,
  goldItemIndex,
  token,
  onPhotosChange,
  maxPhotos = 5,
  className = ''
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newPhotos: Photo[] = [];
    const remainingSlots = maxPhotos - photos.length;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const photo: Photo = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: URL.createObjectURL(file)
        };
        newPhotos.push(photo);
      }
    });

    if (newPhotos.length === 0) {
      setError('Please select valid image files');
      return;
    }

    const updatedPhotos = [...photos, ...newPhotos];
    setPhotos(updatedPhotos);
    onPhotosChange?.(updatedPhotos);
    setError(null);
  }, [photos, maxPhotos, onPhotosChange]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle camera input change
  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow capturing again
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  // Remove photo
  const removePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosChange?.(updatedPhotos);
  };

  // Upload photos
  const uploadPhotos = async () => {
    if (photos.length === 0) {
      setError('No photos to upload');
      return;
    }

    // If loanId is "temp", don't upload yet - just mark as ready
    if (loanId === 'temp') {
      const updatedPhotos = photos.map(photo => ({
        ...photo,
        readyForUpload: true
      }));
      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('goldItemIndex', goldItemIndex.toString());
      formData.append('description', `Photos for gold item ${goldItemIndex + 1}`);

      // Add all photos to form data
      photos.forEach(photo => {
        formData.append('photos', photo.file);
      });

      const response = await fetch(`${API_URL}/loans/${loanId}/photos`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      // Mark photos as uploaded
      const updatedPhotos = photos.map((photo, index) => ({
        ...photo,
        uploaded: true,
        photoId: data.data[index]?._id
      }));

      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Check if device supports camera
  const supportsCamera = () => {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Controls */}
      <div className="flex flex-wrap gap-3">
        {/* File Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= maxPhotos || uploading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Upload size={16} />
          Choose Files
        </button>

        {/* Camera Button */}
        {supportsCamera() && (
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={photos.length >= maxPhotos || uploading}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Camera size={16} />
            Take Photo
          </button>
        )}

        {/* Upload Button */}
        {photos.length > 0 && (
          <button
            type="button"
            onClick={uploadPhotos}
            disabled={uploading || photos.every(p => p.uploaded || p.readyForUpload)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : loanId === 'temp' ? (
              <>
                <Upload size={16} />
                Prepare {photos.filter(p => !p.readyForUpload).length} Photos
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload {photos.filter(p => !p.uploaded).length} Photos
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraInputChange}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={photo.preview}
                  alt="Gold item"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowPreview(photo.preview)}
                />
                
                {/* Upload Status Overlay */}
                {photo.uploaded && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                    <div className="bg-green-500 text-white rounded-full p-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                {photo.readyForUpload && !photo.uploaded && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                    <div className="bg-blue-500 text-white rounded-full p-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPreview(photo.preview)}
                      className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* File Info */}
              <div className="mt-1 text-xs text-gray-500 truncate">
                {photo.file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Counter */}
      <div className="text-sm text-gray-600">
        {photos.length} / {maxPhotos} photos
        {photos.length > 0 && (
          <span className="ml-2">
            {loanId === 'temp' ? (
              `(${photos.filter(p => p.readyForUpload).length} ready)`
            ) : (
              `(${photos.filter(p => p.uploaded).length} uploaded)`
            )}
          </span>
        )}
      </div>

      {/* Full Screen Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={showPreview}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <button
              type="button"
              onClick={() => setShowPreview(null)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
