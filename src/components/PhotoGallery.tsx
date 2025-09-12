import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Download, Image as ImageIcon, X } from 'lucide-react';

interface Photo {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  uploadedAt: string;
  description: string;
  tags: string[];
  imageUrl: string;
  thumbnailUrl: string;
}

interface PhotoGalleryProps {
  loanId: string;
  goldItemIndex?: number;
  token: string;
  onPhotoDelete?: (photoId: string) => void;
  className?: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  loanId,
  goldItemIndex,
  token,
  onPhotoDelete,
  className = ''
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Fetch photos
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `${API_URL}/loans/${loanId}/photos`;
      if (goldItemIndex !== undefined) {
        url = `${API_URL}/loans/${loanId}/gold-items/${goldItemIndex}/photos`;
      }

      const response = await fetch(url, {
        headers: {
          'x-auth-token': token
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch photos');
      }

      setPhotos(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  // Delete photo
  const deletePhoto = async (photoId: string) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      setDeleting(photoId);
      setError(null);

      const response = await fetch(`${API_URL}/loans/${loanId}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete photo');
      }

      // Remove photo from state
      setPhotos(prev => prev.filter(photo => photo._id !== photoId));
      onPhotoDelete?.(photoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setDeleting(null);
    }
  };

  // Download photo
  const downloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(`${API_URL}${photo.imageUrl}`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download photo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.originalName || photo.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download photo');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchPhotos();
  }, [loanId, goldItemIndex]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading photos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 ${className}`}>
        {error}
        <button
          onClick={fetchPhotos}
          className="ml-2 text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        <ImageIcon size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No photos uploaded yet</p>
        <button
          onClick={fetchPhotos}
          className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div key={photo._id} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={`${API_URL}${photo.thumbnailUrl}`}
                alt={photo.description || 'Gold item photo'}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowPreview(photo)}
                loading="lazy"
                onLoad={() => {
                  console.log('Image loaded successfully:', `${API_URL}${photo.thumbnailUrl}`);
                }}
                onError={(e) => {
                  console.error('Failed to load image:', {
                    url: `${API_URL}${photo.thumbnailUrl}`,
                    photoId: photo._id,
                    thumbnailUrl: photo.thumbnailUrl,
                    API_URL
                  });
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+';
                }}
              />

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPreview(photo)}
                    className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    title="View full size"
                  >
                    <Eye size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPhoto(photo)}
                    className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    title="Download"
                  >
                    <Download size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePhoto(photo._id)}
                    disabled={deleting === photo._id}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                    title="Delete"
                  >
                    {deleting === photo._id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Photo Info */}
            <div className="mt-1 text-xs text-gray-500">
              <div className="truncate" title={photo.originalName}>
                {photo.originalName}
              </div>
              <div className="text-gray-400">
                {formatFileSize(photo.size)} • {formatDate(photo.uploadedAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Counter */}
      <div className="text-sm text-gray-600">
        {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded
      </div>

      {/* Full Screen Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-6xl max-h-full">
            <img
              src={`${API_URL}${showPreview.imageUrl}`}
              alt={showPreview.description || 'Gold item photo'}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowPreview(null)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Photo Info Panel */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Photo Details</h3>
                  <p><strong>Name:</strong> {showPreview.originalName}</p>
                  <p><strong>Size:</strong> {formatFileSize(showPreview.size)}</p>
                  <p><strong>Dimensions:</strong> {showPreview.width} × {showPreview.height}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Upload Info</h3>
                  <p><strong>Uploaded by:</strong> {showPreview.uploadedBy.name}</p>
                  <p><strong>Date:</strong> {formatDate(showPreview.uploadedAt)}</p>
                  {showPreview.description && (
                    <p><strong>Description:</strong> {showPreview.description}</p>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => downloadPhoto(showPreview)}
                  className="flex items-center gap-2 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  onClick={() => deletePhoto(showPreview._id)}
                  disabled={deleting === showPreview._id}
                  className="flex items-center gap-2 px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded transition-colors"
                >
                  {deleting === showPreview._id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
