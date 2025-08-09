# Overview

This project is a comprehensive lesson planning application designed for early childhood educators. Its primary purpose is to streamline the creation and management of weekly lesson plans. Key capabilities include managing activities, materials, and developmental milestones, as well as creating structured weekly schedules that align with educational objectives and available resources. The application supports a multi-tenant and multi-location architecture, ensuring data isolation and secure access for various educational organizations and their facilities.

## Recent Changes (January 2025)
- **Fixed schedule type preservation**: Lesson plans now maintain their original schedule type (time-based or position-based) even when organization settings change
- **Separate lesson plans by schedule type**: The system creates and maintains separate lesson plans for time-based vs position-based scheduling, allowing users to switch between modes without losing their work
- **Schedule type filtering**: When fetching or creating lesson plans, the system now correctly filters by the current schedule type for the location
- **Settings manager location permissions**: Fixed security issue where settings manager was showing all organization locations instead of only user-permitted locations from userInfo storage
- **Auto-refresh on schedule type changes**: Implemented custom event system that automatically refreshes calendar data when schedule types change, preventing users from seeing cached activities from wrong schedule types

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
The system uses a JWT-based multi-tenant authentication system with location-based authorization. JWT tokens include `tenantId`, user details, role, and authorized locations. Server-side validation of location access is enforced on all API endpoints. Tokens are passed via query parameters or postMessage for iframe communication.

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