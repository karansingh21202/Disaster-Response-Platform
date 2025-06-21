# Disaster Response Coordination Platform

A real-time, MERN-stack-powered platform for monitoring, reporting, and coordinating responses to disasters. It leverages AI for intelligent data analysis, provides a live geospatial map, and integrates social media feeds to provide a comprehensive operational picture.

## Table of Contents

- [About The Project](#about-the-project)
- [Screenshots](#screenshots)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

## About The Project

This platform is designed to be a centralized hub for disaster management teams. It allows users to report new disasters, view all active incidents on an interactive map, and get real-time updates from various sources. The integration of Google's Gemini AI for location extraction from text and image analysis makes data entry and verification faster and more accurate.

The backend is built with Node.js and Express, connected to a Supabase (PostgreSQL) database for robust, scalable data storage. The frontend is a responsive React application that provides a seamless user experience.

## Screenshots

Here's a glimpse of the platform in action.

**1. Create New Disaster Report**
![Create Disaster Form](./screenshots/01-create-disaster-form.png)

**2. Live Disaster Feed**
![Disaster List](./screenshots/02-disaster-list.png)

**3. Interactive Geospatial Map**
![Main Map View](./screenshots/03-main-map-view.png)

**4. Social Media Monitoring**
![Social Media Feed](./screenshots/04-social-media-feed.png)

**5. Intelligent Analysis & Geocoding**
![Analysis Tools](./screenshots/05-analysis-tools.png)

## Key Features

- **Disaster CRUD:** Full functionality to create, read, update, and delete disaster reports.
- **Interactive Map:** Uses `react-leaflet` to display disasters, resources, and social media activity on a live map.
- **AI-Powered Analysis:**
  - **Location Extraction:** Uses Google Gemini to automatically extract location names from unstructured text.
  - **Image Analysis:** Can analyze images to verify disaster types and severity.
- **Geocoding:** Converts addresses and place names into geographic coordinates (latitude/longitude) using the OpenStreetMap API.
- **Social Media Integration:** Monitors (mocked) social media feeds for relevant posts and displays them.
- **Real-time Updates:** The UI updates in real-time as new data becomes available.
- **Responsive UI:** Clean, modern user interface built with React.

## Tech Stack

- **Frontend:**
  - React.js
  - `axios` for API requests
  - `react-leaflet` for maps
  - Custom CSS
  - FontAwesome for icons
- **Backend:**
  - Node.js
  - Express.js
  - Supabase (PostgreSQL) for database
  - Google Gemini API for AI features
  - OpenStreetMap API for geocoding
- **Deployment:**
  - Backend deployed on [Render](https://render.com/)
  - Frontend deployed on [Vercel](https://vercel.com/)
  - Database hosted by [Supabase](https://supabase.com/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js and npm
  ```sh
  npm install npm@latest -g
  ```
- A Supabase account and project.
- A Google Gemini API key.

### Backend Setup

1. Clone the repo
   ```sh
   git clone https://github.com/your_username/citymall.git
   cd citymall
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Set up your Supabase database by running the `supabase_setup.sql` script in your Supabase project's SQL Editor.
4. Create a `.env` file in the root directory and add your environment variables (see `Environment Variables` section).
5. Start the backend server
   ```sh
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory
   ```sh
   cd frontend
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Start the React development server
   ```sh
   npm start
   ```
   The application will be available at `http://localhost:3000`.

## Environment Variables

You will need to create a `.env` file in the root directory for the backend server.

```env
PORT=3001
DATABASE_URL="your_supabase_connection_string"
SUPABASE_SERVICE_KEY="your_supabase_service_key"
GEMINI_API_KEY="your_google_gemini_api_key"
```

## Deployment

- The **backend** is set up for deployment on Render. Connect your Git repository to Render and use `npm install` as the build command and `npm start` as the start command.
- The **frontend** is a standard Create React App and can be deployed on any static site hosting service like Vercel or Netlify.
