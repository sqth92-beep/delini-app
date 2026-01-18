import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { visitorCounter, adminUsers } from "@shared/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "delini_secure_key_2026";
const TOKEN_EXPIRY = "30d";

const publicRoutes = [
  "/api/visitors/count",
  "/api/visitors/increment",
  "/api/categories",
  "/api/businesses",
  "/api/offers",
  "/api/offers/active",
  "/api/businesses/:businessId/reviews",
  "/api/admin/login"
];

function isPublicRoute(path: string): boolean {
  return publicRoutes.some(route => {
    const pattern = route.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });
}

function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  if (isPublicRoute(req.path)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    (req as any).admin = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
}

const loginAttempts = new Map<string, { count: number; lockedUntil: number | null }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000;

export async function registerRoutes(app: Express): Promise<void> {
  app.get("/api/visitors/count", async (_req, res) => {
    try {
      const counter = await db.select().from(visitorCounter).limit(1);
      res.json({ count: counter.length > 0 ? counter[0].count : 0 });
    } catch {
      res.json({ count: 0 });
    }
  });

  app.post("/api/visitors/increment", async (_req, res) => {
    try {
      let counter = await db.select().from(visitorCounter).limit(1);
      if (counter.length === 0) {
        await db.insert(visitorCounter).values({ count: 1 });
        res.json({ count: 1 });
      } else {
        const newCount = counter[0].count + 1;
        await db.update(visitorCounter).set({ count: newCount }).where(eq(visitorCounter.id, counter[0].id));
        res.json({ count: newCount });
      }
    } catch {
      res.status(500).json({ message: "Error updating visitor count" });
    }
  });

  app.get("/api/categories", async (_req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get("/api/businesses", async (req, res) => {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const search = req.query.search as string | undefined;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
    const cityId = req.query.cityId ? parseInt(req.query.cityId as string) : undefined;

    const businesses = await storage.getBusinesses(categoryId, search, minRating, cityId);
    res.json(businesses);
  });

  app.get("/api/offers", async (_req, res) => {
    const offers = await storage.getOffers();
    res.json(offers);
  });

  app.get("/api/offers/active", async (_req, res) => {
    const offers = await storage.getActiveOffers();
    res.json(offers);
  });

  const adminLoginSchema = z.object({
    username: z.string(),
    password: z.string()
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();

      const attempts = loginAttempts.get(clientIP);
      if (attempts?.lockedUntil && attempts.lockedUntil > now) {
        return res.status(429).json({ message: "Too many attempts, try later." });
      }

      const { username, password } = adminLoginSchema.parse(req.body);
      const admin = await storage.validateAdminPassword(username, password);
      if (!admin) {
        const current = loginAttempts.get(clientIP) || { count: 0, lockedUntil: null };
        current.count += 1;
        if (current.count >= MAX_LOGIN_ATTEMPTS) current.lockedUntil = now + LOCKOUT_DURATION;
        loginAttempts.set(clientIP, current);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      loginAttempts.delete(clientIP);

      await storage.updateAdminLastLogin(admin.id);
      const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

      res.json({ success: true, username: admin.username, token });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.get("/api/admin/me", authenticateAdmin, (req, res) => {
    res.json((req as any).admin);
  });

  app.get("/api/admin/categories", authenticateAdmin, async (_req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/admin/categories", authenticateAdmin, async (req, res) => {
    try {
      const data = req.body;
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ message: "Error creating category" });
    }
  });

  app.put("/api/admin/categories/:id", authenticateAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const category = await storage.updateCategory(id, req.body);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  });

  app.delete("/api/admin/categories/:id", authenticateAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteCategory(id);
    if (!deleted) return res.status(404).json({ message: "Category not found" });
    res.json({ success: true });
  });

  app.get("/api/admin/cities", authenticateAdmin, async (_req, res) => {
    const cities = await storage.getCities();
    res.json(cities);
  });

  app.post("/api/admin/cities", authenticateAdmin, async (req, res) => {
    const city = await storage.createCity(req.body);
    res.status(201).json(city);
  });

  app.delete("/api/admin/cities/:id", authenticateAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteCity(id);
    if (!deleted) return res.status(404).json({ message: "City not found" });
    res.json({ success: true });
  });

  app.get("/api/admin/businesses", authenticateAdmin, async (_req, res) => {
    const businesses = await storage.getBusinesses(undefined, undefined, undefined, undefined, true);
    res.json(businesses);
  });

  app.post("/api/admin/businesses", authenticateAdmin, async (req, res) => {
    const business = await storage.createBusiness(req.body);
    res.status(201).json(business);
  });

  app.put("/api/admin/businesses/:id", authenticateAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const business = await storage.updateBusiness(id, req.body);
    if (!business) return res.status(404).json({ message: "Business not found" });
    res.json(business);
  });

  app.delete("/api/admin/businesses/:id", authenticateAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteBusiness(id);
    if (!deleted) return res.status(404).json({ message: "Business not found" });
    res.json({ success: true });
  });

  app.get("/api/admin/offers", authenticateAdmin, async (_req, res) => {
    const offers = await storage.getOffers();
    res.json(offers);
  });

  app.post("/api/admin/offers", authenticateAdmin, async (req, res) => {
    const offer = await storage.createOffer(req.body);
    res.status(201).json(offer);
  });

  app.put("/api/admin/offers/:id", authenticateAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const offer = await storage.updateOffer(id, req.body);
    if (!offer) return res.status(404).json({ message: "Offer not found" });
    res.json(offer);
  });

  app.delete("/api/admin/offers/:id", authenticateAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteOffer(id);
    if (!deleted) return res.status(404).json({ message: "Offer not found" });
    res.json({ success: true });
  });

  app.get("/api/businesses/:businessId/reviews", async (req, res) => {
    const reviews = await storage.getReviews(parseInt(req.params.businessId));
    res.json(reviews);
  });

  app.post("/api/businesses/:businessId/reviews", async (req, res) => {
    const review = await storage.createReview({ ...req.body, businessId: parseInt(req.params.businessId) });
    res.status(201).json(review);
  });

  app.get("/api/admin/reviews", authenticateAdmin, async (_req, res) => {
    const reviews = await storage.getAllReviewsWithBusiness();
    res.json(reviews);
  });

  app.delete("/api/admin/reviews/:id", authenticateAdmin, async (req, res) => {
    const deleted = await storage.deleteReview(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Review not found" });
    res.json({ success: true });
  });

  app.get("/api/admin/settings", authenticateAdmin, async (_req, res) => {
    const settings = await storage.getAppSettings();
    res.json(settings);
  });

  app.put("/api/admin/settings", authenticateAdmin, async (req, res) => {
    const settings = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(settings)) {
      await storage.setAppSetting(key, value);
    }
    res.json({ success: true });
  });

  app.get("/api/admin/export/businesses", authenticateAdmin, async (_req, res) => {
    const businesses = await storage.getBusinesses();
    const csvHeader = "ID,Name,Category,Address,Phone,Verified,Rating,Tier\n";
    const csvRows = businesses.map(b => 
      `${b.id},"${b.name}","${b.category?.name || ''}","${b.address || ''}","${b.phone || ''}",${b.isVerified},${b.averageRating || 0},${b.subscriptionTier || 'trial'}`
    ).join("\n");
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=businesses.csv');
    res.send('\uFEFF' + csvHeader + csvRows);
  });
}
