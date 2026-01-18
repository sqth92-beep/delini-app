import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "./routes";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const corsOptions = {
  origin: [
    "https://delini-app.onrender.com", // Web URL
    "capacitor://localhost",           // Android APK
    "http://localhost",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const sessionSecret = process.env.SESSION_SECRET || "default_secret_for_build";

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "none", // Allows APK & cross-origin cookies
      secure: true,     // Required for sameSite: 'none'
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    console.log(`Server started on port ${port}`);
  });
})();
