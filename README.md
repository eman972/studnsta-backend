# Backend structure

```
backend/
├── server.js              # Thin entry → src/server.js
├── package.json
├── .env / .env.example
├── uploads/               # Local file storage (avatars, PDFs, files)
├── scripts/               # One-off seeds & utilities
├── tests/                 # Jest tests
└── src/
    ├── app.js             # Express app + route mounting
    ├── server.js          # HTTP server, DB connect, Socket.io boot
    ├── config/
    │   ├── db.js          # Mongo connection
    │   ├── env.js         # Loads .env from project root
    │   └── paths.js       # ROOT / UPLOADS path helpers
    ├── sockets/           # Realtime event handlers
    ├── middleware/        # Auth, RBAC, rate limits, audit, uploads
    ├── models/            # Mongoose schemas
    ├── controllers/       # Request handlers
    ├── routes/            # Express routers
    └── utils/             # Tokens, mailer, storage, quiz helpers
```

## Run

```bash
npm run dev    # nodemon watches src/
npm start
npm test
npm run seed:flags
```
