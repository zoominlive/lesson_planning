# Overview
This project is a comprehensive lesson planning application for early childhood educators, designed to streamline the creation and management of weekly lesson plans. It supports managing activities, materials, and developmental milestones, and facilitates structured weekly schedules aligned with educational objectives. The application features a multi-tenant and multi-location architecture, ensuring data isolation and secure access for various educational organizations and their facilities. Its business vision is to provide a robust, scalable platform that simplifies lesson planning, thereby enhancing educational quality and efficiency in early childhood settings. Key capabilities include a tablet-friendly review workflow, consistent week display, enhanced visual content for educational materials, a persistent notification system for lesson plan feedback, and a mobile-optimized parent view for approved lesson plans. The system also incorporates AI for activity generation with duplicate prevention and robust permission management for lesson plan approvals.

## Recent Changes (August 2025)
- **Quick Add Material Improvements** (August 18, 2025):
  - Added ability to edit material title and quantity in Quick Add modal before saving
  - Fixed material-to-collection assignment by adding missing POST endpoint `/api/material-collections/:id/materials`
  - Enhanced error handling for material collection assignment with proper try-catch blocks
  - Materials are now properly linked to collections via `material_collection_items` table
  - Added input validation requiring material name before submission
  - Batch processing now correctly assigns all materials to the same collection
- **Image Prompt Generation Service** (August 18, 2025): 
  - **Initial version**: Created dedicated `imagePromptGenerationService` with complex prompt engineering
  - **Simplified version**: Streamlined to pass simple, direct prompt to Perplexity: "Write me prompt for dall e 3 to make me a picture of the following activity [Activity Name - Activity Description] Be sure to start the prompt you write with 'A bright, photo-realistic childcare classroom/playground depicting'"
  - Automatically uses "childcare playground" for outdoor activities, "childcare classroom" for indoor
  - Handles activity and step images separately with different context
  - All prompts start with "A bright, photo-realistic childcare classroom depicting" for consistency
  - Includes age group, category, and space requirements in prompt context
  - Separate endpoints for activity images (`/api/activities/generate-image`) and step images (`/api/activities/generate-step-image`)
  - Fallback to basic prompts if Perplexity service is unavailable
  - Client-side updated to pass full context (age group, category) when generating images
- **Mobile Component Architecture**: Organized parent view components into `/client/src/components/mobile/` directory structure to reflect mobile webview integration purpose
- **Parent View Enhancements**: Implemented stunning Instagram-like design with collapsible "How it works" sections, full-width material display, and proper developmental milestone naming
- **Data Display Fixes**: Corrected server-side data mapping for materials, milestones, and categories with proper field name mapping from database to frontend
- **Material Collections System**: Implemented complete material collections feature with many-to-many relationships, allowing materials to be organized into collections for easier browsing and filtering
  - Database schema: Added `material_collections` and `material_collection_items` tables
  - Backend API: Full CRUD operations for collections and material-collection associations  
  - UI enhancements: Collection selection in material forms and filtering in materials library
- **AI Activity Generation Improvements**:
  - Fixed description textarea to auto-expand for better visibility of AI-generated content
  - Ensured all AI-generated fields (objectives, safety considerations, etc.) are properly saved to database
  - Improved Quick Add materials visual feedback to show when materials have been added
  - Cleaned up console.log statements from production code
  - Fixed TypeScript issues with Set iteration and null/undefined type handling
  - **Content Safety Validation** (January 18, 2025):
    - Added prompt validation service using Perplexity AI to ensure all user inputs are appropriate for early childhood education
    - Validates activity types and focus materials before generation
    - Blocks explicitly inappropriate content (violence, adult themes, etc.)
    - **Strict validation-only mode**: Only validates without sanitizing inputs - rejects if content doesn't pass exactly as entered
    - **Safety-first approach**: Blocks activity generation if validation service is unavailable (throws errors on API failures)
    - Clear error messages when content is rejected for safety reasons
    - Users can remove activity type/focus material fields if validation service is down
    - No input modification: validation service validates appropriateness without altering user input
    - **API Model Update** (January 19, 2025): Updated Perplexity API model from deprecated 'llama-3.1-sonar-small-128k-online' to 'sonar' for validation service
    - **Error Display Enhancement** (January 19, 2025): Changed validation error display from disappearing snackbar to modal dialog that users must click to close, ensuring they have time to read error messages
- **OpenAI Integration Refactoring** (January 2025):
  - Extracted OpenAI image generation logic from perplexityService.ts into dedicated openAiService.ts module
  - Enhanced DALL-E 3 prompts to generate clean, educational illustrations with minimalist style
  - Improved error handling for OpenAI API with specific billing and quota error messages
  - Updated client-server communication to pass both activity title and description for better image context
  - Fixed image storage path to save AI-generated images in `public/activity-images/images/` subdirectory for proper serving
  - Note: OpenAI account requires billing credits ($5 minimum) for image generation to work
  - **UI Improvements** (August 17, 2025):
    - Changed AI generation button icon from wand to star for better visual appeal
    - Fixed button contrast issues with dark text (#0d0d0c) on gradient background for readability
    - Removed full-screen overlay during image generation, keeping only button animation for cleaner UX
    - Updated OpenAI prompts to generate professional educational reference images for teachers
    - Clear, realistic depictions suitable for adult educators (not cartoons)
    - Professional photography aesthetic like educational textbooks or teacher training materials
    - Documentary-style composition that clearly demonstrates activities
    - Uses 'natural' style parameter for more realistic, professional images
    - **Bulk Step Image Generation** - Added "Generate All Step Images" button next to "Add Step" that:
      - Generates images for all instruction steps that don't already have images
      - Creates contextual images for each step with proper step numbering
      - Shows progress with animated loading state
      - Provides feedback on success/failure count
      - Purple-to-pink gradient button styling for visual distinction
    - **Click-to-Enlarge Images** - All activity and step images now clickable to view in full-screen modal
      - Dialog title dynamically shows "Activity Image" or "Step X" based on which image was clicked
    - **Image Regeneration** - Added refresh button overlay on hover for individual image regeneration
      - Works for both main activity image and individual step images
      - Shows loading spinner during regeneration
      - Toast notifications for success/error
    - **Indoor/Outdoor Context** - Image generation now respects activity's spaceRequired setting
      - Automatically generates outdoor images for outdoor activities
      - Generates indoor classroom images for indoor activities
      - Passes environment context to OpenAI for accurate scene generation
    - **Consistent Image Generation** - All images (main activity and step images) use the same professional educational style
      - Same prompt template and style requirements for all generated images
      - Uses "natural" style parameter in DALL-E 3 for realistic, professional appearance
      - Any perceived style differences are due to DALL-E's interpretation of content, not different prompts

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture
## Frontend Architecture
The frontend is built with React 18 and TypeScript, using a component-based architecture. Styling is handled with Tailwind CSS, leveraging a custom childcare-themed design system, and Shadcn/ui for components (built on Radix UI). TanStack Query manages server state, Wouter is used for routing, and React Hook Form with Zod handles form management and validation. Vite is employed for development and optimized builds. The UI/UX prioritizes a cohesive design system with a custom color palette, consistent typography, and accessible components.

## Backend Architecture
The backend follows a RESTful API pattern built with Node.js and Express.js. It utilizes Drizzle ORM with PostgreSQL for type-safe database operations and Zod schemas for consistent data validation. An abstract storage interface provides flexibility for data persistence. The API design emphasizes standard CRUD operations, centralized error handling, and structured logging.

## Data Storage Solutions
A PostgreSQL database, specifically Neon Database, serves as the primary data store. Drizzle ORM facilitates database interactions and schema management. The architecture supports multi-tenancy and multi-location data isolation using UUID primary keys and `tenantId`/`locationId` foreign keys across relevant tables. All lesson plan entities require both `tenantId` and `locationId` for proper data isolation, with API endpoints filtering data based on authenticated tenant and authorized locations. Core data models include Users, Milestones, Materials, Activities, Lesson Plans, Scheduled Activities, and Settings (Locations, Rooms, Categories, Age Groups). Lesson plans are shared across all teachers for the same tenant, location, room, schedule type, and week.

## Authentication and Authorization
The system employs a JWT-based multi-tenant authentication system with location-based authorization and Role-Based Access Control (RBAC). JWT tokens contain `tenantId`, user details, role, and authorized locations. Server-side validation enforces location access on all API endpoints. The RBAC system enables configurable approval workflows, auto-approval settings for specific roles, and tracks approval history. Permissions are defined at the resource and action level.

## File Upload and Media Management
Activity and instruction images are stored locally in the `public/activity-images/` directory and served via a dedicated API endpoint. Placeholder images for materials and developmental milestones are also managed locally.

## Development and Build Process
Vite is used for frontend development (HMR, TypeScript checking) and optimization for production builds. Esbuild is used for backend production builds. TypeScript strict mode is enforced throughout the codebase.

# External Dependencies
## Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database operations.

## UI and Component Libraries
- **React**: Frontend UI library.
- **Shadcn/ui**: Pre-styled components.
- **Radix UI**: Accessible, unstyled UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **TanStack Query**: Server state management.

## Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Programming language.
- **Zod**: Runtime type validation and schema definition.
- **React Hook Form**: Form state management and validation.

## File Upload
- **Uppy**: Modular file uploader.

## Routing and Navigation
- **Wouter**: Lightweight routing library.