# AI Voice Assistant

A modern web application that allows users to have voice conversations with an AI using Retell AI. The application features a prominent voice button and supports file uploads for context-aware conversations.

## Features

- Sleek, modern UI with a prominent voice button
- Voice conversations with AI using Retell AI's Web Call SDK
- File upload for context-aware conversations
- Conversation history stored in a database
- User identification via UUID stored in cookies
- Responsive design with a black theme
- Wave animation and sound when AI is speaking

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Voice API**: Retell AI
- **File Processing**: Multer
- **Development**: Vite

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=12000
   RETELL_API_KEY=your_retell_api_key
   RETELL_AGENT_ID=your_retell_agent_id
   DATABASE_PATH=./server/database/conversations.db
   UPLOADS_PATH=./server/uploads
   ```
4. Start the server:
   ```
   npm start
   ```

## Development

To run both the backend and frontend in development mode:

```
npm run dev:all
```

To run only the backend server:

```
npm run dev
```

To run only the frontend development server:

```
npm run client
```

## Build

To build the frontend for production:

```
npm run build
```

## API Endpoints

- `GET /api/user` - Get or create user ID
- `GET /api/conversations` - Get conversation history
- `POST /api/conversations` - Save conversation message
- `POST /api/upload` - Upload file
- `GET /api/uploads` - Get uploaded files
- `POST /api/create-web-call` - Create a new web call with Retell AI

## Retell AI Setup

1. Create an account at [Retell AI](https://www.retellai.com/)
2. Create an agent in the Retell dashboard
3. Get your API key and agent ID
4. Add them to your `.env` file

## Demo Mode

The application includes a demo mode that simulates voice conversations without requiring a Retell AI account. This is useful for:

- Testing the application without Retell API credentials
- Demonstrating the UI and functionality
- Development and debugging

Demo mode is automatically activated when:
- Retell API credentials are invalid or missing
- The Retell account has exceeded its quota
- The Retell client fails to initialize

In demo mode, the application:
- Shows a "Demo Mode" badge in the header
- Simulates AI responses with predefined messages
- Displays wave animations when the simulated AI is "speaking"
- Stores conversation history in the database just like in normal mode

## License

ISC