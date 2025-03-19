# VVG Event Management Demo

A sleek, minimalist black and white themed web application designed to streamline event management, user registration, and security processes.

## Features

### User Portal
- User registration and authentication with email/password
- Profile management with photo upload
- Event browsing and registration
- Approval request submission for restricted events
- QR code generation for approved events
- Registration management

### Admin Portal (Coming Soon)
- Event management (create, edit, delete)
- User group management
- Approval request processing
- Security personnel management

### Security Portal (Coming Soon)
- QR code scanning for event entry
- Attendee verification with photos
- Attendance tracking

## Tech Stack

- **Frontend**: Next.js with App Router
- **UI Components**: Shadcn UI (Tailwind CSS-based)
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Animations**: Framer Motion
- **QR Code**: React QR Code

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/indian-embassy.git
cd indian-embassy
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your Firebase configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/app` - Next.js App Router pages
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and Firebase services
- `/src/context` - React context providers (auth, etc.)

## Deployment

### Deploy to Vercel

1. Fork or clone this repository to your GitHub account
2. Sign up for a free [Vercel](https://vercel.com) account
3. Create a new project in Vercel and link your GitHub repository
4. Under "Environment Variables", add your Firebase configuration:
   - NEXT_PUBLIC_FIREBASE_API_KEY
   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   - NEXT_PUBLIC_FIREBASE_APP_ID
   - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
5. Deploy the application

### Manual Deployment

You can also build the application manually:

```bash
npm run build
```

The built application will be in the `.next` directory, which you can deploy to any static hosting service.

## License

This project is proprietary and confidential.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Firebase](https://firebase.google.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [React QR Code](https://www.npmjs.com/package/react-qr-code)