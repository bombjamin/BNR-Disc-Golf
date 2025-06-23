# Golf Score Tracker Application

## Overview
This is a full-stack golf score tracking application built for the Bar None Ranch disc golf course. The app allows players to create games, join with friends, track scores in real-time, and view leaderboards. The system supports both authenticated users and guest players, with role-based permissions and comprehensive game management features.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: TailwindCSS with custom golf-themed color scheme and Shadcn/ui components
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Mobile Support**: Responsive design with bottom navigation and PWA capabilities via Capacitor
- **Real-time Updates**: Polling-based updates for live game state synchronization

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Custom session-based auth with SMS verification via Twilio
- **File Storage**: Local file system with multer for photo/video uploads
- **API Design**: RESTful endpoints with structured error handling

### Mobile App Support
- **Capacitor**: Hybrid mobile app framework for iOS deployment - READY FOR TESTING
- **Native iOS Features**: Camera integration, photo gallery access, device info
- **PWA Features**: Service worker for offline capabilities and app-like experience
- **iOS Optimizations**: Touch interface, status bar handling, app icons configured
- **iOS Project**: Complete Xcode project in `/ios/` directory with 3 native plugins
- **App Store Ready**: Bundle ID, metadata, and assets configured for submission

## Key Components

### Authentication System
- Multi-method authentication: SMS codes, passwords, and guest login
- Role-based access control (Emperor, Jedi Master, Jedi)
- Session management with automatic cleanup
- Phone number verification with SMS codes

### Game Management
- Real-time multiplayer scoring with live updates
- Support for different course types (Front 9, Back 9, Full 18)
- Automatic game cleanup for expired games (5 hours)
- Player management with local and registered players

### Media Management
- Photo upload and gallery system tied to games and holes
- Course tour video management with admin controls
- Profile picture upload with cropping functionality
- Optimized image processing for web and mobile

### Course Features
- Interactive course map with satellite imagery
- Weather integration for Blanco, Texas location
- Hole-by-hole scoring with par tracking
- Comprehensive statistics and leaderboards

## Data Flow

### Game Creation Flow
1. Authenticated user creates game with course type selection
2. Game code generated and stored in database
3. Host can add local players or invite registered users
4. Real-time polling keeps all players synchronized
5. Game progresses hole-by-hole with score entry
6. Automatic completion when all holes finished

### Authentication Flow
1. User registers with phone number and personal details
2. SMS verification code sent via Twilio
3. Upon verification, session created and stored
4. Session ID used for subsequent authenticated requests
5. Role-based permissions control feature access

### Media Upload Flow
1. Files uploaded via multipart form data
2. Server-side processing and optimization
3. Files stored in organized directory structure
4. Database records created with file metadata
5. URLs generated for client-side access

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **SMS Service**: Twilio for verification codes and notifications
- **UI Components**: Radix UI primitives with Shadcn/ui styling
- **Image Processing**: Sharp for profile picture optimization
- **Date Handling**: date-fns for consistent date formatting

### Development Tools
- **Type Safety**: Zod for runtime validation and TypeScript integration
- **Code Quality**: ESLint and Prettier (configured via package.json)
- **Build Tools**: Vite for fast development and production builds
- **Database Migrations**: Drizzle Kit for schema management

## Deployment Strategy

### Replit Configuration
- **Modules**: Node.js 20, Web, PostgreSQL 16
- **Development**: `npm run dev` starts both frontend and backend
- **Production**: `npm run build` followed by `npm run start`
- **Port Configuration**: Backend on port 5000, mapped to external port 80

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `TWILIO_ACCOUNT_SID`: Twilio account identifier
- `TWILIO_AUTH_TOKEN`: Twilio authentication token
- `TWILIO_PHONE_NUMBER`: Twilio phone number for SMS

### File Storage
- Uploads stored in local filesystem under `/uploads/` directory
- Subdirectories: `/profiles/`, `/videos/`, general uploads
- Static file serving configured in Express

## Changelog
- June 23, 2025. Initial setup
- June 23, 2025. iOS deployment setup completed with Capacitor
- June 23, 2025. Native iOS features added: camera, photo gallery, device integration
- June 23, 2025. iOS app assets and configuration finalized for App Store deployment
- June 23, 2025. iOS app successfully running in Xcode simulator - basic interface working
- June 23, 2025. GitHub repository successfully configured - clean repository with source code only (848KB)
- June 23, 2025. iOS project files added to GitHub repository for Xcode integration
- June 23, 2025. Stable iOS testing environment established with GitHub integration
- June 23, 2025. iOS CocoaPods dependency issues resolved - clean iOS project rebuilt and ready for testing
- June 23, 2025. Phase 1 Complete: iOS app backend connectivity configured - API endpoints connected to Replit backend
- June 23, 2025. CocoaPods successfully installed on user's Mac - iOS development environment ready
- June 23, 2025. iOS folder updated with latest configuration - direct GitHub workflow established

## User Preferences
Preferred communication style: Simple, everyday language.