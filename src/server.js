import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import expressLayouts from "express-ejs-layouts";
import session from "express-session";
import cookieParser from "cookie-parser";
import csurf from "csurf";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { config } from "./config.js";
import { pagesRouter } from "./routes/pages.js";
import { adminRouter } from "./routes/admin.js";
import { apiRouter } from "./routes/api.js";
import { consumeFlash } from "./lib/flash.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/**
 * Behind Caddy (reverse proxy) you want:
 * - TRUST_PROXY=true so req.ip is correct and secure cookies work
 */
if (config.trustProxy) {
  app.set("trust proxy", 1);
}

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(expressLayouts);
app.set("layout", "layout");

// logging
app.use(morgan("tiny"));

// security headers (CSP off because templates use CDN assets)
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// static assets: src/public -> /
app.use(express.static(path.join(__dirname, "public")));

// parsers
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cookieParser());

/**
 * Session cookies:
 * - secure should be true when behind HTTPS (Caddy)
 * - but if trustProxy is false, secure cookies won't set on http://localhost
 */
app.use(
  session({
    name: "p2dc.sid",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.trustProxy, // IMPORTANT: true in prod behind Caddy HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
    },
  }),
);

// rate limit POSTs (basic anti-abuse)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    skip: (req) => req.method === "GET" || req.method === "HEAD",
  }),
);

// CSRF protection (applies to non-GET methods)
app.use(csurf());

// locals for templates
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.flash = consumeFlash(req);
  res.locals.title = "Petition2DC";
  res.locals.isAdmin = Boolean(req.session?.isAdmin);
  res.locals.currentPath = req.path;
  res.locals.baseUrl = config.baseUrl;
  next();
});

// routes
app.use(apiRouter);
app.use(adminRouter);
app.use(pagesRouter);

// CSRF errors + generic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.code === "EBADCSRFTOKEN") {
    res.status(403).render("pages/not-found", {
      message: "Form expired (CSRF check failed). Refresh and try again.",
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).render("pages/not-found", { message: "Server error." });
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Petition2DC running on http://localhost:${config.port}`);
});
