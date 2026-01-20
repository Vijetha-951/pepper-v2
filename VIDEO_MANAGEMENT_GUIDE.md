# Video Management System - User Guide

## Overview
The PEPPER platform now includes a comprehensive video management system that allows admins to upload pepper-related videos and users to view them in their dashboard.

## Features Implemented

### 1. **User Dashboard - Videos Tab** 🎥
Users can now access educational and promotional videos about pepper farming, processing, cooking, and more.

#### Features:
- **Video Gallery**: Browse all available videos in a responsive grid layout
- **Category Filter**: Filter videos by category:
  - All Videos
  - Farming
  - Processing
  - Cooking
  - Health Benefits
  - Testimonials
  - Tutorials
  - Other
- **Video Player Modal**: Click on any video to watch it in a full-screen modal with embedded player
- **Video Information**: Each video displays:
  - Title and description
  - Category badge
  - View count
  - Like count
  - Duration
  - Tags
- **Like Feature**: Users can like videos to show appreciation
- **Real-time Stats**: View counts increment automatically when videos are played

### 2. **Admin Dashboard - Video Management** 👨‍💼

Admins have full control over video content through a dedicated management page.

#### Features:
- **Dashboard Statistics**:
  - Total Videos
  - Active Videos
  - Total Views
  - Total Likes

- **Video Management Table**:
  - View all videos with thumbnail previews
  - See video status (Active/Inactive)
  - Track views and likes per video
  - Quick action buttons for edit, delete, and toggle status

- **Add/Edit Videos**:
  - Title and description
  - Video URL (YouTube embed, Vimeo, etc.)
  - Thumbnail image URL
  - Category selection
  - Duration
  - Tags (comma-separated)
  - Active/Inactive status

- **Video Operations**:
  - Create new videos
  - Edit existing videos
  - Delete videos
  - Toggle active/inactive status
  - View real-time statistics

## Technical Implementation

### Backend Components

#### 1. **Video Model** (`backend/src/models/Video.model.js`)
```javascript
{
  title: String (required)
  description: String (required)
  url: String (required) // Embed URL
  thumbnail: String
  category: Enum [farming, processing, cooking, benefits, testimonial, tutorial, other]
  duration: String
  tags: [String]
  isActive: Boolean (default: true)
  viewCount: Number (default: 0)
  likes: Number (default: 0)
  uploadedBy: String (ref: User)
  timestamps: true
}
```

#### 2. **Video Routes** (`backend/src/routes/videos.routes.js`)

**User Routes** (Authenticated):
- `GET /api/videos` - Get all active videos (with optional category filter)
- `GET /api/videos/:id` - Get single video and increment view count
- `POST /api/videos/:id/like` - Like a video
- `GET /api/videos/categories/list` - Get all categories

**Admin Routes** (Admin only):
- `GET /api/videos/admin/all` - Get all videos (including inactive)
- `POST /api/videos/admin/create` - Create new video
- `PUT /api/videos/admin/:id` - Update video
- `DELETE /api/videos/admin/:id` - Delete video
- `GET /api/videos/admin/stats` - Get video statistics

### Frontend Components

#### 1. **User Dashboard** (`frontend/src/pages/Dashboard.jsx`)
- New "Videos" tab in navigation menu
- Video gallery with grid layout
- Category filter dropdown
- Video cards with thumbnails and play icons
- Video modal player with full details
- Like functionality

#### 2. **Admin Video Management** (`frontend/src/pages/AdminVideoManagement.jsx`)
- Full CRUD interface for videos
- Statistics dashboard
- Modal form for creating/editing videos
- Table view with action buttons
- Real-time updates

## Usage Instructions

### For Users:

1. **Access Videos**:
   - Login to your account
   - Navigate to Dashboard
   - Click on "Videos" tab in the sidebar

2. **Browse Videos**:
   - Use category filter to find specific types of videos
   - Scroll through the video grid
   - View count, likes, and duration on each card

3. **Watch Videos**:
   - Click on any video card
   - Video opens in full-screen modal
   - Player supports YouTube, Vimeo, and other embed URLs
   - View full description and tags

4. **Like Videos**:
   - Click "Like this video" button in video modal
   - Like count updates immediately

### For Admins:

1. **Access Video Management**:
   - Login as admin
   - Navigate to Dashboard
   - Click on "Video Management" in sidebar
   - OR navigate to `/admin-videos`

2. **View Statistics**:
   - Dashboard shows overview cards:
     - Total videos in system
     - Active videos
     - Total views across all videos
     - Total likes

3. **Add New Video**:
   - Click "Add Video" button
   - Fill in the form:
     - **Title**: Video title (required)
     - **Description**: Detailed description (required)
     - **Video URL**: YouTube embed URL or other video platform (required)
       - For YouTube: `https://www.youtube.com/embed/VIDEO_ID`
       - For Vimeo: `https://player.vimeo.com/video/VIDEO_ID`
     - **Thumbnail**: Image URL for video preview
     - **Category**: Select appropriate category
     - **Duration**: e.g., "5:30" or "10 minutes"
     - **Tags**: Comma-separated tags
     - **Active**: Check to make video visible to users
   - Click "Add Video"

4. **Edit Video**:
   - Click Edit icon (pencil) on any video row
   - Modify fields as needed
   - Click "Update Video"

5. **Toggle Video Status**:
   - Click Eye icon to activate/deactivate video
   - Inactive videos won't appear in user dashboard

6. **Delete Video**:
   - Click Delete icon (trash)
   - Confirm deletion
   - Video is permanently removed

## Video URL Formats

### YouTube:
- **Regular URL**: `https://www.youtube.com/watch?v=VIDEO_ID`
- **Embed URL** (use this): `https://www.youtube.com/embed/VIDEO_ID`
- **How to get Video ID**: It's the part after `watch?v=` in YouTube URL

### Vimeo:
- **Regular URL**: `https://vimeo.com/VIDEO_ID`
- **Embed URL** (use this): `https://player.vimeo.com/video/VIDEO_ID`

### Tips:
- Always use embed URLs for video player
- Ensure videos are set to public/embeddable
- Add high-quality thumbnail images for better appearance
- Use descriptive titles and tags for better searchability

## API Endpoints Reference

### User Endpoints

```http
GET /api/videos?category=farming
Authorization: Bearer <token>
```
Returns filtered list of active videos.

```http
GET /api/videos/:videoId
Authorization: Bearer <token>
```
Returns video details and increments view count.

```http
POST /api/videos/:videoId/like
Authorization: Bearer <token>
```
Increments like count for video.

### Admin Endpoints

```http
GET /api/videos/admin/all
Authorization: Bearer <admin_token>
```
Returns all videos including inactive ones.

```http
POST /api/videos/admin/create
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "How to Grow Pepper",
  "description": "Complete guide to pepper farming",
  "url": "https://www.youtube.com/embed/VIDEO_ID",
  "thumbnail": "https://example.com/thumb.jpg",
  "category": "farming",
  "duration": "10:30",
  "tags": ["farming", "pepper", "tutorial"],
  "isActive": true
}
```

```http
PUT /api/videos/admin/:videoId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "isActive": false
}
```

```http
DELETE /api/videos/admin/:videoId
Authorization: Bearer <admin_token>
```

```http
GET /api/videos/admin/stats
Authorization: Bearer <admin_token>
```
Returns comprehensive video statistics.

## Database Indexes

The Video model includes optimized indexes for:
- `isActive` + `createdAt` (for efficient active video queries)
- `category` (for category filtering)
- `tags` (for tag-based searches)

## Security

- All video endpoints require authentication
- Admin endpoints require admin role verification
- Video URLs are validated before storage
- No file uploads - only URL references (secure and scalable)

## Future Enhancements

Potential improvements for future versions:
- Video comments system
- Video playlists
- User upload capability (with moderation)
- Advanced search with full-text indexing
- Video analytics (watch time, completion rate)
- Video recommendations based on viewing history
- Share functionality
- Download options for premium users
- Subtitles/captions support
- Multiple language support

## Files Created/Modified

### Backend:
- `backend/src/models/Video.model.js` (new)
- `backend/src/routes/videos.routes.js` (new)
- `backend/src/server.js` (modified - added video routes)

### Frontend:
- `frontend/src/pages/AdminVideoManagement.jsx` (new)
- `frontend/src/pages/AdminVideoManagement.css` (new)
- `frontend/src/pages/Dashboard.jsx` (modified - added videos tab)
- `frontend/src/App.jsx` (modified - added admin video route)

## Troubleshooting

### Videos not loading:
- Check if user is authenticated
- Verify video isActive status
- Check browser console for errors
- Ensure video URL is correctly formatted

### Embed player not working:
- Verify video URL is embed format (not watch URL)
- Check if video is set to public/embeddable
- Test video URL directly in browser

### Admin can't create videos:
- Verify admin role is correctly set
- Check authentication token
- Ensure all required fields are filled

## Support

For issues or questions, contact the development team or check the application logs for detailed error messages.

---

**Version**: 1.0  
**Last Updated**: January 20, 2026  
**Author**: PEPPER Development Team
