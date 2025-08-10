# Lesson Planning Application

## Overview

A comprehensive web application designed for early childhood educators to streamline the creation and management of weekly lesson plans. This platform enables teachers to organize activities, manage classroom materials, track developmental milestones, and create structured weekly schedules that align with educational objectives and available resources.

## Key Features

### Core Functionality
- **Weekly Lesson Planning**: Create and manage comprehensive lesson plans with daily activities
- **Activity Management**: Browse, create, and organize educational activities with objectives and material requirements
- **Material Inventory**: Track classroom materials with location management and availability status
- **Developmental Milestones**: Monitor and align activities with age-appropriate developmental goals
- **Multi-Location Support**: Manage multiple facilities with location-specific data isolation
- **Room-Based Organization**: Organize lesson plans by specific classrooms within locations

### Advanced Features
- **JWT Authentication**: Secure token-based authentication for iframe integration
- **Multi-Tenant Architecture**: Complete data isolation between different organizations
- **Location-Based Authorization**: Users can only access data for their authorized locations
- **Role-Based Access Control (RBAC)**: Flexible permission system with configurable approval workflows
- **Permission Management**: Visual interface for customizing role permissions and approval requirements
- **AI-Powered Content Generation**: Generate activities, milestones, and educational content using AI
- **Real-Time Updates**: Live synchronization of data across all connected clients
- **Activity Capacity Management**: Define minimum and maximum children ranges for activities
- **Soft Delete**: Activities can be archived instead of permanently deleted

## Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe component development
- **Vite** for fast development and optimized production builds
- **TanStack Query v5** for server state management with caching
- **Tailwind CSS** for utility-first styling
- **Shadcn/ui** components built on Radix UI for accessibility
- **Wouter** for lightweight client-side routing
- **React Hook Form** with Zod validation for form handling
- **Lucide React** for consistent iconography
- **Framer Motion** for animations

### Backend
- **Node.js** with TypeScript using ESM modules
- **Express.js** for RESTful API server
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** (Neon) for data persistence
- **JWT** for secure authentication
- **Multer** for file upload handling
- **Express Session** with PostgreSQL store

### AI Integration
- **OpenAI GPT-4o** for advanced content generation
- **Perplexity API** for educational content research and generation
- **AI-Powered Features**:
  - Activity generation with age-appropriate objectives
  - Milestone recommendations based on developmental domains
  - Educational content suggestions
  - Lesson plan optimization

### Infrastructure
- **PostgreSQL Database** hosted on Neon with connection pooling
- **Local File Storage** for activity images and media
- **Environment-based Configuration** for development/production
- **Git Version Control** with automatic commit tracking

## System Architecture

### Multi-Tenant Architecture
```
┌─────────────────────────────────────────────────────┐
│                Parent Application                    │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │           JWT Token Generation                │  │
│  │  - tenantId, userId, locations, role         │  │
│  └────────────────┬─────────────────────────────┘  │
│                   │                                  │
│  ┌────────────────▼─────────────────────────────┐  │
│  │             Iframe Integration                │  │
│  │    (Query Parameter or PostMessage)          │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│           Lesson Planning Application               │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │          JWT Authentication Layer             │  │
│  │     - Token validation                        │  │
│  │     - Location authorization                  │  │
│  └────────────────┬─────────────────────────────┘  │
│                   │                                  │
│  ┌────────────────▼─────────────────────────────┐  │
│  │            Express.js API Server              │  │
│  │     - RESTful endpoints                       │  │
│  │     - Request validation (Zod)                │  │
│  │     - Location-based filtering                │  │
│  └────────────────┬─────────────────────────────┘  │
│                   │                                  │
│  ┌────────────────▼─────────────────────────────┐  │
│  │          Data Access Layer                    │  │
│  │     - Drizzle ORM                             │  │
│  │     - Tenant + Location isolation             │  │
│  └────────────────┬─────────────────────────────┘  │
│                   │                                  │
│  ┌────────────────▼─────────────────────────────┐  │
│  │         PostgreSQL Database                   │  │
│  │     - Multi-tenant data                       │  │
│  │     - Location-based partitioning             │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Database Schema

The application uses a comprehensive relational database schema with:

- **Tenant Isolation**: All entities include `tenant_id` for complete data separation
- **Location Association**: Lesson plan entities include `location_id` for facility-specific data
- **Room Organization**: Lesson plans and scheduled activities reference `room_id`
- **UUID Primary Keys**: All tables use UUIDs for robust data management

Key entities:
- `tenants` - Organization management
- `locations` - Physical facilities
- `rooms` - Classrooms within locations
- `milestones` - Developmental goals
- `materials` - Classroom resources
- `activities` - Educational activities
- `lesson_plans` - Weekly planning containers
- `scheduled_activities` - Time-slotted activities
- `categories` - Classification system
- `age_groups` - Developmental age ranges

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or use Neon cloud database)
- JWT secret for authentication (128-character hex string)

### Environment Variables
Create a `.env` file with:
```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Authentication
JWT_SECRET=your-128-character-hex-secret
TENANT_ID=your-tenant-uuid

# AI Services (Optional)
OPENAI_API_KEY=your-openai-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key

# Development
NODE_ENV=development
```

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd lesson-planning-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
npm run db:push
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage

### Standalone Mode
Access the application directly at `http://localhost:5000` for development and testing.

### Iframe Integration
Embed the application in your parent system:

```html
<iframe 
  src="https://your-domain.com/?token=YOUR_JWT_TOKEN"
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

### JWT Token Structure
```javascript
{
  tenantId: "tenant-uuid",
  userId: "user-uuid",
  userFirstName: "John",
  userLastName: "Doe",
  username: "john.doe",
  role: "teacher" | "assistant_director" | "director" | "admin" | "superadmin",
  locations: ["Main Campus", "West Wing"],
  iat: timestamp,
  exp: timestamp
}
```

## API Documentation

### Authentication
All API endpoints require JWT authentication via Bearer token.

### Core Endpoints

#### Milestones
- `GET /api/milestones?locationId={id}` - List milestones
- `POST /api/milestones` - Create milestone
- `PUT /api/milestones/:id` - Update milestone
- `DELETE /api/milestones/:id` - Delete milestone

#### Activities
- `GET /api/activities?locationId={id}` - List activities
- `POST /api/activities` - Create activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

#### Materials
- `GET /api/materials?locationId={id}` - List materials
- `POST /api/materials` - Create material
- `PUT /api/materials/:id` - Update material
- `DELETE /api/materials/:id` - Delete material

#### Lesson Plans
- `GET /api/lesson-plans?locationId={id}&roomId={id}` - List lesson plans
- `POST /api/lesson-plans` - Create lesson plan
- `PUT /api/lesson-plans/:id` - Update lesson plan
- `DELETE /api/lesson-plans/:id` - Delete lesson plan
- `POST /api/lesson-plans/:id/submit` - Submit for review
- `POST /api/lesson-plans/:id/approve` - Approve lesson plan
- `POST /api/lesson-plans/:id/reject` - Reject lesson plan

#### Permissions
- `GET /api/permissions/overrides` - List permission overrides
- `POST /api/permissions/overrides` - Create permission override
- `PATCH /api/permissions/overrides/:id` - Update permission override
- `POST /api/permissions/check` - Check user permission

### Postman Collection
Complete API documentation with examples is available in:
- `Lesson_Planning_API.postman_collection.json`
- `Lesson_Planning_API.postman_environment.json`

## AI Features

### Content Generation
The application leverages AI to enhance educator productivity:

1. **Activity Generation**
   - Generate age-appropriate activities based on objectives
   - Suggest materials and setup instructions
   - Create variations of existing activities

2. **Milestone Recommendations**
   - Suggest developmental milestones by age group
   - Align activities with milestone objectives
   - Track progress across domains (Physical, Social, Emotional, Cognitive)

3. **Educational Content**
   - Generate lesson plan descriptions
   - Create learning objectives
   - Suggest assessment strategies

### AI Implementation
- Uses OpenAI GPT-4o for advanced language understanding
- Perplexity API for educational content research
- Structured prompts ensure age-appropriate, educational content
- JSON response format for seamless integration

## Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Start production server
npm start

# Push database schema changes
npm run db:push
```

### Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Route-based page components
│   │   ├── lib/          # Utilities and helpers
│   │   └── hooks/        # Custom React hooks
│   └── public/           # Static assets
├── server/                # Express backend application
│   ├── routes.ts         # API endpoint definitions
│   ├── storage.ts        # Data access layer
│   ├── auth.ts          # Authentication middleware
│   └── index.ts         # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database schema definitions
├── public/              # Public assets
│   └── activity-images/ # Local image storage
└── scripts/             # Utility scripts
    └── generate-jwt-token.js
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Multi-Tenant Isolation**: Complete data separation between organizations
- **Location-Based Authorization**: Granular access control
- **Role-Based Access Control (RBAC)**: Flexible permission system with configurable approval workflows
- **Permission Management**: Organizations can customize which roles require approval for specific actions
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM
- **XSS Prevention**: React's built-in protection
- **HTTPS Support**: Production deployment with TLS

### Permission System

The application implements a flexible RBAC system that allows organizations to:
- Configure which roles require approval for specific actions
- Set auto-approval for certain roles (e.g., directors, admins)
- Customize permission workflows through a visual interface
- Track approval history with submission and review metadata

Default roles and their typical permissions:
- **Teacher**: Create/edit lesson plans, submit for review
- **Assistant Director**: Review and approve lesson plans, manage activities
- **Director**: Full location management, approve plans
- **Admin**: Organization-wide management, permission configuration
- **Superadmin**: System-level access, all permissions

## Contributing

### Development Workflow
1. Create feature branch from `main`
2. Make changes following existing code patterns
3. Test thoroughly with JWT authentication
4. Submit pull request with clear description

### Code Style
- TypeScript with strict mode
- React functional components with hooks
- Consistent naming conventions
- Comprehensive type definitions

## Integration Guide

For detailed integration instructions, see `INTEGRATION_GUIDE.md` which covers:
- JWT token generation examples (Node.js, PHP)
- Iframe integration methods
- API authentication patterns
- Troubleshooting common issues

## Support

For technical support or integration assistance:
- Review `INTEGRATION_GUIDE.md` for detailed setup instructions
- Check `API_TESTING.md` for API testing results
- Use the Postman collection for API exploration
- Contact development team for tenant setup

## License

MIT License - See LICENSE file for details

## Acknowledgments

Built with modern web technologies and designed specifically for early childhood education environments. Special focus on usability, security, and educational best practices.