# Overview
This project is a comprehensive lesson planning application for early childhood educators, streamlining the creation and management of weekly lesson plans. It supports managing activities, materials, and developmental milestones, and facilitates structured weekly schedules aligned with educational objectives. The application features a multi-tenant and multi-location architecture, ensuring data isolation and secure access for various educational organizations and their facilities. Its business vision is to provide a robust, scalable platform that simplifies lesson planning, thereby enhancing educational quality and efficiency in early childhood settings.

## Recent Changes (January 2025)

### Fixed Lesson Plan Review Data Display (January 12, 2025)
- **Enhanced getLessonPlansForReview function**: Modified to include teacher, location, room, and submitter data via proper database joins
- **Fixed tenant context issue**: Ensured proper tenant context is maintained when fetching related user data
- **Resolved "Unknown Teacher" display**: Review page now correctly shows teacher names instead of "Unknown Teacher"
- **Improved data enrichment**: Each lesson plan in review now includes complete related entity data for better display

## Recent Changes (January 2025)

### Assistant Director Approval Requirement (January 14, 2025)
- **Updated permission configuration**: assistant_director role now requires approval for lesson plans (sees "Submit for Review" instead of "Finalize")
- **Modified auto-approve roles**: Only director, admin, and superadmin roles now auto-approve lesson plans
- **Frontend and backend sync**: Updated both client/src/lib/permission-utils.ts and shared/permissions/permissions.config.ts to ensure consistency

### Lesson Plan Sharing Logic Fix (January 14, 2025)
- **Fixed duplicate lesson plans**: Lesson plans are now properly shared across all teachers for the same tenant->location->room->schedule-type->weekStart combination
- **Removed per-teacher ownership**: Modified POST /api/lesson-plans to check for existing plans before creating duplicates
- **Database cleanup**: Consolidated duplicate lesson plans by keeping the one with activities and preserving approval status
- **Shared access model**: Multiple teachers can now work on the same lesson plan, but only one can finalize/submit it
- **TeacherId field retained**: Database still requires teacherId for technical reasons, but application logic treats plans as shared

### Dynamic Approval Button Text (January 13, 2025)
- **Permission-based button text**: Submit button now shows "Finalize" for auto-approved roles (director, admin, superadmin) and "Submit for Review" for roles requiring approval (teacher, assistant_director)
- **Updated backend approval logic**: Backend now uses permission configuration to determine auto-approval instead of hardcoded role checks
- **Added requiresLessonPlanApproval function**: New utility function checks if current user requires lesson plan approval based on role permissions
- **Consistent toast messages**: Updated success messages to show "Lesson Plan Finalized" for auto-approved submissions

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture
## Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing a component-based architecture. It uses Tailwind CSS for styling with a custom childcare-themed design system, Shadcn/ui for components (built on Radix UI), TanStack Query for server state management, Wouter for routing, and React Hook Form with Zod for form handling. Vite is used for development and optimized builds.

## Backend Architecture
The backend follows a RESTful API pattern built with Node.js and Express.js. It uses Drizzle ORM with PostgreSQL for type-safe database operations and Zod schemas for consistent data validation. An abstract storage interface allows flexible data persistence.

## Data Storage Solutions
A PostgreSQL database, configured with Neon Database, serves as the primary data store. Drizzle ORM handles database operations and schema management. The database supports a multi-tenant, multi-location architecture, ensuring data isolation through UUID primary keys and `tenantId`/`locationId` foreign keys across all relevant tables. All lesson plan entities require both `tenantId` and `locationId` for proper data isolation, and API endpoints filter data based on authenticated tenant and authorized locations.

### Core Data Models
Key data models include Users, Milestones, Materials, Activities, Lesson Plans, Scheduled Activities, and Settings (Locations, Rooms, Categories, Age Groups). All relevant entities require `tenantId` and `locationId` for data isolation, except for `Locations` which only requires `tenantId`.

## Authentication and Authorization
The system uses a JWT-based multi-tenant authentication system with location-based authorization and Role-Based Access Control (RBAC). JWT tokens include `tenantId`, user details, role, and authorized locations. Server-side validation of location access is enforced on all API endpoints. The RBAC system allows organizations to configure approval workflows, set auto-approval for roles, and track approval history. Permissions are defined at the resource and action level (e.g., `lesson_plan.submit`, `activity.create`).

## File Upload and Media Management
Activity and instruction images are stored locally in the `public/activity-images/` directory and served via a dedicated API endpoint.

## Development and Build Process
Development uses Vite for HMR and TypeScript checking. Production builds are optimized with Vite for the frontend and esbuild for the backend. TypeScript strict mode is enforced.

## API Design Patterns
The REST API employs standard CRUD operations with consistent location-based access control and server-side authorization. It features centralized error handling, Zod schema validation, and structured logging.

## UI/UX Design System
A cohesive design system is implemented with a custom childcare-themed color palette, consistent typography, standardized spacing, and reusable UI components. Accessibility is prioritized through Radix UI.

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