# Overview

This is a comprehensive lesson planning application for early childhood educators, designed to streamline the creation and management of weekly lesson plans. The application provides tools for managing activities, materials, developmental milestones, and creating structured weekly schedules that align with educational objectives and available resources.

# User Preferences

Preferred communication style: Simple, everyday language.

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
✅ **COMPLETED**: PostgreSQL database successfully integrated
- Database schema pushed and synchronized
- DatabaseStorage class implemented replacing in-memory storage
- Sample data seeded for milestones, materials, and activities
- All API endpoints validated and working with persistent data

### Core Data Models
- **Users**: Teacher profiles with classroom assignments
- **Milestones**: Developmental milestones categorized by domain (Social, Emotional, Cognitive, Physical)
- **Materials**: Classroom materials with inventory tracking and location management
- **Activities**: Educational activities with age ranges, objectives, and material requirements
- **Lesson Plans**: Weekly planning containers with teacher assignments
- **Scheduled Activities**: Time-slotted activities within lesson plans

## Authentication and Authorization
Currently implemented as a foundational structure with user models in place, designed for future authentication implementation. The system includes teacher profiles and classroom-based organization.

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