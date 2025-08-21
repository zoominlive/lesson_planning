# Overview

This is a comprehensive lesson planning application designed specifically for early childhood educators. The system enables teachers to create, manage, and organize weekly lesson plans with activities aligned to developmental milestones. It features a multi-tenant architecture supporting multiple organizations, each with their own locations and rooms. The application is designed for iframe integration with secure JWT authentication and includes tablet-optimized views for mobile WebView embedding.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend uses React 18 with TypeScript in a component-based architecture. Vite serves as the build tool and development server. State management is handled through TanStack Query v5 for server state and React hooks for local state. The UI is built with Tailwind CSS for utility-first styling and Shadcn/ui components based on Radix UI primitives for accessibility. Wouter provides lightweight client-side routing, while React Hook Form with Zod handles form validation.

## Backend Architecture
The backend follows RESTful API patterns using Node.js with Express.js and TypeScript. Drizzle ORM provides type-safe database operations with PostgreSQL. The system implements a multi-tenant architecture with JWT-based authentication and role-based access control (RBAC). File uploads are handled through Multer with local storage for activity images and videos.

## Data Storage Solutions
PostgreSQL (Neon Database) serves as the primary data store with multi-tenant data isolation. Drizzle ORM manages database schema and migrations. The database schema supports complex relationships between tenants, locations, rooms, lesson plans, activities, materials, and developmental milestones. Location-based authorization ensures users can only access data for their authorized locations.

## Authentication and Authorization
JWT-based authentication supports iframe integration with parent applications. Tokens contain tenant ID, user details, role, and authorized locations array. The RBAC system includes multiple roles (teacher, assistant_director, director, admin, superadmin) with customizable permission overrides per organization. Location-based authorization restricts data access to user's assigned locations.

## Multi-Tenant Architecture
Complete data isolation between organizations using tenant ID filtering. Each tenant has their own JWT secrets, users, locations, rooms, and content. Shared resources like system roles and some developmental milestones are available across tenants while maintaining security boundaries.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting for scalable data storage
- **Drizzle ORM**: Type-safe database operations and schema management

## AI Integration Services
- **Anthropic Claude API**: Content generation for activities and educational materials
- **Perplexity AI**: Additional AI capabilities for content enhancement

## Authentication & File Storage
- **JWT (jsonwebtoken)**: Token-based authentication for iframe integration
- **Local File Storage**: Activity images and videos stored in public directory
- **Replit Object Storage**: File upload capabilities for development environment

## UI Component Libraries
- **Radix UI**: Accessible, unstyled UI component primitives
- **Shadcn/ui**: Pre-built component library based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Comprehensive icon library
- **Framer Motion**: Animation library for enhanced user experience

## Development Tools
- **Vite**: Fast build tool and development server with HMR
- **TypeScript**: Type-safe JavaScript development
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Performant form library with validation
- **Zod**: Runtime type validation and schema definition
- **Uppy**: Modular file uploader with multiple storage backends