# Disc Golf Scoring Application

## Overview

This is a full-stack disc golf scoring application built for Bar None Ranch, a disc golf course in Blanco, Texas. The application allows players to create games, track scores in real-time, view leaderboards, and share photos from their rounds. It features user authentication, real-time score tracking, photo uploads, course tour videos, and administrative controls.

## System Architecture

The application follows a modern full-stack architecture with:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: Session-based authentication with SMS verification via Twilio
- **File Storage**: Local file system for photos and videos
- **Deployment**: Replit with autoscale deployment target

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application with client-side routing using Wouter
- **Component Library**: shadcn/ui components for consistent UI
- **State Management**: React Query for server state, React hooks for local state
- **Responsive Design**: Mobile-first design optimized for phones and tablets
- **PWA Features**: Service worker integration for offline capabilities

### Backend Architecture
- **Express Server**: RESTful API with TypeScript
- **Session Management**: Cookie-based sessions with PostgreSQL storage
- **Authentication**: Multi-factor authentication with SMS codes
- **File Handling**: Multer for photo/video uploads with Sharp for image processing
- **Real-time Updates**: Polling-based updates for live scorecard synchronization

### Database Schema
- **Users**: Authentication, profiles, and role-based access control
- **Games**: Game sessions with course configuration and status tracking
- **Players**: Individual participants in games (registered users or guests)
- **Scores**: Hole-by-hole scoring data
- **Photos**: Game photos with metadata
- **Course Tour Videos**: Administrative video management
- **Verification Codes**: SMS verification for authentication

### Authentication System
- **Role-based Access**: Three roles - Emperor (admin), Jedi Master, and Jedi
- **SMS Verification**: Twilio integration for phone number verification
- **Guest Access**: Temporary guest accounts for quick game participation
- **Session Management**: Secure session handling with automatic cleanup

## Data Flow

1. **User Registration/Login**: SMS-based verification flow
2. **Game Creation**: Host creates game with course type selection
3. **Player Joining**: Players join via game codes or are added by host
4. **Score Entry**: Real-time score tracking with validation
5. **Photo Sharing**: In-game photo uploads with automatic gallery creation
6. **Game Completion**: Final leaderboard generation and results sharing

## External Dependencies

- **Twilio**: SMS verification and notifications
- **OpenWeatherMap**: Weather data for course conditions
- **Neon Database**: PostgreSQL hosting
- **Sharp**: Image processing and optimization
- **Replit**: Hosting and deployment platform

## Deployment Strategy

- **Development**: Local development with hot reload via Vite
- **Production**: Automated deployment on Replit with build optimization
- **Database**: Drizzle migrations for schema management
- **Static Assets**: Vite build output served by Express
- **File Storage**: Local uploads directory with Express static serving

## Changelog
- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.