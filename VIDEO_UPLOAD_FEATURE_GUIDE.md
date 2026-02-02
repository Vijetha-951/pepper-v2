# Video Upload Feature - User Guide

## 🎉 New Feature: Direct Video File Upload

The admin dashboard now supports **uploading video files directly** from your computer, in addition to the existing YouTube/Vimeo URL functionality.

---

## 📋 What's New

### Upload Methods
You can now choose between two methods when adding videos:

1. **YouTube/Vimeo URL** (Previous method)
   - Paste YouTube, Vimeo, or other video platform URLs
   - Videos are embedded from external platforms
   - No storage required on your server

2. **Upload Video File** (NEW!)
   - Upload videos directly from your computer
   - Videos are stored on your server
   - Full control over video content
   - No dependency on external platforms

---

## 🚀 How to Use

### Accessing Video Management
1. Login as **admin** (vj.vijetha01@gmail.com)
2. Navigate to **Dashboard**
3. Click **"Video Management"** in the sidebar

### Adding a Video via File Upload

1. Click **"Add Video"** button
2. Fill in the **Title** (required)
3. Fill in the **Description** (required)
4. Select **"Upload Video File"** as the upload method
5. Click **"Choose File"** and select your video
   - Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV
   - Max file size: 500MB
6. Fill in optional fields:
   - **Thumbnail URL**: Image preview for the video
   - **Category**: farming, processing, cooking, benefits, testimonial, tutorial, other
   - **Duration**: e.g., "5:30" or "10 minutes"
   - **Tags**: Comma-separated keywords (e.g., "pepper, farming, organic")
7. Check **"Active"** to make the video visible to users
8. Click **"Upload Video"**

The upload progress will be displayed as the video is being uploaded.

### Adding a Video via URL (Previous Method)

1. Click **"Add Video"** button
2. Fill in the **Title** (required)
3. Fill in the **Description** (required)
4. Select **"YouTube/Vimeo URL"** as the upload method
5. Paste your video URL
   - YouTube URLs are automatically converted to embed format
   - Works with: youtube.com/watch, youtu.be/, youtube.com/embed/
6. Fill in other fields as needed
7. Click **"Add Video"**

---

## 💡 Key Features

### For Admins
- ✅ Choose between URL or file upload
- ✅ Upload videos up to 500MB
- ✅ Real-time upload progress indicator
- ✅ Automatic file type validation
- ✅ Support for multiple video formats
- ✅ Videos stored securely on server
- ✅ Easy management of all videos in one place

### For Users
- ✅ Seamless playback of both uploaded and URL-based videos
- ✅ Same user experience regardless of video source
- ✅ No difference in viewing experience
- ✅ Fast loading and playback

---

## 📁 Technical Details

### Backend Changes

#### New Dependencies
- **multer**: Handles multipart/form-data for file uploads

#### New Route
- **POST /api/videos/admin/upload**: Upload video files
  - Authentication required (admin only)
  - Accepts multipart/form-data
  - Returns video metadata and file info

#### File Storage
- Videos stored in: `backend/uploads/videos/`
- Filename format: `video-[timestamp]-[random].ext`
- Accessible via: `/uploads/videos/[filename]`

#### Server Configuration
- Added static file serving for `/uploads` directory
- Serves uploaded videos to authenticated users

### Frontend Changes

#### AdminVideoManagement Component
- Added upload method toggle (URL vs File)
- Added file input with validation
- Added upload progress indicator
- Enhanced form with dynamic field display
- Added file size and type validation

#### Dashboard Component
- Updated video player to handle both iframes and video elements
- Local videos use `<video>` tag
- URL videos use `<iframe>` tag
- Automatic detection based on URL path

---

## 🔒 Security Features

- ✅ Admin authentication required
- ✅ File type validation (only video formats allowed)
- ✅ File size limit (500MB max)
- ✅ Secure file storage with unique filenames
- ✅ Authorization check on every request

---

## 📊 Supported Video Formats

| Format | Extension | MIME Type |
|--------|-----------|-----------|
| MP4 | .mp4 | video/mp4 |
| AVI | .avi | video/x-msvideo |
| MOV | .mov | video/quicktime |
| WMV | .wmv | video/x-ms-wmv |
| FLV | .flv | video/x-flv |
| WebM | .webm | video/webm |
| MKV | .mkv | video/x-matroska |

---

## ⚙️ Configuration

### Adjusting File Size Limit

To change the maximum upload size, edit `backend/src/routes/videos.routes.js`:

```javascript
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // Change this value (in bytes)
  }
});
```

### Changing Upload Directory

To change where videos are stored, edit `backend/src/routes/videos.routes.js`:

```javascript
const uploadsDir = path.join(__dirname, '../../uploads/videos');
// Change to your preferred directory
```

---

## 🐛 Troubleshooting

### Upload Fails
- **Check file size**: Must be under 500MB
- **Check file format**: Only video formats are allowed
- **Check disk space**: Ensure server has enough storage
- **Check permissions**: Upload directory must be writable

### Video Won't Play
- **Check file format**: Browser may not support all formats (MP4 recommended)
- **Check file path**: Ensure video was uploaded successfully
- **Check browser console**: Look for error messages
- **Try different browser**: Some formats work better in certain browsers

### Progress Bar Stuck
- **Check network connection**: Ensure stable internet
- **Check server logs**: Backend may have encountered an error
- **Refresh page**: Sometimes progress tracking can get stuck
- **Try smaller file**: Large files may timeout

---

## 📝 Best Practices

### File Preparation
1. **Compress videos** before uploading to reduce file size
2. **Use MP4 format** for best browser compatibility
3. **Add meaningful filenames** for easy identification
4. **Test videos** before making them active

### Video Organization
1. **Use categories** to organize videos effectively
2. **Add descriptive titles** for better user experience
3. **Include relevant tags** for searchability
4. **Add thumbnails** for attractive previews

### Storage Management
1. **Monitor disk space** regularly
2. **Delete unused videos** to free up space
3. **Back up important videos** periodically
4. **Consider video compression** for long-term storage

---

## 📈 Future Enhancements

Potential improvements for future versions:
- [ ] Video thumbnail auto-generation
- [ ] Video transcoding for optimal formats
- [ ] Chunked uploads for large files
- [ ] Resume upload capability
- [ ] Drag-and-drop file upload
- [ ] Bulk video upload
- [ ] Video compression before upload
- [ ] Auto-detect video duration
- [ ] Video preview before upload

---

## 🎯 Quick Reference

### Upload Limits
- **Max file size**: 500MB
- **Supported formats**: MP4, AVI, MOV, WMV, FLV, WebM, MKV
- **Authentication**: Admin only

### API Endpoints
- **POST /api/videos/admin/upload**: Upload video file
- **POST /api/videos/admin/create**: Create video with URL
- **GET /api/videos/admin/all**: Get all videos
- **PUT /api/videos/admin/:id**: Update video
- **DELETE /api/videos/admin/:id**: Delete video

### Storage Location
- **Backend**: `backend/uploads/videos/`
- **URL path**: `/uploads/videos/[filename]`

---

## ✅ Testing Checklist

- [ ] Login as admin
- [ ] Access Video Management
- [ ] Select "Upload Video File" method
- [ ] Choose a video file
- [ ] Verify file size and format validation
- [ ] Upload video with all required fields
- [ ] Monitor upload progress
- [ ] Verify video appears in list
- [ ] Test video playback in user dashboard
- [ ] Test edit and delete functionality
- [ ] Test with different video formats

---

## 📞 Support

For issues or questions:
- Check this guide first
- Review browser console for errors
- Check server logs for backend errors
- Verify file permissions on server
- Contact system administrator if needed

---

## 🎉 Summary

The new video upload feature provides:
- **Flexibility**: Choose between URL or file upload
- **Control**: Host videos on your own server
- **Ease of use**: Simple upload process with progress tracking
- **Compatibility**: Support for multiple video formats
- **Security**: Admin-only access with validation

Happy uploading! 🎥
