# Quick Start: Adding Your First Videos

## Step-by-Step Guide for Admins

### 1. Access Admin Video Management

1. Login as **admin**
2. Go to **Dashboard**
3. Click **"Video Management"** in the sidebar menu

### 2. Add Sample Videos

Here are some sample video configurations you can use to get started:

#### Video 1: Introduction to Pepper Farming
```
Title: Introduction to Pepper Farming
Description: Learn the basics of pepper cultivation from seed to harvest. This comprehensive guide covers soil preparation, planting techniques, and care requirements for healthy pepper plants.
Video URL: https://www.youtube.com/embed/dQw4w9WgXcQ (Replace with your actual video)
Thumbnail: https://via.placeholder.com/640x360/10b981/ffffff?text=Pepper+Farming
Category: Farming
Duration: 8:45
Tags: pepper, farming, agriculture, cultivation
Status: ✓ Active
```

#### Video 2: Processing Fresh Pepper
```
Title: How to Process and Store Fresh Pepper
Description: Professional techniques for processing freshly harvested pepper to maintain quality and extend shelf life. Includes cleaning, drying, and storage methods.
Video URL: https://www.youtube.com/embed/dQw4w9WgXcQ (Replace with your actual video)
Thumbnail: https://via.placeholder.com/640x360/059669/ffffff?text=Processing
Category: Processing
Duration: 5:30
Tags: processing, storage, preservation
Status: ✓ Active
```

#### Video 3: Cooking with Pepper
```
Title: 5 Amazing Recipes Using Fresh Pepper
Description: Discover delicious recipes that showcase the flavor of fresh pepper. From traditional dishes to modern cuisine, learn how to make the most of your pepper harvest.
Video URL: https://www.youtube.com/embed/dQw4w9WgXcQ (Replace with your actual video)
Thumbnail: https://via.placeholder.com/640x360/f59e0b/ffffff?text=Cooking
Category: Cooking
Duration: 12:20
Tags: recipes, cooking, culinary, food
Status: ✓ Active
```

#### Video 4: Health Benefits of Pepper
```
Title: Health Benefits of Fresh Pepper
Description: Explore the nutritional value and health benefits of pepper. Learn about antioxidants, vitamins, and how pepper can boost your immune system.
Video URL: https://www.youtube.com/embed/dQw4w9WgXcQ (Replace with your actual video)
Thumbnail: https://via.placeholder.com/640x360/ef4444/ffffff?text=Health+Benefits
Category: Health Benefits
Duration: 6:15
Tags: health, nutrition, benefits, wellness
Status: ✓ Active
```

#### Video 5: Customer Success Story
```
Title: Success Story: How I Built My Pepper Farm
Description: Hear from a successful pepper farmer about their journey, challenges, and tips for newcomers. Real-world insights and practical advice.
Video URL: https://www.youtube.com/embed/dQw4w9WgXcQ (Replace with your actual video)
Thumbnail: https://via.placeholder.com/640x360/8b5cf6/ffffff?text=Testimonial
Category: Testimonial
Duration: 10:00
Tags: testimonial, success, story, inspiration
Status: ✓ Active
```

### 3. How to Get YouTube Embed URLs

#### Method 1: Convert Watch URL
1. Find your YouTube video: `https://www.youtube.com/watch?v=VIDEO_ID`
2. Replace `/watch?v=` with `/embed/`
3. Result: `https://www.youtube.com/embed/VIDEO_ID`

#### Method 2: From YouTube Share
1. Click "Share" button under YouTube video
2. Click "Embed"
3. Copy the URL from `src="..."` attribute
4. Example: `https://www.youtube.com/embed/VIDEO_ID`

### 4. Adding Videos via Form

1. Click **"Add Video"** button
2. Fill in all fields:
   - **Title**: Clear, descriptive title
   - **Description**: Detailed explanation (2-3 sentences)
   - **Video URL**: Use embed format (see above)
   - **Thumbnail**: Optional image URL (use placeholders if needed)
   - **Category**: Choose from dropdown
   - **Duration**: Format like "5:30" or "10 minutes"
   - **Tags**: Comma-separated keywords
   - **Active**: Check this box to make video visible
3. Click **"Add Video"**

### 5. Verify Videos in User Dashboard

1. Logout from admin account
2. Login as a regular user
3. Go to Dashboard
4. Click **"Videos"** tab
5. You should see all active videos
6. Test video playback and like functionality

## Sample Curl Commands (For Testing)

### Get All Videos (User)
```bash
curl -X GET http://localhost:5000/api/videos \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### Create Video (Admin)
```bash
curl -X POST http://localhost:5000/api/videos/admin/create \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Pepper Farming",
    "description": "Learn the basics of pepper cultivation",
    "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "thumbnail": "https://via.placeholder.com/640x360",
    "category": "farming",
    "duration": "8:45",
    "tags": ["pepper", "farming", "agriculture"],
    "isActive": true
  }'
```

### Get Video Stats (Admin)
```bash
curl -X GET http://localhost:5000/api/videos/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Tips for Success

### Content Strategy
1. **Mix Categories**: Add videos from different categories to cater to all user interests
2. **Update Regularly**: Keep content fresh with new videos monthly
3. **Quality Over Quantity**: Better to have 10 great videos than 50 mediocre ones
4. **Professional Thumbnails**: Use high-quality images for better engagement

### Technical Tips
1. **Test Embeds**: Always test video URLs before saving
2. **Optimize Thumbnails**: Use 16:9 aspect ratio (640x360 or 1280x720)
3. **Consistent Durations**: Format durations consistently (MM:SS or "X minutes")
4. **Relevant Tags**: Use 3-5 descriptive tags per video

### Engagement Tips
1. **Call to Action**: Mention videos in user communications
2. **Monitor Stats**: Check view counts to see what users like
3. **Seasonal Content**: Add content relevant to current farming seasons
4. **User Feedback**: Pay attention to which categories get most views

## Common Issues and Solutions

### Issue: Video won't embed
**Solution**: 
- Check if video is set to "Public" or "Unlisted" (not "Private")
- Verify video allows embedding in settings
- Use correct embed URL format

### Issue: Thumbnail not showing
**Solution**:
- Verify URL is accessible
- Use HTTPS URLs
- Check image dimensions (16:9 ratio works best)
- Leave blank to use default gradient

### Issue: Video not appearing for users
**Solution**:
- Check "Active" checkbox is enabled
- Verify video was saved successfully
- Refresh user dashboard
- Check browser console for errors

## Next Steps

1. **Add Real Content**: Replace sample URLs with actual pepper-related videos
2. **Organize by Journey**: Create a content progression for new farmers
3. **Promote Videos**: Mention in newsletters and notifications
4. **Gather Feedback**: Ask users what videos they'd like to see
5. **Analytics**: Track which videos get most engagement

## Video Content Ideas

### For Farmers:
- Seasonal planting guides
- Pest control methods
- Irrigation techniques
- Harvesting best practices
- Equipment reviews

### For Customers:
- Recipe tutorials
- Nutritional information
- Storage tips
- Pairing suggestions
- Behind-the-scenes farm tours

### For Business:
- Product showcase
- Quality assurance process
- Company story/mission
- Meet the team
- Customer testimonials

---

**Ready to start?** Follow the steps above and have your video library up and running in minutes!

For more detailed information, see [VIDEO_MANAGEMENT_GUIDE.md](./VIDEO_MANAGEMENT_GUIDE.md)
