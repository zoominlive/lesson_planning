# Overview
This project is a comprehensive lesson planning application for early childhood educators. Its primary purpose is to streamline the creation and management of weekly lesson plans, supporting activities, materials, and developmental milestones, and facilitating structured weekly schedules aligned with educational objectives. The application features a multi-tenant and multi-location architecture, ensuring data isolation and secure access for various educational organizations. The business vision is to provide a robust, scalable platform that simplifies lesson planning, thereby enhancing educational quality and efficiency in early childhood settings. Key capabilities include a tablet-friendly review workflow, consistent week display, enhanced visual content, a persistent notification system for lesson plan feedback, and a mobile-optimized parent view for approved lesson plans. The system also incorporates AI for activity generation with duplicate prevention, AI-powered material image generation, soft delete functionality for materials, robust permission management for lesson plan approvals, and a comprehensive reviews page integrated as a tab within the main lesson planner interface with dual functionality for lesson plan reviews and completed activity feedback analysis with teacher-specific pattern recognition.

# User Preferences
Preferred communication style: Simple, everyday language.

# Recent Changes (August 2025)
- **Production Cleanup Completed**: Removed 16 test/development files and organized documentation into docs/ folder
- **UI Component Optimization Phase 1**: Removed 4 unused UI components with external dependencies (carousel, chart, input-otp, command) and eliminated 41 total packages, achieving significant bundle size reduction from 608 to 567 packages

# System Architecture
## Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing a component-based architecture. Styling is managed with Tailwind CSS, a custom childcare-themed design system, and Shadcn/ui for components (built on Radix UI). TanStack Query handles server state, Wouter is used for routing, and React Hook Form with Zod manages forms and validation. Vite is employed for development and optimized builds. The UI/UX prioritizes a cohesive design system with a custom color palette, consistent typography, and accessible components.

## Backend Architecture
The backend follows a RESTful API pattern built with Node.js and Express.js. It uses Drizzle ORM with PostgreSQL for type-safe database operations and Zod schemas for data validation. An abstract storage interface provides flexibility for data persistence. The API design emphasizes standard CRUD operations, centralized error handling, and structured logging. The backend is organized with services in `server/services/` (AI services including Perplexity, OpenAI, image prompt generation, and prompt validation) and middleware in `server/middleware/` (authentication, permissions, and view access control).

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

## AI and Image Generation Services
- **Perplexity AI**: Used for prompt generation service and content safety validation.
- **OpenAI DALL-E 3**: Used for AI image generation.

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

# Production Readiness

## Codebase Cleanup (August 2025)
The project underwent comprehensive cleanup to prepare for production deployment:

### Files Removed (16 files):
- **Test Files**: `test_*.js`, `test_*.mjs` - Development testing scripts
- **Token Generation Scripts**: `generate_*.cjs`, `generate_*.js` - Development authentication utilities
- **Development Utilities**: `check_all_roles.cjs`, `decode_*.cjs`, `verify_*.cjs`

### Dependencies Removed (13 packages + types):
- **Authentication Libraries**: `passport`, `passport-local`, `memorystore`, `express-session`, `connect-pg-simple`, `google-auth-library` - Unused authentication systems
- **UI Libraries**: `next-themes`, `framer-motion`, `react-icons` - Unused frontend dependencies
- **Type Definitions**: Associated `@types/*` packages

### Cleanup Benefits:
- **Bundle Size**: Reduced by ~41 packages (~15-20MB)
- **Security**: Reduced attack surface by removing unused dependencies
- **Performance**: Faster install times and smaller production builds
- **Maintenance**: Cleaner dependency tree with only actively used packages

### Confirmed Active Dependencies:
- **Core Libraries**: `crypto`, `ws`, `multer`, `vaul`, `embla-carousel-react` - All actively used in production code
- **Authentication**: Custom JWT-based system with no external auth dependencies
- **File Management**: Local storage with API serving, no cloud auth needed