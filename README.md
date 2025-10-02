# Mobile PWA App

A modern Progressive Web App built with Next.js 14, TypeScript, and Tailwind CSS, optimized for mobile devices.

## Features

- 🚀 **Next.js 14** with App Router
- 📱 **Mobile-First Design** with responsive layouts
- 🎨 **Tailwind CSS** for modern styling
- 📦 **Progressive Web App** with offline support
- 🔧 **TypeScript** for type safety
- ⚡ **Fast Performance** with optimized caching
- 📲 **Install Prompt** for native app-like experience
- 🌙 **Dark Mode** support
- 📱 **Touch Optimized** interactions
- 🔐 **Supabase Authentication** with email/password and OAuth
- 👤 **User Management** with profiles and sessions

## PWA Features

- **Offline Support**: Advanced caching strategies for fonts, images, API calls, and static resources
- **App Installation**: Can be installed on mobile devices with install prompt
- **Service Worker**: Comprehensive background sync and caching with next-pwa
- **Web App Manifest**: Enhanced manifest with shortcuts, categories, and display modes
- **Push Notifications**: Full push notification support with VAPID keys
- **App Shortcuts**: Quick actions from the installed app icon
- **Offline Indicator**: Real-time online/offline status detection
- **PWA Status Dashboard**: Live monitoring of PWA capabilities

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd mobile-pwa-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Supabase Setup

This app uses Supabase for authentication and data storage. To set up Supabase:

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the database to be set up

2. **Get your credentials**:
   - Go to Project Settings > API
   - Copy the Project URL and anon/public key
   - Add them to your `.env.local` file

3. **Enable Authentication Providers** (optional):
   - Go to Authentication > Providers
   - Configure Google OAuth if you want social login
   - Set the redirect URL to: `your-domain.com/auth/callback`

4. **Database Setup** (optional):
   - The app works with just authentication
   - You can extend it by creating custom tables in the Supabase dashboard

## Authentication Features

- **Email/Password**: Standard email and password authentication
- **Google OAuth**: Sign in with Google (requires setup)
- **Session Management**: Automatic session handling and persistence
- **Protected Routes**: Authenticated users only see the main content
- **User Profiles**: Basic user information display

## PWA Enhancements

### Advanced Service Worker Configuration
- **Multiple Caching Strategies**: CacheFirst for fonts and images, NetworkFirst for APIs, StaleWhileRevalidate for static resources
- **Supabase Integration**: Optimized caching for Supabase API calls
- **Resource Optimization**: Separate cache buckets for different resource types

### Enhanced Web Manifest
- **App Shortcuts**: Quick access to key features from the app icon
- **Display Modes**: Support for window-controls-overlay and standalone modes
- **Categories**: Proper app categorization for app stores
- **Icon Optimization**: SVG icons for crisp display at any size

### Push Notification System
- **VAPID Support**: Industry-standard push notification authentication
- **Notification Actions**: Interactive notification buttons
- **Permission Management**: Graceful permission request handling
- **Test Notifications**: Built-in notification testing
- **Subscription Management**: Easy subscribe/unsubscribe functionality

### PWA Status Monitoring
- **Real-time Status**: Live monitoring of PWA capabilities
- **Installation Detection**: Automatic detection of standalone mode
- **Online/Offline Status**: Network connectivity monitoring
- **Feature Support Detection**: Automatic detection of browser PWA features

## Mobile Testing

To test the PWA features on mobile:

1. Deploy the app to a hosting service (Vercel, Netlify, etc.)
2. Open the deployed URL on a mobile device
3. Look for the "Install App" prompt in supported browsers
4. Add to home screen for native app experience

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles with mobile optimizations
│   ├── layout.tsx           # Root layout with PWA metadata
│   └── page.tsx             # Home page with install prompt
├── components/
│   ├── Header.tsx           # Responsive navigation header
│   ├── FeatureCard.tsx      # Feature showcase component
│   └── InstallPrompt.tsx    # PWA install prompt
public/
├── icons/                   # PWA icons in various sizes
├── manifest.json            # Web app manifest
└── ...
```

## Mobile Optimizations

- **Touch-friendly**: Large tap targets and touch optimizations
- **Viewport**: Proper mobile viewport configuration
- **Performance**: Optimized images and lazy loading
- **Gestures**: Smooth scrolling and native-like interactions
- **Safe Areas**: Support for notched devices
- **Responsive**: Mobile-first responsive design

## PWA Configuration

The app includes:
- Service worker for offline functionality
- Web app manifest for installation
- Caching strategies for optimal performance
- Background sync capabilities

## Browser Support

- Chrome/Edge (full PWA support)
- Safari (basic PWA support)
- Firefox (basic PWA support)

## Deployment

This app can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **GitHub Pages**
- Any static hosting service

For PWA features to work properly, the app must be served over HTTPS.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on mobile devices
5. Submit a pull request

## License

MIT License - see LICENSE file for details.