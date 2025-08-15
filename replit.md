# Overview
This project is a comprehensive lesson planning application for early childhood educators, streamlining the creation and management of weekly lesson plans. It supports managing activities, materials, and developmental milestones, and facilitates structured weekly schedules aligned with educational objectives. The application features a multi-tenant and multi-location architecture, ensuring data isolation and secure access for various educational organizations and their facilities. Its business vision is to provide a robust, scalable platform that simplifies lesson planning, thereby enhancing educational quality and efficiency in early childhood settings.

## Recent Changes (January 2025)

### Color Palette Integration for Parent App (January 17, 2025)
- **Implemented new color palette**: Replaced old childcare-themed colors with parent app's primary colors (#2BABE2 light blue, #88B73E green, #8100FF purple, #297AB1 darker blue)
- **Updated CSS variables**: Modified all primary, secondary, and accent color variables in index.css to use new color scheme
- **Tailwind configuration updated**: Added new color utilities (primary-blue, primary-green, primary-purple, primary-dark-blue) to tailwind.config.ts
- **Component color updates**: Updated color gradients and category colors in:
  - Weekly Calendar component (desktop view)
  - Tablet Weekly Calendar component
  - Draggable Activity component
- **Replaced old color references**: Changed all instances of turquoise, coral-red, mint-green, sky-blue, soft-yellow to new palette colors
- **Visual consistency**: App now properly blends with parent app when iframed, maintaining professional appearance

### Tablet Review Workflow Implementation (January 15, 2025)
- **Added tablet-friendly review interface**: Created TabletLessonReview component with optimized UI for tablet devices
- **Integrated tab navigation**: Added Calendar and Review tabs to tablet view with consistent navigation pattern (/tablet?tab=review)
- **Tablet-optimized notifications**: Positioned NotificationCarousel appropriately below header for better tablet UX
- **Full review capabilities**: All roles with review permissions can approve, reject, and provide feedback on lesson plans
- **Expanded/collapsed card view**: Lesson plans can be expanded to show full details including weekly calendar
- **Webview-friendly design**: Designed to work alongside existing app's left side drawer navigation
- **Touch-optimized controls**: Larger buttons and touch targets for better tablet interaction
- **Status tabs**: Organized lesson plans into Pending, Approved, and Returned tabs with counts
- **Added submit/finalize button to tablet planning**: Integrated lesson plan submission functionality directly in tablet weekly calendar with permission-based button text
- **Fixed timezone date comparison**: Resolved issue where lesson plans weren't found due to timezone conversion by comparing date strings directly (yyyy-MM-dd format)
- **Fixed tablet schedule type configuration**: Tablet view now properly fetches schedule settings from API instead of localStorage, ensuring correct position-based/time-based display per location
- **Renamed "Recording" to "Teaching"**: Updated tablet interface terminology from "Recording" mode to "Teaching" mode for better clarity and educational context

### Consistent Week Display Format (January 13, 2025)
- **Updated week range display**: Changed week display format from Monday-Sunday to Monday-Friday throughout the application
- **Modified components**: Updated formatWeekRange functions in calendar-controls.tsx and tablet-header.tsx
- **Consistent weekday focus**: All week displays now show only weekdays (Mon-Fri) to better align with childcare center operating days

### Enhanced Visual Content for Materials and Milestones (January 13, 2025)
- **Added placeholder images for materials**: Created professional placeholder images for Picture Book Collection, Wooden Building Blocks, and Washable Crayons materials
- **Added images for developmental milestones**: Generated and integrated images for "Express feelings verbally", "Sorts objects by attribute", and "Uses scissors to cut shapes" milestones
- **Updated server routing**: Modified server to serve static images from public directories first before falling back to object storage
- **Created dedicated image directories**: Added public/materials-images and public/milestone-images directories for static image assets
- **Improved visual presentation**: Materials library and developmental milestones now display proper visual content instead of broken image links

### Persistent Notification System Implementation (January 14, 2025)
- **Added PostgreSQL notifications table**: Created database table to store persistent notifications for users
- **Implemented NotificationCarousel component**: Built a carousel UI for displaying multiple returned lesson plan notifications
- **Added dismissible notifications**: Users can dismiss notifications with an X button to clear them from their view
- **Automatic notification creation**: Notifications are automatically created when lesson plans are rejected
- **Carousel navigation**: When multiple notifications exist, users can navigate between them using arrow buttons
- **Integration with review workflow**: Notifications include review notes and direct navigation to the relevant week for revision
- **Mark as read functionality**: Notifications are automatically marked as read when viewed
- **Collapsible feedback design**: Feedback is hidden by default with a "View Feedback" button to expand/collapse the reviewer's notes
- **Review status indicator in Weekly Calendar**: Added status badges next to Weekly Schedule title showing "Approved" (green) or "Returned for Revision" (amber) with expandable review notes

### Fixed Date Display in Lesson Review Area (January 12, 2025)
- **Fixed date calculation bug**: Changed from using `setDate()` to `addDays()` from date-fns library
- **Resolved month boundary issue**: Dates now correctly display when week spans across months (e.g., "Aug 29 - Sep 2" instead of invalid "Aug 29 - Sep 32")
- **Improved date range formatting**: Week ranges in review area now properly handle all edge cases
- **UI cleanup**: Removed redundant instructional text from lesson planner for cleaner interface

### Fixed Timezone Issues in Week Display (January 14, 2025)
- **Fixed timezone conversion bug**: Modified formatWeekRange function to parse ISO dates correctly in local timezone
- **Resolved incorrect week calculations**: September 1st now correctly shows as Sep 1-5 instead of Aug 25-29
- **Updated notification carousel**: Week ranges in notifications now display Monday-Friday format correctly
- **Fixed weekly calendar date display**: Calendar in review page now correctly shows Sept 1-5 for September week
- **Corrected date parsing**: WeeklyCalendar component now properly handles ISO date strings without timezone offset issues

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