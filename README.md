# DnD AI - Collaborative D&D Platform with AI Assistance

A modern web-based platform for playing Dungeons & Dragons with integrated AI assistance, featuring campaign management, seat assignment, and intelligent AI companions for both players and game masters.

## ⚡ **Quick Start**

```bash
npm install && npm run dev
```

**Frontend**: http://localhost:13000 | **API**: http://localhost:13333

## � **Recent Updates**

-   ✅ **Comprehensive Dice Rolling System** with D&D 5e mechanics
-   ✅ **Character Creation & Management** with full stat calculations
-   ✅ **Dropdown-based Dice Interface** for better user experience
-   ✅ **Roll History Tracking** per campaign
-   ✅ **Advantage/Disadvantage** and critical hit detection

## �🎯 **Current Features**

### ✅ **Authentication & User Management**

-   User registration and login with secure password hashing (bcrypt)
-   JWT token-based session management with automatic validation
-   Protected routes and session persistence
-   Password visibility toggle for better UX

### ✅ **Campaign Management**

-   **Create Campaigns**: Customize campaign name, player count (1-8 seats), GM type (human/AI)
-   **Browse Campaigns**: Visual campaign browser showing room codes, player count, and GM status
-   **Join Campaigns**: Enter room codes or click-to-join from campaign list
-   **Persistent Storage**: MongoDB integration for reliable data persistence

### ✅ **Character Creation & Management System**

-   **Full D&D 5e Character Sheets**: Complete character creation with stats, skills, and background
-   **Character Builder**: Interactive character creation with race, class, and background selection
-   **Ability Score Management**: Point-buy system with automatic modifier calculation
-   **Character Library**: View and manage all your characters across campaigns
-   **Character Editing**: Update character details, HP, equipment, and backstory
-   **Seat Integration**: Characters automatically linked to campaign seats

### ✅ **Dice Rolling System**

-   **D&D Dice Mechanics**: Support for all standard dice (d4, d6, d8, d10, d12, d20, d100)
-   **Advanced Rolling**: Advantage/disadvantage, critical success/failure detection
-   **Character Integration**: Automatic stat bonuses for ability checks, saves, and skills
-   **Roll Types**: Attack rolls, saving throws, skill checks, ability checks, initiative, death saves
-   **Roll History**: Campaign-based roll tracking with detailed results
-   **Custom Dice**: Flexible dice notation parser (e.g., "2d6+3", "4d8", "1d20")
-   **Quick Actions**: One-click rolls for common D&D scenarios
-   **Dropdown Interface**: Organized dice selection with categories (Common, Damage, Hit Dice, etc.)
-   **Visual Design**: Dice icons and intuitive interface for better user experience

### ✅ **Seat Management System**

-   **Dynamic Seat Assignment**: Players can be assigned to specific seats
-   **AI Control Toggle**: Each seat can switch between human and AI control
-   **GM Seat Management**: Dedicated Game Master seat with human or AI options
-   **Character Integration**: Direct links to create or view characters from seats
-   **Real-time Updates**: Seat status updates reflect immediately across sessions

### ✅ **AI Model Integration**

-   **Model Registry**: Support for OpenAI, Anthropic, and local AI models
-   **Capability Tagging**: Models tagged for Player Character (PC) or Game Master (GM) use
-   **Cost Classification**: Models categorized by usage cost (low/medium/high)
-   **Campaign Whitelisting**: Restrict available AI models per campaign

## 🏗️ **Technical Architecture**

### **Packages**

-   `@dnd-ai/types` - Shared TypeScript interfaces and contracts
-   `@dnd-ai/api` - Fastify backend server with MongoDB integration
-   `@dnd-ai/web` - Next.js 14 frontend with TypeScript

### **Technology Stack**

-   **Backend**: Fastify, MongoDB, JWT authentication, bcrypt, Zod validation
-   **Frontend**: Next.js 14, React 18, TypeScript, responsive design
-   **Development**: Hot reloading, TypeScript compilation, prettier formatting
-   **Database**: MongoDB with native driver, indexed collections
-   **Dice Engine**: Custom dice rolling engine with D&D 5e rule integration

## 🚀 **Getting Started**

### **Prerequisites**

-   Node.js 18+ (managed with Volta)
-   MongoDB instance running on `localhost:27017`
-   npm or yarn package manager

### **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd dnd-ai

# Install dependencies
npm install

# Start development servers
npm run dev
```

### **Access Points**

-   **Frontend**: http://localhost:13000
-   **API**: http://localhost:13333
-   **Health Check**: http://localhost:13333/health

### **Development Commands**

```bash
npm run dev          # Start both API and web servers
npm run dev:api      # Start only the API server
npm run dev:web      # Start only the web frontend
npm run typecheck    # Run TypeScript compilation checks
npm run format       # Format code with Prettier
```

## 🎮 **User Flow**

1. **Authentication**: Register a new account or login with existing credentials
2. **Dashboard**: Navigate to create new campaigns, join existing ones, manage characters, or access dice roller
3. **Create Campaign**: Set up campaign with custom settings and AI preferences
4. **Join Campaign**: Browse available campaigns or enter room codes directly
5. **Seat Management**: Assign players to seats and configure AI assistance
6. **Character Creation**: Create D&D 5e characters with full stat management and backgrounds
7. **Character Management**: View, edit, and track character progression
8. **Dice Rolling**: Roll dice with automatic character bonuses, advantage/disadvantage, and result tracking
9. **Game Setup**: Begin gameplay with fully configured characters, campaigns, and integrated dice mechanics

## 🛠️ **Next Development Priorities**

### **Phase 1: Core Gameplay (High Priority)**

-   [x] **Character Creation System**: D&D 5e character sheets, stats, and equipment ✅
-   [x] **Dice Rolling System**: D&D dice notation with advantage/disadvantage ✅
-   [ ] **Enhanced Campaign Management**: Settings, permissions, and room code management
-   [ ] **Direct Seat Assignment**: Improved player-to-seat assignment interface

### **Phase 2: Interactive Features (Medium Priority)**

-   [ ] **Chat System**: In-campaign messaging with IC/OOC modes
-   [ ] **Game State Management**: Turn tracking, HP management, status effects
-   [ ] **Combat Initiative**: Turn order tracking and management

### **Phase 3: AI Enhancement (Medium Priority)**

-   [ ] **Real AI Integration**: Replace mock adapters with actual AI provider APIs
-   [ ] **Context-Aware AI**: Intelligent character actions and story suggestions
-   [ ] **AI Personalities**: Character templates and behavioral presets

### **Phase 4: Advanced Features (Lower Priority)**

-   [ ] **Real-time Multiplayer**: WebSocket integration for live updates
-   [ ] **Content Management**: Campaign notes, NPC management, map tools
-   [ ] **Adventure Modules**: Pre-built campaigns and story templates

## 🔧 **API Endpoints**

### **Authentication**

-   `POST /auth/register` - User registration
-   `POST /auth/login` - User login
-   `GET /auth/me` - Verify current user session

### **Campaigns**

-   `GET /campaigns` - List all campaigns
-   `POST /campaigns` - Create new campaign (protected)
-   `POST /campaigns/join` - Join campaign by room code (protected)

### **Seat Management**

-   `POST /campaigns/:id/seat/ai` - Toggle AI control for seat
-   `POST /campaigns/:id/seat/human` - Assign human player to seat

### **Characters**

-   `POST /characters` - Create new character (protected)
-   `GET /characters/:id` - Get character details (protected)
-   `PUT /characters/:id` - Update character (protected)
-   `GET /campaigns/:id/characters` - Get all characters in campaign (protected)
-   `GET /my-characters` - Get user's characters (protected)

### **Dice Rolling**

-   `POST /roll/character` - Roll dice for character with bonuses (protected)
-   `POST /roll/preset/:type` - Preset character rolls (attack, save, skill, etc.) (protected)
-   `POST /roll/custom` - Custom dice notation rolls
-   `GET /campaigns/:id/rolls` - Get campaign roll history (protected)
-   `GET /dice/suggestions` - Get dice notation suggestions

### **AI Models**

-   `GET /models` - Get available AI models and capabilities

## 📝 **Database Schema**

### **Collections**

-   **users**: User accounts with authentication data
-   **campaigns**: Campaign configurations and settings
-   **players**: Player profiles and character associations
-   **characters**: Complete D&D 5e character sheets with stats, equipment, and backstory
-   **rollHistory**: Campaign-based dice roll history and results

### **Key Data Structures**

-   **CampaignConfig**: Campaign settings, seats, and AI model whitelist
-   **SeatAssignment**: Player assignments and AI configuration per seat
-   **UserAccount**: Authentication and profile information
-   **CharacterSheet**: Full D&D character data with automatic calculations
-   **DiceRoll**: Roll results with notation, modifiers, and critical detection
-   **CampaignRollHistory**: Time-ordered roll history per campaign

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 **License**

This project is licensed under the MIT License - see the LICENSE file for details.
