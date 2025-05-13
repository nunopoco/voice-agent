# AI Voice Assistant

A modern web application that allows users to have voice conversations with an AI using VAPI. The application features a prominent voice button and supports file uploads for context-aware conversations.

## Features

- Sleek, modern UI with a prominent voice button
- Voice conversations with AI using VAPI
- File upload for context-aware conversations
- Conversation history stored in a database
- User identification via UUID stored in cookies
- Responsive design with a black theme
- Wave animation and sound when AI is speaking

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Voice API**: VAPI
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
   VAPI_API_KEY=your_vapi_api_key
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

## License

ISC