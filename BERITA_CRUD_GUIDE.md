# 📰 Berita CRUD System - Documentation

## Overview
Complete bilingual (Indonesia & English) CRUD system for managing news/articles without Next.js. Positioned below the Gelombang section in the admin panel.

## ✨ Features
- ✅ **Bilingual Support**: Full Indonesia & English translations
- ✅ **CRUD Operations**: Create, Read, Update, Delete
- ✅ **Publish Control**: Draft/Published status toggle
- ✅ **Image Support**: Optional image URL field
- ✅ **Ordering**: Drag-and-drop reordering with up/down buttons
- ✅ **Validation**: Required fields for both languages
- ✅ **Responsive**: Mobile-friendly admin interface

## 📁 Files Created/Modified

### 1. Database Schema
**File**: `sql/create_table_berita.sql`
- Creates `berita` table with bilingual fields
- Includes RLS policies for public/admin access
- Auto-generated order_index
- Sample data included

**Table Structure**:
```sql
CREATE TABLE berita (
    id BIGSERIAL PRIMARY KEY,
    title_id TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_id TEXT NOT NULL,
    content_en TEXT NOT NULL,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Backend Handler
**File**: `lib/handlers/berita_items.py`
- Full CRUD operations (GET, POST, PUT, DELETE)
- Supports bulk reordering
- Public vs Admin client separation
- Comprehensive error handling

**API Endpoints**:
- `GET /api/berita_items` - List all berita (admin) or published only (public)
- `POST /api/berita_items` - Create new berita
- `PUT /api/berita_items` - Update berita or bulk reorder
- `DELETE /api/berita_items` - Delete berita

### 3. API Routing
**File**: `api/index.py`
- Added `berita_items` action routing
- Supports all HTTP methods (GET, POST, PUT, DELETE, OPTIONS)

### 4. Admin UI
**File**: `public/admin.html`
- Added "Berita" menu item (with newspaper icon)
- Complete bilingual form with language switcher
- Table view with status badges
- Edit/Delete/Reorder controls
- Positioned between "Gelombang" and "Hero Slider"

**Form Fields**:
- Judul/Title (ID & EN)
- Konten/Content (ID & EN) - textarea
- Image URL (optional)
- Published status (checkbox)
- Auto-generated order

### 5. JavaScript Handlers
**File**: `public/assets/js/admin.js`
- Added complete berita management functions:
  - `loadBeritaItems()` - Load and render list
  - `editBeritaItem(id)` - Edit existing item
  - `deleteBeritaItem(id)` - Delete with confirmation
  - `moveBeritaItem(id, direction)` - Reorder items
  - `handleBeritaSubmit()` - Form submission
  - `setupBeritaLangSwitch()` - Language switcher
  - `setupBeritaFormHandlers()` - Event listeners
- Integrated with switchTab() for lazy loading
- Added to DOMContentLoaded initialization

### 6. Localization
**Files**: `public/locales/id.json`, `public/locales/en.json`
- Added `sections.berita` object with translations:
  - title, subtitle, loading, empty, readMore, publishedDate

### 7. Frontend Display (Homepage)
**File**: `public/index.html`
- Added "Berita & Artikel" section below Gelombang
- Shows up to 6 latest published news
- Responsive card layout (1 column mobile, 2 tablet, 3 desktop)
- Bilingual support (auto-switches based on language)
- Features:
  - Image with hover zoom effect
  - Title truncation (2 lines max)
  - Content excerpt (3 lines max, 150 chars)
  - Publication date
  - "Read More" link
  - Fallback image if none provided
  - Empty state message if no published news

**JavaScript Functions**:
- `loadBeritaPublished()` - Fetches and renders published news
- Auto-loads on page load
- Re-renders on language change
- Uses `published_only=true` query parameter to get only published items

## 🚀 Setup Instructions

### Step 1: Run Database Migration
```bash
# Connect to your Supabase database and run:
psql -h <your-supabase-host> -U postgres -d postgres -f sql/create_table_berita.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `sql/create_table_berita.sql`
3. Run the query

### Step 2: Verify API Routing
The API routes are already configured in `api/index.py`. No action needed.

### Step 3: Deploy to Vercel
```bash
# Commit changes
git add .
git commit -m "feat: Add bilingual berita CRUD system"
git push origin main

# Vercel will auto-deploy
```

### Step 4: Access Admin Panel
1. Navigate to `/admin.html`
2. Login with admin credentials
3. Click "Berita" in the sidebar (below "Kelola Gelombang")

## 📖 Usage Guide

### Creating News
1. Go to Admin Panel → Berita
2. Fill in "Judul" (Indonesia) and switch to English tab
3. Fill in "Title" (English)
4. Add content in both languages
5. (Optional) Add image URL
6. Check "Publikasikan berita" to make it public
7. Click "Simpan Berita"

### Editing News
1. Click "Edit" button on any berita row
2. Form will populate with existing data
3. Modify as needed
4. Click "Update Berita"

### Reordering News
- Use ↑ (up) or ↓ (down) arrows in the "Urutan" column
- Order changes save automatically
- Reordering doesn't require form submission

### Deleting News
1. Click "Delete" button (trash icon)
2. Confirm deletion in dialog
3. Berita is permanently removed

### Publishing/Unpublishing
- Edit the berita
- Toggle "Publikasikan berita" checkbox
- Save changes
- **Published news will automatically appear on homepage**

## 🎨 Frontend Features (Homepage)

### Berita Section Display
The homepage (`index.html`) shows published news in a beautiful card layout:

1. **Auto-Load**: News loads automatically on page load
2. **Bilingual**: Shows correct language based on user selection
3. **Responsive**: 
   - Mobile: 1 column
   - Tablet: 2 columns
   - Desktop: 3 columns
4. **Card Features**:
   - Featured image (with fallback)
   - Title (max 2 lines)
   - Content excerpt (max 3 lines / 150 chars)
   - Publication date
   - Hover effects (zoom image, color transition)
5. **Max Display**: Shows 6 latest published news
6. **Empty State**: Friendly message when no news available

### How It Works
```javascript
// Fetches only published news
GET /api/berita_items?published_only=true

// Backend returns only is_published=true items
// Frontend renders based on current language (ID/EN)
```

## 🔒 Security

### Row Level Security (RLS)
- **Public**: Can only view `is_published = true` berita
- **Admin**: Full CRUD access via service_role

### Validation
- Both language versions are required
- Server-side validation in Python
- Client-side validation in JavaScript

## 🎨 UI Features

### Language Switcher
- 🇮🇩 Indonesia / 🇬🇧 English toggle buttons
- Green highlight for active language
- Switches between form panes

### Status Badges
- **Published**: Green badge
- **Draft**: Gray badge

### Table Features
- Responsive design (mobile-optimized)
- Order number display
- Image indicator if present
- Bilingual title preview

## 🧪 Testing

### Test Cases
1. **Create**: Add new berita with both languages ✅
2. **Read**: View list of berita ✅
3. **Update**: Edit existing berita ✅
4. **Delete**: Remove berita with confirmation ✅
5. **Reorder**: Move items up/down ✅
6. **Publish Toggle**: Draft ↔ Published ✅
7. **Validation**: Submit without required fields ✅

### API Testing
```bash
# List all berita (admin)
curl -X GET https://your-domain.vercel.app/api/berita_items

# List published only (public)
curl -X GET https://your-domain.vercel.app/api/berita_items?published_only=true

# Create berita
curl -X POST https://your-domain.vercel.app/api/berita_items \
  -H "Content-Type: application/json" \
  -d '{
    "title_id": "Judul Berita",
    "title_en": "News Title",
    "content_id": "Konten berita...",
    "content_en": "News content...",
    "is_published": true
  }'
```

## 📝 Sample Data
The SQL migration includes 3 sample berita entries:
1. Selamat Datang Santri Baru 2026
2. Kegiatan Tahfidz Al-Qur'an
3. Prestasi Santri di Lomba Tahfidz Regional

## 🐛 Troubleshooting

### "Berita" tab not showing
- Clear browser cache (Ctrl+Shift+R)
- Verify `admin.html` was updated
- Check browser console for JS errors

### API returns 404
- Verify `api/index.py` includes berita_items routing
- Check Vercel deployment logs
- Ensure Python handler file exists

### Database errors
- Verify `berita` table exists in Supabase
- Check RLS policies are enabled
- Ensure service_role key is correct

### Form validation failing
- Check browser console for error messages
- Verify both ID and EN fields are filled
- Ensure textarea content is not empty

## 🔄 Future Enhancements
- [ ] Rich text editor (Quill/TinyMCE)
- [ ] Image upload (Supabase Storage integration)
- [ ] Category/Tags system
- [ ] Search and filter
- [x] ✅ Frontend news display on homepage
- [ ] Dedicated news detail page (modal or separate page)
- [ ] Pagination for large datasets (admin & frontend)
- [ ] Draft auto-save
- [ ] Scheduled publishing
- [ ] Share buttons (WhatsApp, Facebook, Twitter)
- [ ] Read more/less toggle for long content

## 📞 Support
For issues or questions:
1. Check browser console for errors
2. Review Vercel deployment logs
3. Verify Supabase table and policies
4. Test API endpoints directly

---

**Created**: 2025-11-05  
**Version**: 1.0.0  
**Tech Stack**: Python (Vercel Serverless), Supabase, Vanilla JS, Bootstrap 5

