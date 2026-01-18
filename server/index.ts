import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();

app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin"]
}));

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  try {
    await registerRoutes(app);
    
    const port = process.env.PORT || 5000;
    app.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();
