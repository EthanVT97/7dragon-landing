# 18K Chat - Modern Customer Service Platform

A modern, multi-language customer service platform built with Vue.js and Supabase.

## Features

- Real-time chat interface
- Multi-language support (Myanmar, Thai, English)
- Admin dashboard with CMS
- ChatBot integration with Dialogflow
- Analytics and reporting
- Role-based access control

## Tech Stack

- Frontend: Vue.js, SASS
- Backend: Supabase
- Real-time: Socket.io
- ChatBot: Dialogflow
- Authentication: Supabase Auth

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Add your Supabase and Dialogflow credentials
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Color Scheme

- Background: Midnight soft Moon (#000000)
- Primary: Deep green (#4B0082)
- Secondary: Neon Teal (#008080)
- Accent: Vibrant Green (#00FF7F)
- Highlights: Soft Cyan (#00FFFF)
- Text/Icons: Moonlight White (#FFFFE0)

## Project Structure

```
src/
├── assets/          # Static assets
├── components/      # Vue components
├── views/           # Page components
├── store/           # Vuex store
├── router/          # Vue router
├── plugins/         # Vue plugins
├── services/        # API services
├── utils/           # Utility functions
└── locales/         # Language files
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
