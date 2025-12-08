# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WePick** is a community frontend application transitioning from a traditional CRUD-based bulletin board to a daily choice-based engagement platform. The core feature allows users to make daily binary choices (A vs B), view results, and participate in side-based chat discussions.

**Tech Stack:**

- Express.js (MPA - Multi-Page Application)
- Vanilla JavaScript (ES6 modules)
- Bootstrap 5.3.8 (currently being phased out for new features)
- Backend API: `https://api.wepick.cloud/api`

## Development Commands

```bash
# Start development server
npm start                    # Runs on http://localhost:3000

# Run tests
npm test                     # Run all Jest tests

# Production deployment (Docker)
docker-compose -f docker/prod/docker-compose.yml up -d
docker-compose -f docker/dev/docker-compose.yml up -d
```

## Task Tracking

**IMPORTANT:** When working on tasks, you MUST check and update `docs/tasks.md`:

1. **Before starting work:** Read `docs/tasks.md` to understand current progress
2. **While working:** Update task status as you complete items
3. **After completing work:** Mark tasks as done and add any new tasks discovered

This ensures progress is tracked and visible across sessions.

## Architecture Overview

### 1. Express Server Structure

**Entry Point:** `app.js`

- Serves static files from `public/` and `assets/`
- Routes defined in `routes/` directory serve HTML pages
- Express routes are VIEW routes (return HTML), NOT API routes
- Actual API calls go to external backend at `https://api.wepick.cloud/api`

**Critical Pattern:**

```javascript
// routes/posts.js - Serves HTML pages
router.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "pages", "posts", "post-list.html")
  );
});

// Frontend JavaScript makes API calls
import { apiRequest } from "/js/api/base.js";
const { data, error } = await apiRequest("/posts"); // Goes to api.wepick.cloud
```

### 2. Frontend Module Architecture

**Critical Files:**

- `public/js/config.js` - Centralized configuration (API URL, routes, navigation, image upload settings)
- `public/js/api/base.js` - Base API request handler with error handling, auth redirects, loading indicators
- `public/js/api/images.js` - Image upload API (Presigned URL pattern, uses config for validation)
- `public/js/api/users.js` - User management API (separated endpoints)
- `public/js/api/posts.js` - Post CRUD API
- `public/js/api/topics.js` - WePick topics API (voting, results)
- `public/js/utils/auth.js` - Authentication utilities (HTTP-only cookie based)
- `public/js/utils/component-loader.js` - Centralized header/footer loader (eliminates code duplication)
- `public/js/utils/ui-helpers.js` - **NEW:** UI utilities (error/success messages, button loading, form controller)

**API Module Pattern:**
All API calls use the base module for consistency:

```javascript
// public/js/api/base.js handles:
// - Automatic auth token (via credentials: 'include')
// - 401 redirects to login
// - Loading indicators
// - Consistent error handling
// - Backend response format: { message, data, error }

import { apiRequest } from "./base.js";

export async function getPosts() {
  return await apiRequest("/posts"); // Returns { data, error, status }
}
```

**Users API (Separated Endpoints):**

```javascript
import { UsersAPI } from "/js/api/users.js";

// Each user update operation has its own endpoint:
await UsersAPI.updateProfileImage({ profileImageId: 12 });
await UsersAPI.updateNickname({ nickname: "newname" });
await UsersAPI.updatePassword({
  oldPassword: "current",
  newPassword: "new",
  newPassword2: "new"
});
```

**Images API:**

```javascript
import { ImagesAPI } from "/js/api/images.js";

// Profile image (single)
const { imageId, error } = await ImagesAPI.uploadProfileImage(file);

// Post images (multiple)
const { imageIds, errors } = await ImagesAPI.uploadMultiplePostImages([file1, file2]);
```

**Component System:**
Components are loaded dynamically:

```javascript
// NEW: Use centralized component loader (RECOMMENDED)
import { loadHeader, loadFooter } from "/js/utils/component-loader.js";

await loadHeader();
await loadFooter();

// Or load both at once
import { loadComponents } from "/js/utils/component-loader.js";
await loadComponents();

// Initialize header auth state
import { initHeaderAuth } from "/js/utils/header-init.js";
const user = await initHeaderAuth();
```

**Component Loader Benefits:**
- Eliminates code duplication across 7+ page files
- Consistent error handling
- Single source of truth for header/footer loading
- Easier to maintain and update

### 3. Authentication Flow

**Important:** Authentication uses HTTP-only cookies, NOT localStorage tokens.

```javascript
// Action-based auth (not page-based)
// Pages are accessible without login, but ACTIONS require auth:
// - Voting button click → requires login
// - Comment submit → requires login
// - Post create/edit pages → require login on entry

// public/js/utils/auth.js
auth.getAuthUser(); // Check if logged in (lightweight)
auth.requireAuth(); // Enforce login (redirects if not logged in)
auth.clear(); // Clear auth state
```

**Redirect Pattern:**

```javascript
// Redirects preserve intended destination
/users/signin?redirect=/today&action=vote
// After login, returns to /today
```

### 4. New Feature Development Guidelines (PRD v0.5)

**Bootstrap Migration:**

- **DO NOT** add new Bootstrap classes to new features
- Use `public/css/custom.css` with design tokens (CSS variables)
- Existing pages (posts, users) still use Bootstrap until migrated

**UI Feedback:**

- **NO MODALS** for new features - use toast notifications and inline messages
- Import toast: `import { Toast } from '/js/components/toast.js';`
- Import modal (for existing features only): `import { Modal } from '/js/components/modal.js';`

**API Integration Strategy:**

- Check `public/js/api/*.js` for existing API functions FIRST
- If API doesn't exist yet: Build UI with mock data + add `// TODO: API 연동` comment
- Prepare function structure for future integration (e.g., `fetchTodayTopic()`)

**CSS Animation vs Image Assets:**

- Simple effects (hover, glow, progress bars) → CSS animations
- Complex effects (particles, 3D, frame-by-frame) → Use images/video/Lottie from `docs/webdesign/`
- Rule of thumb: "If it takes more than a day to implement in CSS, use an asset"

### 5. Page Structure & Routing

**Current Routes (Legacy - Community):**

```
/community/posts         → Post list (alias: /posts)
/community/posts/create  → Create post (auth required)
/community/posts/:id     → Post detail
/community/posts/edit/:id → Edit post (auth required)
/users/signin            → Login
/users/signup            → Signup
/users/mypage            → Mypage (auth required) - centralized user settings
/users/edit/profile-img  → Change profile image (auth required)
/users/edit/nickname     → Change nickname (auth required)
/users/edit/password     → Change password (auth required)
```

**New Routes (WePick Core):**

```
/                        → Landing page (public/pages/wepick/landing.html)
/today                   → Today's choice/result (dynamic UI based on vote status) ✅ Implemented
/topics                  → Topic history list 🚧 Coming Soon
/topics/:topicId         → Topic detail (results) 🚧 Coming Soon
/topics/:topicId/chat    → Topic chat (side-based) 🚧 Coming Soon
/coming-soon             → Under construction page (for unimplemented features)
```

**Policy & Error Routes:**

```
/policy/terms            → Terms of Service
/policy/privacy          → Privacy Policy
/404                     → 404 Not Found page
```

**Logical URL Mapping:**
The PRD specifies `/community` URLs, but actual files are in `public/pages/posts/`:

- Logical: `/community` → File: `public/pages/posts/post-list.html`
- This allows UX consistency while maintaining existing file structure

### 6. `/today` Page - Critical Implementation

**Dynamic UI Pattern:**
The `/today` page shows different UIs based on user's vote status WITHOUT page navigation:

```javascript
// ONE page, TWO states
// State 1: Not voted → Show A/B choice cards + vote buttons
// State 2: Voted → Show results (percentage bars) + "의견 공유하기" button

// On vote success:
// - NO page redirect
// - Same URL (/today)
// - JavaScript switches UI: voting → results
// - Results show percentage animation
// - "의견 공유하기" button → navigates to /topics/:topicId/chat
```

**Page Load Logic:**

```javascript
// Pseudocode for /today page
async function initTodayPage() {
  const topic = await fetchTodayTopic();
  const hasVoted = await checkUserVote(topic.id);

  if (hasVoted) {
    showResultsUI(topic); // Show percentage + share button
  } else {
    showVotingUI(topic); // Show A/B cards + vote buttons
  }
}

async function handleVote(choice) {
  if (!auth.getAuthUser()) {
    // Redirect to login with return path
    window.location.href = "/users/signin?redirect=/today&action=vote";
    return;
  }

  const result = await submitVote(topicId, choice);
  if (result.error) return;

  // Switch UI without page reload
  showResultsUI(result.data);
}
```

### 7. File Organization

```
public/
├── components/           # Reusable HTML templates
│   ├── header.html      # Global header component
│   ├── footer.html      # Global footer component (hidden on mobile)
│   ├── modal-template.html
│   └── toast-template.html
├── css/
│   ├── custom.css       # Design tokens, global styles (Bootstrap-free)
│   ├── components/      # Component-specific styles
│   │   ├── header.css
│   │   ├── footer.css   # Responsive: hidden below 1024px
│   │   └── gauge-bar.css
│   └── pages/           # Page-specific styles
│       ├── users/
│       │   └── mypage.css  # NEW: Vertical menu list layout
│       ├── wepick/
│       │   └── today.css
│       └── error/
│           ├── 404.css
│           └── coming-soon.css  # NEW: Under construction page
├── js/
│   ├── config.js        # Centralized config (API URL, routes, constants)
│   ├── api/
│   │   ├── base.js      # Base API handler (USE THIS for all API calls)
│   │   ├── posts.js     # Post-related API functions
│   │   ├── users.js     # User-related API functions
│   │   ├── topics.js    # WePick topics API ✅ Implemented
│   │   └── images.js    # Image upload API (Presigned URL)
│   ├── components/      # Component initialization scripts
│   │   ├── gauge-bar.js
│   │   ├── modal.js
│   │   └── toast.js
│   ├── pages/           # Page-specific JavaScript
│   │   ├── users/
│   │   │   ├── mypage.js         # NEW: Mypage with sidebar navigation
│   │   │   ├── editNickname.js
│   │   │   ├── editPassword.js
│   │   │   └── editProfileImg.js
│   │   ├── posts/
│   │   │   ├── list.js
│   │   │   ├── detail.js
│   │   │   ├── create.js
│   │   │   └── edit.js
│   │   └── today.js     # WePick today page ✅ Implemented
│   ├── utils/           # Utilities
│   │   ├── auth.js
│   │   ├── component-loader.js  # NEW: Centralized header/footer loader
│   │   ├── header-init.js       # Header auth initialization
│   │   ├── validation.js
│   │   ├── image-upload.js
│   │   └── navigation.js
│   └── ui/              # UI utilities
└── pages/
    ├── posts/           # Community/bulletin board pages (Bootstrap-based)
    │   ├── post-list.html
    │   ├── post-detail.html
    │   ├── post-create.html
    │   └── post-edit.html
    ├── users/           # User account pages
    │   ├── mypage.html              # NEW: Centralized user settings
    │   ├── user-signin.html
    │   ├── user-signup.html
    │   ├── user-edit-nickname.html
    │   ├── user-edit-password.html
    │   └── user-edit-profile-img.html
    ├── wepick/          # WePick core feature pages (Bootstrap-free)
    │   ├── landing.html
    │   └── today-choice.html  ✅ Implemented
    ├── error/           # Error pages
    │   ├── 404.html
    │   └── coming-soon.html   # NEW: Under construction page
    └── policy/          # Policy pages
        ├── terms.html
        └── privacy.html

routes/                  # Express routes (serve HTML pages, NOT API)
├── posts.js
├── users.js
├── wepick.js            # WePick core routes
└── policy.js

assets/
└── imgs/                # Static images
    ├── wepick-logo-64.png   # Favicon (used across all pages)
    ├── wepick-logo-128.png
    ├── wepick-logo-196.png
    └── profile_icon.svg

docs/
└── webdesign/           # Design assets (images from Gemini designer)
    ├── landing.png
    ├── today-choice.png
    └── ...
```

### 8. Testing

```bash
npm test                 # Run all tests

# Test structure
tests/
├── app.test.js          # Server tests
└── components/          # Component tests
```

## Key Development Patterns

### Making API Calls

```javascript
// ALWAYS use base.js for API calls
import { apiRequest } from "/js/api/base.js";

// GET request
const { data, error, status } = await apiRequest("/posts");

// POST request
const { data, error } = await apiRequest("/posts", {
  method: "POST",
  body: JSON.stringify({ title, content }),
});

// Skip auth redirect (for login/signup pages)
const { data, error } = await apiRequest("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
  skipAuthRedirect: true, // Don't redirect on 401
});

// Backend response format
// Success: { message: "성공", data: {...}, error: null }
// Failure: { message: "실패", data: null, error: { reason: "..." } }
```

### Image Upload Pattern (Presigned URL)

**IMPORTANT:** All image uploads use AWS S3 Presigned URLs for direct client-to-S3 upload.

#### Single Image Upload (Profile Images)

```javascript
import { ImagesAPI } from "/js/api/images.js";

// Upload profile image
const result = await ImagesAPI.uploadProfileImage(file);

if (result.error) {
  console.error('Upload failed:', result.error);
} else {
  const imageId = result.imageId;
  // Use imageId in user profile update
  await UsersAPI.updateProfileImage({ profileImageId: imageId });
}
```

**Flow:**
1. Client validates file (type, size)
2. Request presigned URL: `POST /images/profile/presigned-url`
   - Body: `{ originalFilename: "photo.jpg" }`
   - Response: `{ presignedUrl, key, imageId }`
3. Upload to S3: `PUT presignedUrl` with file
4. Use `imageId` in API calls

#### Multiple Image Upload (Post Images)

```javascript
import { ImagesAPI } from "/js/api/images.js";

// Upload multiple post images at once
const files = [file1, file2, file3];
const result = await ImagesAPI.uploadMultiplePostImages(files);

// result.imageIds: [12, 13, 14] - successfully uploaded image IDs
// result.errors: [{ file: "bad.jpg", error: "..." }] - failed uploads

if (result.imageIds.length > 0) {
  // Create post with images
  await PostsAPI.create({
    title,
    content,
    imageIds: result.imageIds  // Order preserved
  });
}

// Handle partial failures
if (result.errors.length > 0) {
  result.errors.forEach(({ file, error }) => {
    console.error(`${file}: ${error}`);
  });
}
```

**Flow:**
1. Client validates all files
2. Request multiple presigned URLs: `POST /images/post/presigned-urls`
   - Body: `[{ originalFilename: "img1.jpg" }, { originalFilename: "img2.jpg" }]`
   - Response: `[{ presignedUrl, key, imageId }, { presignedUrl, key, imageId }]`
3. Upload to S3 in parallel (Promise.all)
4. Return array of `imageIds` (nulls filtered out)

**File Validation:**
- Allowed types: `.webp`, `.jpeg`, `.jpg`, `.png`
- Max size: 5MB (profile and post images)
- Validation happens client-side before upload

**Key Points:**
- Profile images: Single upload API
- Post images: Batch upload API (supports up to 5 images)
- All uploads are direct to S3 (not through backend)
- Backend only provides presigned URLs and tracks imageIds
- Image order is preserved for post images

### Adding a New Page

1. Create HTML in `public/pages/[section]/page-name.html`
   - Add favicon: `<link rel="icon" type="image/png" href="/assets/imgs/wepick-logo-64.png" />`
2. Create route in `routes/[section].js` or new router
3. Create page JavaScript in `public/js/pages/pageName.js`
4. Load components using centralized loader:
   ```javascript
   import { loadHeader, loadFooter } from '/js/utils/component-loader.js';
   import { initHeaderAuth } from '/js/utils/header-init.js';

   async function init() {
     await loadHeader();
     await loadFooter();  // Optional: omit for pages without footer

     const user = await initHeaderAuth();
     // ... rest of page logic
   }
   ```
5. For new WePick features: NO Bootstrap, use `custom.css` tokens

### Creating a New Component

1. HTML template: `public/components/component-name.html`
2. JavaScript: `public/js/components/componentName.js`
3. Export init function: `export async function initComponentName() { ... }`
4. Document in `public/components/README.md`

## Important Configuration

**API Base URL:** `https://api.wepick.cloud/api` (defined in `public/js/config.js`)

**Authentication:** HTTP-only cookies (credentials: 'include' in all requests)

**Navigation Routes:** Centralized in `config.ROUTES.NAV` (TODAY, TOPICS, COMMUNITY)

**Image Upload Settings:** Centralized in `config.IMAGE_UPLOAD`
- MAX_SIZE: 5MB
- ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']

**Page IDs:** All page scripts must define `const PAGE_ID = "section-page"` for event management

**Design Assets:** Reference `docs/webdesign/` for official design images

**PRD Reference:** `prd.md` v0.5 - Product Requirements Document

**Task Tracking:** `docs/tasks.md` - MUST be checked and updated during all work sessions

**Refactoring Guide:** `docs/refactoring-plan.md` - Code structure improvement plan and progress

## Branch Strategy

- `main` - Production branch
- `dev` - Development branch
- `feature/branch-name` - Feature branches
- `docs/branch-name` - Documentation branches

## Common Pitfalls to Avoid

1. **Don't confuse Express routes with API routes**

   - Express routes in `routes/` serve HTML pages
   - API calls go to external backend via `apiRequest()`

2. **Don't store auth tokens in localStorage**

   - Use HTTP-only cookies (handled automatically)

3. **Don't add Bootstrap to new WePick features**

   - Only existing community pages use Bootstrap
   - New features use `custom.css` design tokens

4. **Don't redirect to login on page load for public pages**

   - Only check auth on ACTION (button click, form submit)
   - Exception: Pages like `/users/mypage` require auth on entry

5. **Don't navigate away from `/today` after voting**

   - Vote → Update UI in place → Show results
   - Only navigate to chat when user clicks "의견 공유하기"

6. **Don't use modals in new features**

   - Use Toast for notifications
   - Use inline messages for form errors

7. **Don't make API calls without using `base.js`**

   - Always import and use `apiRequest()` for consistency

8. **Don't duplicate header/footer loading code**

   - Use `component-loader.js` utility instead of writing fetch logic
   - Eliminates code duplication across pages

9. **Don't forget to add favicon to new pages**

   - All pages should have: `<link rel="icon" type="image/png" href="/assets/imgs/wepick-logo-64.png" />`

10. **Don't show 404 for unimplemented features**
    - Use `/coming-soon` page for features under development
    - Provides better UX than generic 404 error

11. **Don't hardcode configuration values**
    - Use `config.js` for all settings (routes, upload limits, etc.)
    - Navigation routes: `config.ROUTES.NAV`
    - Image validation: `config.IMAGE_UPLOAD`

12. **Don't use inconsistent error handling**
    - Use `ui-helpers.js` functions: `showError()`, `showSuccess()`, `showInfo()`
    - All messages should use Toast component for consistency

13. **Don't forget PAGE_ID in page scripts**
    - Every page script must define: `const PAGE_ID = "section-page"`
    - Required for proper event management and cleanup
