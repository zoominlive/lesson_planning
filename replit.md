# Overview

This project is a comprehensive lesson planning application designed for early childhood educators. Its primary purpose is to streamline the creation and management of weekly lesson plans. Key capabilities include managing activities, materials, and developmental milestones, as well as creating structured weekly schedules that align with educational objectives and available resources. The application supports a multi-tenant and multi-location architecture, ensuring data isolation and secure access for various educational organizations and their facilities.

## Recent Changes (January 2025)

### SuperAdmin Full Location Access (January 13, 2025)
- **SuperAdmin universal access**: Modified backend to give SuperAdmin users access to ALL locations in database, not just those in JWT payload
- **Backend bypass for SuperAdmin**: Updated /api/locations endpoint to skip location filtering when user role is 'SuperAdmin'
- **Dynamic location fetching**: SuperAdmin users now fetch all locations from database dynamically regardless of JWT content
- **All 3 locations available**: SuperAdmin can now access "Test Frontend Location", "Main Campus", and "Third Location"

### JWT Token Location Format Fix (January 13, 2025)
- **Fixed location array format in test tokens**: Updated all test tokens in token-switcher to use exact location names (`["Main Campus", "Third Location"]`) instead of UUIDs
- **Parent app compatibility**: Ensured tokens match the format expected by parent application which sends location names in the JWT payload
- **All roles updated**: Applied location name format to admin, teacher, director, assistant_director, and superadmin tokens
- **Backend compatibility**: System accepts both location names and location IDs for backward compatibility

### Page-Level Security Implementation (January 13, 2025)
- **Added route-level authorization checks**: Settings and Review pages now check permissions before rendering, preventing unauthorized access via direct URL navigation
- **Access denied screens**: Users without proper permissions see a clear "Access Denied" message with a button to return to the main application
- **Fixed security vulnerability**: Previously only UI buttons were hidden but pages were still accessible via URL - now properly secured at the component level

### Multi-tenant Permission System (January 10, 2025)
- **Added tenantId to permission tables**: Updated permissions, roles, and role_permissions tables to include tenant_id for proper multi-tenant data isolation
- **Database migration**: Successfully migrated existing permission data to include tenant references
- **Fixed permission saving**: Resolved authentication issues where req.user.role was undefined by using req.role directly
- **Removed timestamp conflicts**: Fixed PATCH operations by excluding createdAt/updatedAt from updates
- **Unified naming convention**: Changed from "organization" to "tenant" terminology throughout permission system for consistency. Renamed organization_permission_overrides table to tenant_permission_overrides and updated all related code references
- **Renamed organization_settings table**: Changed organization_settings table to tenant_settings for consistency with tenant-based naming convention throughout the application

## Recent Changes (January 2025)
- **User tracking system**: Revamped Users table to track all users accessing the system via JWT tokens. Now captures first login date, last login date, login count, and user details from JWT tokens. Automatically creates/updates user records on each login.
- **Fixed tablet activity scheduling**: Resolved issue where selecting activities from drawer and tapping schedule slots wasn't saving to database. Now properly uses API mutations with error handling.
- **Drag-and-drop activity management**: Implemented comprehensive drag-and-drop functionality allowing users to move scheduled activities between time slots on both desktop and tablet interfaces
- **Enhanced tablet calendar UI**: Activities are now visually draggable with cursor changes, opacity effects during drag, and drop zone highlighting for improved user experience
- **PATCH API endpoint**: Added dedicated PATCH endpoint for partial updates of scheduled activities, specifically optimized for drag-and-drop operations
- **Real-time visual feedback**: Drop zones highlight when dragging over them, with "Drop Here" indicators and proper conflict detection for occupied slots
- **Fixed week start consistency**: Resolved critical bug where tablet and desktop views used different week start days (Sunday vs Monday), ensuring proper activity display
- **Fixed schedule type preservation**: Lesson plans now maintain their original schedule type (time-based or position-based) even when organization settings change
- **Separate lesson plans by schedule type**: The system creates and maintains separate lesson plans for time-based vs position-based scheduling, allowing users to switch between modes without losing their work
- **Schedule type filtering**: When fetching or creating lesson plans, the system now correctly filters by the current schedule type for the location
- **Settings manager location permissions**: Fixed security issue where settings manager was showing all organization locations instead of only user-permitted locations from userInfo storage
- **Auto-refresh on schedule type changes**: Implemented custom event system that automatically refreshes calendar data when schedule types change, preventing users from seeing cached activities from wrong schedule types
- **Cleaned up tablet header**: Removed menu button from tablet interface for cleaner, streamlined design
- **Fixed automatic room selection**: Both desktop and tablet planners now consistently auto-select first room when switching locations for seamless user experience
- **Updated position labels**: Removed "Position" prefix and converted numeric labels to written words (One, Two, Three, etc.) for cleaner calendar display
- **Lesson Plan Review System**: Implemented comprehensive review workflow with role-based permissions. Teachers submit plans for review, directors/assistant directors/admins approve or reject with feedback
- **Review Database Schema**: Added fields for tracking submission (submittedBy, submittedAt) and review (approvedBy, approvedAt, rejectedBy, rejectedAt, reviewNotes) in lesson plans table
- **Review API Endpoints**: Created endpoints for /submit, /approve, /reject operations with proper location-based access control and user tracking
- **Lesson Review Page**: Built dedicated review interface showing pending, approved, and rejected lesson plans with filtering by location and detailed review dialog
- **Submit for Review Button**: Fixed submission logic to create lesson plan if needed and submit current week's plan, with automatic approval for admin/superadmin users
- **Review Page Navigation**: Moved review functionality to main navigation tabs for better accessibility - appears as 5th tab for authorized roles (director, assistant_director, admin, superadmin)
- **Fixed JWT location handling**: Updated auth middleware to accept both location names and IDs in JWT tokens for backward compatibility
- **Fixed room filtering**: Resolved issue where rooms weren't loading due to JWT location name/ID mismatch - now properly filters rooms based on user's authorized locations
- **Fixed Submit for Review errors**: Corrected apiRequest parameter order in lesson-planner.tsx to properly submit lesson plans for review
- **Token Switcher Component**: Added role switching capability for testing with Admin, Teacher, and Director tokens. Located in bottom-right corner for easy access
- **Fixed Authentication Override**: Modified auth initialization to respect manually set tokens from token switcher, preventing automatic override to admin token
- **Activity Capacity Management**: Added min_children and max_children fields to activities table for specifying supported children ranges per activity
- **Enhanced Activity Form**: Updated activity form to include minimum and maximum children input fields with proper validation
- **Activity Library Display**: Modified activity cards to show children capacity ranges alongside duration for better planning visibility
- **Soft Delete for Activities**: Implemented soft delete functionality with is_active flag and deleted_on timestamp. Activities are marked as inactive instead of being permanently deleted
- **Removed Steps Button**: Simplified activity cards to only show Edit and Delete buttons, removing the Steps button for cleaner interface
- **Permission Management System (RBAC)**: Implemented Role-Based Access Control with configurable permissions replacing hardcoded role checks. Organizations can now customize approval workflows through the UI
- **Permission Database Schema**: Added permissions, roles, role_permissions, and organization_permission_overrides tables for flexible permission management
- **Permission Settings UI**: Created comprehensive permission management interface in Settings page allowing admins to configure which roles require approval vs auto-approval for different actions
- **Permission API Routes**: Added /api/permissions endpoints for managing permission overrides with role-based access control
- **Permission Checking Middleware**: Implemented middleware to check user permissions dynamically based on role and organization-specific overrides

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React 18 and TypeScript, employing a modern component-based architecture. It utilizes Tailwind CSS for styling with a custom childcare-themed design system, Shadcn/ui for components (built on Radix UI), TanStack Query for server state management, Wouter for routing, and React Hook Form with Zod for form handling. Vite is used for fast development and optimized builds.

## Backend Architecture
The backend follows a RESTful API pattern built with Node.js and Express.js. It uses Drizzle ORM with PostgreSQL for type-safe database operations and Zod schemas for consistent data validation across frontend and backend. An abstract storage interface allows flexible data persistence.

## Data Storage Solutions
A PostgreSQL database, configured with Neon Database, serves as the primary data store. Drizzle ORM handles database operations and schema management, with Drizzle Kit for migrations. The database supports a multi-tenant, multi-location architecture, ensuring data isolation through UUID primary keys and tenantId/locationId foreign keys across all relevant tables. All lesson plan entities require both tenantId and locationId for proper data isolation, and API endpoints filter data based on authenticated tenant and authorized locations.

### Core Data Models
Key data models include Users, Milestones, Materials, Activities, Lesson Plans, Scheduled Activities, and Settings (Locations, Rooms, Categories, Age Groups). All relevant entities require `tenantId` and `locationId` for data isolation, except for `Locations` which only requires `tenantId`.

## Authentication and Authorization
The system uses a JWT-based multi-tenant authentication system with location-based authorization and Role-Based Access Control (RBAC). JWT tokens include `tenantId`, user details, role, and authorized locations. Server-side validation of location access is enforced on all API endpoints. Tokens are passed via query parameters or postMessage for iframe communication.

The RBAC system allows organizations to:
- Configure which roles require approval for specific actions
- Set auto-approval for certain roles
- Customize permission workflows through a visual interface in Settings
- Track approval history with submission and review metadata
- Define permissions at resource and action level (e.g., lesson_plan.submit, activity.create)

## File Upload and Media Management
Activity and instruction images are stored locally in the `public/activity-images/` directory. They are served via a dedicated API endpoint (`/api/activities/images/:filename`) handled by an `ActivityStorageService`. Cloud storage solutions like Google Cloud Storage or AWS S3 are integrated with Uppy for general file uploads but are NOT used for activity images.

## Development and Build Process
Development uses Vite for HMR and TypeScript checking. Production builds are optimized with Vite for the frontend and esbuild for the backend. TypeScript strict mode is enforced for code quality.

## API Design Patterns
The REST API employs standard CRUD operations, with consistent location-based access control and server-side authorization on all endpoints. It features centralized error handling, Zod schema validation for incoming data, and structured logging.

## UI/UX Design System
A cohesive design system is implemented with a custom childcare-themed color palette, consistent typography, standardized spacing, and reusable UI components. Accessibility is prioritized through the use of Radix UI primitives.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling.
- **Drizzle ORM**: Type-safe database operations and schema management.

## UI and Component Libraries
- **React**: Frontend UI library.
- **Shadcn/ui**: Pre-styled components built on Radix UI.
- **Radix UI**: Accessible, unstyled UI primitives.
- **Tailwind CSS**: Utility-first CSS framework for styling.
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