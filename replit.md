# Overview

This is a comprehensive lesson planning application for early childhood educators, designed to streamline the creation and management of weekly lesson plans. The application provides tools for managing activities, materials, developmental milestones, and creating structured weekly schedules that align with educational objectives and available resources.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## JWT Authentication Implementation (August 6, 2025)
- ✅ **JWT Token System**: Implemented proper JWT authentication for iframe integration
- ✅ **Multi-tenant Support**: Tokens include tenantId, userFirstName, userLastName, username, role
- ✅ **URL Parameter Method**: Tokens passed via `?token=` query parameter for testing
- ✅ **PostMessage Support**: Ready for iframe communication via postMessage
- ✅ **User Display**: Header shows authenticated user name and role
- ✅ **Admin Access**: Settings gear icon appears for Admin role users
- ✅ **Clean Navigation**: Removed redundant user info from navigation tabs

## Recent Changes

### Location-Based Categories, Rooms, and Age Groups (August 6, 2025)
- ✅ **Categories Schema Update**: Added locationId field to categories table for location-specific organization
- ✅ **Age Groups Schema Update**: Added locationId field to age_groups table for location-specific organization
- ✅ **Database Migration**: Successfully migrated existing categories and age groups to include location association
- ✅ **API Enhancement**: Updated categories and age groups API endpoints to support location filtering via locationId query parameter
- ✅ **Storage Layer**: Enhanced storage methods to filter categories and age groups by both tenant and location
- ✅ **Categories UI**: Built location-aware categories settings with location selector and form validation
- ✅ **Complete Multi-Location Architecture**: Rooms, categories, and age groups are now properly associated with specific locations

## Current Issues
- Age groups settings UI needs to be updated to work with location context similar to categories

# System Architecture

## Frontend Architecture
The frontend is built with React 18 using TypeScript and follows a modern component-based architecture:

- **UI Framework**: React with TypeScript for type safety and developer experience
- **Styling**: Tailwind CSS with a comprehensive design system featuring custom childcare-themed colors
- **Component Library**: Shadcn/ui components built on top of Radix UI primitives for accessibility and consistency
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Component Structure
✅ **REFACTORED**: Main components properly modularized
- **NavigationTabs**: Tab navigation with integrated content areas
- **CalendarControls**: Week navigation and room selection controls  
- **FloatingActionButton**: Quick action button component
- **LessonPlanner**: Clean main page component with proper separation of concerns

## Backend Architecture
The backend follows a RESTful API pattern built with Express.js:

- **Runtime**: Node.js with TypeScript using ESM modules
- **Framework**: Express.js with structured route handling and middleware
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Data Validation**: Zod schemas shared between frontend and backend for consistent validation
- **Storage Interface**: Abstract storage interface pattern allowing for flexible data persistence implementations

## Data Storage Solutions
The application uses a PostgreSQL database with Drizzle ORM, successfully integrated and operational:

- **Database**: PostgreSQL (configured with Neon Database)
- **ORM**: Drizzle with TypeScript for compile-time type safety and serverless connection pooling
- **Schema Management**: Centralized schema definitions in the shared directory
- **Migrations**: Drizzle Kit for database schema migrations
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Seeding**: Automated database seeding with sample data for development

### Database Integration Status
✅ **COMPLETED**: PostgreSQL database with multi-tenant, multi-location architecture
- UUID primary keys implemented across all tables for proper record deletion
- **Multi-Location Support**: All lesson plan entities (milestones, materials, activities, lesson plans, scheduled activities) now require both tenantId AND locationId for proper data isolation
- Complete tenant isolation - all tables reference tenant_id foreign key
- **Location-based filtering**: API endpoints support locationId query parameter for location-specific data filtering
- **Room-based organization**: Lesson plans and scheduled activities now reference specific roomId for classroom-level organization
- **Simplified room schema**: Removed age range requirements (ageRangeStart, ageRangeEnd) from rooms table for more flexible room management
- DatabaseStorage class with composite tenant + location filtering for data isolation
- Tenant-aware API endpoints automatically filter data by authenticated tenant and optional location
- Sample data migrated with development tenant UUID (7cb6c28d-164c-49fa-b461-dfc47a8a3fed)
- JWT authentication supports query parameter integration with user context (userFirstName, userLastName, username, role)
- Production-ready multi-tenant, multi-location data separation ensuring complete isolation

### Core Data Models
- **Users**: Teacher profiles with classroom assignments
- **Milestones**: Developmental milestones categorized by domain (Social, Emotional, Cognitive, Physical) - **requires tenantId + locationId**
- **Materials**: Classroom materials with inventory tracking and location management - **requires tenantId + locationId**
- **Activities**: Educational activities with age ranges, objectives, and material requirements - **requires tenantId + locationId**
- **Lesson Plans**: Weekly planning containers with teacher assignments - **requires tenantId + locationId + roomId**
- **Scheduled Activities**: Time-slotted activities within lesson plans - **requires tenantId + locationId + roomId**
- **Settings**: Multi-location organizational structure
  - **Locations**: Physical facilities - **requires tenantId only**
  - **Rooms**: Classrooms within locations - **requires tenantId + locationId**
  - **Categories**: Classification system for activities, materials, milestones - **requires tenantId + locationId**
  - **Age Groups**: Developmental age ranges for content targeting - **requires tenantId + locationId**

## Authentication and Authorization
✅ **COMPLETED**: JWT-based multi-tenant authentication system
- Query parameter token passing (primary method) with URL cleaning for security
- PostMessage token passing (fallback method) for iframe communication
- Tenant-based data isolation with UUID-based tenant identification
- User context extraction from JWT tokens (userFirstName, userLastName, username, role)
- Development mode with mock user data for testing
- Production-ready JWT validation with tenant-specific secrets
- User information display in navigation interface

## File Upload and Media Management
The application integrates Uppy for file handling:

- **File Upload**: Uppy dashboard and drag-drop components
- **Cloud Storage**: Google Cloud Storage integration
- **AWS S3**: Alternative storage option with Uppy S3 plugin
- **Progress Tracking**: Built-in upload progress indicators

## Development and Build Process
- **Development**: Vite dev server with HMR and TypeScript checking
- **Production Build**: Vite for frontend bundling, esbuild for backend compilation
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Development Tools**: Replit-specific plugins for enhanced development experience

## API Design Patterns
The REST API follows consistent patterns:

- **CRUD Operations**: Standardized endpoints for Create, Read, Update, Delete operations
- **Error Handling**: Centralized error middleware with consistent response formats
- **Request Validation**: Zod schema validation for all incoming data
- **Response Logging**: Structured logging for API requests and responses

## UI/UX Design System
The application features a cohesive design system:

- **Color Palette**: Custom childcare-themed colors (coral red, turquoise, sky blue, mint green, soft yellow)
- **Typography**: Consistent font sizing and weight hierarchy
- **Spacing**: Standardized margin and padding scales
- **Components**: Reusable UI components with consistent styling and behavior
- **Accessibility**: Built on Radix UI primitives ensuring WCAG compliance

# API Documentation

## Postman Collection
A comprehensive Postman collection is available with all API endpoints:
- **Collection File**: `Lesson_Planning_API.postman_collection.json`
- **Environment File**: `Lesson_Planning_API.postman_environment.json`
- **Features**: Complete CRUD operations, authentication examples, response validation
- **Coverage**: All entities including settings management APIs

## Settings Management APIs
✅ **COMPLETED**: Complete CRUD endpoints for organizational settings
- Locations: Physical facility management with capacity tracking
- Rooms: Classroom management within locations with age range specifications
- Categories: Classification system for activities, materials, and milestones
- Age Groups: Developmental age range definitions for content targeting
- Role-based access control (Admin users only)
- Full tenant isolation and data filtering

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management

## Cloud Storage
- **Google Cloud Storage**: Primary file storage solution for media assets
- **AWS S3**: Alternative cloud storage option with direct upload capabilities

## UI and Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Shadcn/ui**: Pre-styled components built on Radix UI
- **Lucide React**: Consistent icon library for UI elements
- **TanStack Query**: Server state management with caching and synchronization

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition

## File Upload
- **Uppy**: Modular file uploader with dashboard, drag-drop, and cloud storage integration
- **Multiple Storage Backends**: Support for both Google Cloud Storage and AWS S3

## Routing and Navigation
- **Wouter**: Lightweight routing library for single-page application navigation