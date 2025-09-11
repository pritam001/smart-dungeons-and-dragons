# DnD AI - Collaborative D&D Platform with AI Assistance

## 🔥 **Recent Updates**

-   ✅ **Enhanced Campaign Privacy & Management** - Private campaigns by default, public campaign browser, GM ownership transfer
-   ✅ **Player Management System** - Remove players from campaigns, regenerate room codes for security
-   ✅ **Campaign Lifecycle Tracking** - Planning → Active → Completed → Archived states with status management
-   ✅ **Campaign Configuration** - Privacy settings, descriptions, room code regeneration, and campaign notes
-   ✅ **Enhanced GM Campaign Management** - GMs can now add more seats to active campaigns dynamically
-   ✅ **Seat Management Overhaul** - GM-only AI controls, enhanced character management, smart back navigation
-   ✅ **Character Creation for Empty Seats** - GMs can create characters for any empty seat in their campaigns
-   ✅ **Streamlined Player Join Flow** - Removed confusing "Add Player" UI; players join naturally via room codes
-   ✅ **Join Campaign Fix** - Fixed navigation bug preventing campaign joining
-   ✅ **Character Edit Security** - Comprehensive anti-cheat system with permission validation
-   ✅ **Comprehensive Dice Rolling System** with D&D 5e mechanics
-   ✅ **Character Creation & Management** with full stat calculations
-   ✅ **Dropdown-based Dice Interface** for better user experience
-   ✅ **Roll History Tracking** per campaign
-   ✅ **Advantage/Disadvantage** and critical hit detection

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

-   **🎲 Create Campaigns**: Customize campaign name, description, privacy settings, player count (1-8 seats), GM type (human/AI)
-   **🔒 Campaign Privacy**: Private campaigns (default) only joinable via room code, public campaigns visible in browser
-   **📊 Campaign Lifecycle**: Formal campaign states (Planning → Active → Completed → Archived) with status tracking
-   **🛡️ GM Dashboard**: Dedicated "My Campaigns" page for GMs to manage all their campaigns with status controls
-   **� Room Code Management**: Regenerate room codes for security, easy copy-to-clipboard sharing
-   **👥 Player Management**: Remove players from campaigns (characters leave but stay owned by player)
-   **⚖️ GM Ownership Transfer**: Transfer GM role to another player in the campaign
-   **�🚀 Auto-Navigation**: Campaign creators automatically redirected to seat management
-   **📋 Browse Public Campaigns**: Visual campaign browser showing only public campaigns, room codes, and status
-   **🗡️ Join Campaigns**: Enter room codes for private campaigns or click-to-join public ones
-   **🔒 Duplicate Join Prevention**: Users cannot join the same campaign multiple times
-   **⚖️ Role Separation**: Campaign creators are automatically GMs and cannot join as players
-   **🪑 Seat Management**: Automatic assignment to available seats with full campaign validation
-   **➕ Dynamic Seat Addition**: GMs can add more seats to active campaigns (up to 8 total including GM)
-   **💾 Persistent Storage**: MongoDB integration for reliable data persistence

#### **GM Access Flow**

1. **Create Campaign** → Set privacy, description, and basic settings → Automatically redirected to seat management
2. **My Campaigns** → Access all campaigns where you're the GM with status and privacy indicators
3. **Campaign Status Management** → Update campaign lifecycle state (Planning/Active/Completed/Archived)
4. **Room Code Security** → Regenerate room codes when needed for campaign security
5. **Player Management** → Remove players from campaigns when necessary (D&D best practice: character leaves too)
6. **GM Transfer** → Transfer GM ownership to another player when stepping down
7. **Seat Management** → Full control over AI settings, characters, and players
8. **Add More Seats** → Dynamically expand campaign capacity as group grows
9. **Create Characters for Empty Seats** → Pre-create characters for future players
10. **Room Code Sharing** → Easy copy-to-clipboard for inviting players to private campaigns
11. **Back Navigation** → Context-aware navigation between campaign management screens

### ✅ **Character Creation & Management System**

-   **Full D&D 5e Character Sheets**: Complete character creation with stats, skills, and background
-   **Character Builder**: Interactive character creation with race, class, and background selection
-   **Ability Score Management**: Point-buy system with automatic modifier calculation
-   **Character Library**: View and manage all your characters across campaigns
-   **Permission-Based Editing**: Anti-cheat system with GM approval for mechanical changes
-   **Character Edit Modes**: Strict, Collaborative, and Sandbox modes for different campaign styles
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

-   **🛡️ GM-Only AI Controls**: Only Game Masters can toggle AI settings for any seat
-   **👥 Enhanced Character Management**: GMs can create/view all characters, players can view all but edit only their own
-   **� Character Creation for Empty Seats**: GMs can pre-create characters for any empty seat in their campaigns
-   **�🏠 Smart Navigation**: Context-aware back buttons return to seat management from character views
-   **➕ Add More Seats**: GMs can dynamically increase seat count for growing campaigns (max 8 total)
-   **📋 All Characters View**: Dedicated section showing all campaign characters with permission indicators
-   **🎯 Natural Join Flow**: Players join campaigns using room codes (no manual GM assignment needed)
-   **Dynamic Seat Assignment**: Players can be assigned to specific seats
-   **Character Integration**: Direct links to create or view characters from seats
-   **Real-time Updates**: Seat status updates reflect immediately across sessions

#### **Permission Matrix**

| Action                        | Player (Own Character) | Player (Campaign Member) | GM (Any Character) | Outsider |
| ----------------------------- | ---------------------- | ------------------------ | ------------------ | -------- |
| View Character                | ✅                     | ✅                       | ✅                 | ❌       |
| Edit Character                | ✅                     | ❌                       | ✅                 | ❌       |
| Create Character              | ✅                     | ❌                       | ✅                 | ❌       |
| Create Character (Empty Seat) | ❌                     | ❌                       | ✅                 | ❌       |
| Toggle AI Settings            | ❌                     | ❌                       | ✅                 | ❌       |
| Add Seats to Campaign         | ❌                     | ❌                       | ✅                 | ❌       |
| Remove Players                | ❌                     | ❌                       | ✅                 | ❌       |
| Transfer GM Ownership         | ❌                     | ❌                       | ✅                 | ❌       |
| Regenerate Room Code          | ❌                     | ❌                       | ✅                 | ❌       |
| Update Campaign Status        | ❌                     | ❌                       | ✅                 | ❌       |

#### **Character Access Rules**

-   **Character Owners**: Can always view and edit their own characters
-   **Campaign GMs**: Can view and edit all characters in their campaigns
-   **Campaign Members**: Can view all characters in campaigns they've joined
-   **Smart Navigation**: Context-aware back buttons work from any access state

### ✅ **AI Model Integration**

-   **Model Registry**: Support for OpenAI, Anthropic, and local AI models
-   **Capability Tagging**: Models tagged for Player Character (PC) or Game Master (GM) use
-   **Cost Classification**: Models categorized by usage cost (low/medium/high)
-   **Campaign Whitelisting**: Restrict available AI models per campaign

### ✅ **Character Permission System (Anti-Cheat)**

The permission system prevents players from cheating by controlling what aspects of characters can be edited:

#### **Security Implementation**

-   **🔒 Fully Secure**: All character editing endpoints enforce permission checks
-   **No Bypass Routes**: Deprecated insecure endpoints redirect through permission system
-   **Real-time Validation**: Dynamic schema validation based on user permissions
-   **GM Override**: Game Masters can make any changes when appropriate

#### **Character Edit Modes**

-   **Strict Mode** (Default): Only GMs can edit mechanical stats (stats, level, equipment, currency)
-   **Collaborative Mode**: Players can edit their own equipment and HP, but GMs control core stats
-   **Sandbox Mode**: Players have full control over their own characters (testing/casual play)

#### **Permission Matrix**

| Field                                    | Player (Strict) | Player (Collaborative) | Player (Sandbox) | GM (All Modes) |
| ---------------------------------------- | --------------- | ---------------------- | ---------------- | -------------- |
| Name, Backstory, Personality, Appearance | ✅              | ✅                     | ✅               | ✅             |
| Stats (STR, DEX, etc.)                   | ❌              | ❌                     | ✅               | ✅             |
| Level, Experience                        | ❌              | ❌                     | ✅               | ✅             |
| Hit Points                               | ❌              | ✅                     | ✅               | ✅             |
| Equipment                                | ❌              | ✅                     | ✅               | ✅             |
| Currency                                 | ❌              | ✅                     | ✅               | ✅             |

#### **API Endpoints**

-   `GET /characters/:id/permissions` - Check what user can edit
-   `PUT /characters/:id` - **Secure unified endpoint** with permission-based validation
-   `PUT /characters/:id/player-update` - Player-safe updates (roleplay only)
-   `PUT /characters/:id/gm-update` - GM updates (includes mechanical changes)

#### **Standalone Characters**

Characters created without campaigns use **Sandbox Mode** - owners have full control since there's no competitive context.

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
-   [x] **Enhanced Campaign Management**: GM dashboard, dynamic seat addition, room code management ✅
-   [x] **Direct Seat Assignment**: Natural join flow and GM seat management controls ✅
-   [x] **Campaign Configuration**: Privacy settings, descriptions, AI model restrictions, edit modes ✅
-   [x] **Player Management**: Remove players, transfer ownership, role management ✅
-   [x] **Campaign State Tracking**: Status management, session tracking, basic notes ✅

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
-   `PUT /campaigns/:id` - Update campaign details (GM only, protected)
-   `POST /campaigns/join` - Join campaign by room code (protected)
-   `POST /campaigns/:id/remove-player` - Remove player from campaign (GM only, protected)
-   `POST /campaigns/:id/transfer-gm` - Transfer GM ownership to another player (GM only, protected)
-   `POST /campaigns/:id/regenerate-code` - Generate new room code for security (GM only, protected)

### **Seat Management**

-   `POST /campaigns/:id/seat/ai` - Toggle AI control for seat
-   `POST /campaigns/:id/seat/human` - Assign human player to seat
-   `POST /campaigns/:id/seats/add` - Add more seats to active campaign (GM only)

### **Characters**

-   `POST /characters` - Create new character (protected)
-   `GET /characters/:id` - Get character details (protected)
-   `PUT /characters/:id` - Update character (legacy, unrestricted)
-   `GET /characters/:id/permissions` - Get user's edit permissions for character (protected)
-   `PUT /characters/:id/player-update` - Player-safe character updates (protected)
-   `PUT /characters/:id/gm-update` - GM character updates with mechanical changes (protected)
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

## 🔗 **Entity Relationships**

Understanding how Users, Players, Campaigns, and Characters relate to each other in the D&D AI system:

### **Core Relationships**

```
┌─────────────┐    creates    ┌─────────────┐
│    User     │──────────────▶│ PlayerProfile│
│(auth/login) │               │ (campaign)  │
└─────────────┘               └─────────────┘
                                      │
                              joins   │
                                 ┌────▼────┐
                                 │Campaign │
                                 └────┬────┘
                                      │ has
                                 ┌────▼────┐
                                 │  Seat   │
                                 └────┬────┘
                                      │ can use
┌─────────────┐    owns        ┌─────▼─────┐
│   Player    │──────────────▶ │Character  │
│             │                │           │
└─────────────┘                └───────────┘
```

### **1. Users → Players (1:1)**

-   **User**: Authenticated account with login credentials (`users` collection)
-   **Player**: Same person's profile when participating in campaigns (`players` collection)
-   **Relationship**: Each User gets a PlayerProfile created when joining their first campaign

### **2. Players → Campaigns (M:M)**

-   **Join Process**: Players join campaigns using room codes
-   **Access Control**: Players can only access campaigns they've joined
-   **Storage**: Tracked via `SeatAssignment.humanPlayerId` in campaign seats

### **3. Campaigns → Seats (1:M)**

-   **Seats**: Each campaign has 1-8 player seats + 1 GM seat
-   **Types**: `player` seats and `gm` seat
-   **Assignment**: Seats can be empty, human-controlled, AI-controlled, or hybrid

### **4. Characters → Players (M:1)**

-   **Ownership**: Each character belongs to exactly one player
-   **Collection**: Players can own multiple characters
-   **Independence**: Characters can exist without being assigned to campaigns

### **5. Characters → Campaigns (M:1, Optional)**

-   **Campaign Assignment**: Characters can optionally be assigned to campaigns
-   **Flexibility**: Characters can be created standalone (no campaign required)
-   **Linking**: When assigned, `campaignId` and `seatId` are set

### **User Journey Flow**

1. **User Registration** → Creates `UserAccount`
2. **Join Campaign** → Creates `PlayerProfile` (if first time)
3. **Seat Assignment** → Links player to campaign seat
4. **Character Creation** → Creates character (optionally linked to seat)
5. **Gameplay** → Character actions within campaign context

### **Character Flexibility**

-   **Standalone Characters**: Created without campaigns for personal use
-   **Campaign Characters**: Created for specific campaign seats
-   **Character Portability**: Characters can potentially be moved between campaigns

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 **License**

This project is licensed under the MIT License - see the LICENSE file for details.
