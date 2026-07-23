# Phase 1 Task 7 - Security Hardening & Input Validation

## Overview

Phase 1 Task 7 implements comprehensive security hardening for the Express API server. This feature includes:

- **HTTP Headers Security:** Helmet middleware for setting secure headers
- **Rate Limiting:** Protect against brute force and DoS attacks
- **NoSQL Injection Prevention:** Mongo sanitization to prevent database injection
- **Parameter Pollution Protection:** HPP middleware to prevent HTTP parameter pollution attacks
- **CORS Configuration:** Secure cross-origin resource sharing
- **Input Validation:** Sanitize and validate all user inputs

These security layers work together to create a production-ready API that resists common attacks.

---

## Architecture

### Security Middleware Stack

```
HTTP Request
    ↓
CORS Validation (Allow only from http://localhost:3000)
    ↓
Cookie Parser (Parse incoming cookies)
    ↓
Static Files Handler (/uploads route)
    ↓
JSON Body Parser (Parse JSON requests)
    ↓
Helmet Headers (Set security headers)
    ↓
Rate Limiter (Limit 5 requests per 15 minutes per IP)
    ↓
MongoDB Sanitizer (Remove dangerous characters for NoSQL)
    ↓
HPP Filter (Remove duplicate parameters)
    ↓
Route Handler (Express routes)
    ↓
Response Sent
```

### Security Threats Mitigated

| Threat | Middleware | How It Works |
|--------|-----------|-------------|
| **XSS** | Helmet | Sets Content-Security-Policy headers |
| **Clickjacking** | Helmet | Sets X-Frame-Options header |
| **NoSQL Injection** | mongo-sanitize | Removes `$` and `.` from input |
| **Parameter Pollution** | HPP | Removes duplicate query parameters |
| **Brute Force** | Rate Limiter | Limits requests per IP |
| **MIME Sniffing** | Helmet | Sets X-Content-Type-Options header |
| **CORS Abuse** | CORS Middleware | Restricts origin to trusted domain |

---

## Setup Steps

### Step 1: Install Security Packages

```bash
npm install helmet express-rate-limit express-mongo-sanitize hpp cors cookie-parser
```

**Packages Installed:**
- `helmet` - HTTP headers security
- `express-rate-limit` - Rate limiting
- `express-mongo-sanitize` - NoSQL injection prevention
- `hpp` - HTTP Parameter Pollution protection
- `cors` - CORS configuration
- `cookie-parser` - Cookie parsing (usually pre-installed)

---

### Step 2: Import Security Middleware

**Location:** `src/app.js`

```javascript
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

const app = express();
```

---

### Step 3: Configure CORS

**Location:** `src/app.js` (early in middleware chain)

```javascript
// Configure CORS middleware to allow requests from the frontend
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    credentials: true, // Allow credentials (cookies)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

**Configuration:**
- `origin` - Only allow requests from this domain (prevents CORS abuse)
- `credentials` - Allow cookies and authentication headers
- `methods` - Whitelist allowed HTTP methods
- `allowedHeaders` - Whitelist allowed request headers

**For Production:**
```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
```

---

### Step 4: Add Basic Middleware

**Location:** `src/app.js`

```javascript
app.use(cookieParser());                    // Parse cookies
app.use("/uploads", express.static("uploads")); // Serve static files
app.use(express.json());                    // Parse JSON body
```

---

### Step 5: Apply Helmet Security Headers

**Location:** `src/app.js`

```javascript
// Middleware to set various HTTP headers for security
app.use(helmet());
```

**What Helmet Does:**
```
Content-Security-Policy: Prevents XSS attacks
X-Frame-Options: Prevents clickjacking
X-Content-Type-Options: Prevents MIME sniffing
Strict-Transport-Security: Enforces HTTPS
X-XSS-Protection: Browser XSS filter
Referrer-Policy: Controls referrer information
```

**Custom Configuration (Optional):**
```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

---

### Step 6: Configure Rate Limiting

**Location:** `src/app.js`

```javascript
// Rate limiting middleware to limit the number of requests
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5,                     // Max 5 requests per window per IP
  message: {
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false,       // Disable X-RateLimit-* headers
});

// Apply to all requests
app.use(authLimiter);
```

**Rate Limiting Tiers (for production):**
```javascript
// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
});

// Moderate limit for API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 requests per minute
});

// Relaxed limit for GET requests
const getLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200, // 200 requests per minute
});

// Apply selectively
app.use("/api/auth", authLimiter);
app.use("/api/", apiLimiter);
```

---

### Step 7: Add NoSQL Injection Protection

**Location:** `src/app.js`

```javascript
// Middleware to sanitize user input and prevent NoSQL injection
app.use(mongoSanitize());
```

**What It Does:**
```javascript
// Before sanitization:
{ email: { $gt: "" } }  ← Could bypass authentication

// After sanitization:
{ email: "" }  ← Safe, removes $ and . characters
```

**Configuration Options:**
```javascript
app.use(
  mongoSanitize({
    replaceWith: "_", // Replace dangerous chars with underscore
    onSanitize: ({ req, key }) => {
      console.log(`Sanitized key: ${key}`);
    },
  }),
);
```

---

### Step 8: Add Parameter Pollution Protection

**Location:** `src/app.js`

```javascript
// Middleware to prevent HTTP Parameter Pollution attacks
app.use(hpp());
```

**What It Does:**
```
// Before HPP:
?email=test@example.com&email=admin@example.com

// After HPP (keeps last value):
?email=admin@example.com

// Or with whitelist:
hpp({
  whitelist: ["search", "sort", "page"]
})
```

---

### Step 9: Add Input Validation Middleware (Optional)

**Location:** `src/middleware/validation.middleware.js`

```javascript
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

export const validateUsername = (username) => {
  // 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};
```

**Usage in Controllers:**
```javascript
import { validateEmail, validatePassword } from "../middleware/validation.middleware.js";

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  
  // Validate inputs
  if (!validateEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  
  if (!validatePassword(password)) {
    return res.status(400).json({ 
      message: "Password must be at least 6 characters with uppercase, lowercase, and number" 
    });
  }
  
  // ... rest of registration logic
};
```

---

## Configuration Details

### Helmet Security Headers

| Header | Purpose | Value |
|--------|---------|-------|
| `Content-Security-Policy` | Prevent XSS attacks | `default-src 'self'` |
| `X-Frame-Options` | Prevent clickjacking | `DENY` |
| `X-Content-Type-Options` | Prevent MIME sniffing | `nosniff` |
| `Strict-Transport-Security` | Force HTTPS | `max-age=31536000` |
| `X-XSS-Protection` | Enable XSS filter | `1; mode=block` |
| `Referrer-Policy` | Control referrer info | `strict-origin-when-cross-origin` |

### Rate Limiting Settings

**Development:**
```javascript
windowMs: 15 * 60 * 1000,  // 15 minutes
max: 5                      // 5 requests
```

**Production:**
```javascript
windowMs: 15 * 60 * 1000,  // 15 minutes
max: 5                      // 5 login attempts per IP per 15 min
// For API: max: 100 requests per minute
```

### MongoDB Sanitization

Removes these dangerous patterns:
- `$` - Used in MongoDB operators ($gt, $lt, $regex, etc.)
- `.` - Used to access nested fields

Example:
```javascript
// Dangerous input
{ email: { $ne: null } }

// After sanitization
{ email: "" }
```

---

## API Documentation

### Security Headers Response

When you make a request to the API, you'll receive security headers:

```bash
curl -v http://localhost:3000/api/auth/me
```

**Response Headers:**
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

### Rate Limiting Response

When rate limit is exceeded:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
# (repeat 5+ times)
```

**Response (429 Too Many Requests):**
```json
{
  "message": "Too many requests. Please try again later."
}
```

**Headers:**
```
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1721743200
Retry-After: 900
```

---

## Testing Guide

### Test Case 1: Verify Helmet Headers

**Command:**
```bash
curl -v http://localhost:3000/api/auth/me \
  -H "Cookie: token=any_token" | grep -i "X-Frame-Options\|Content-Security-Policy"
```

**Expected Headers:**
```
< X-Frame-Options: DENY
< Content-Security-Policy: default-src 'self'
< X-Content-Type-Options: nosniff
< X-XSS-Protection: 1; mode=block
```

**Validation:**
- ✅ Headers are present
- ✅ X-Frame-Options is DENY
- ✅ Content-Security-Policy is set
- ✅ X-Content-Type-Options is nosniff

---

### Test Case 2: Test Rate Limiting

**Command (run 6 times):**
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' \
    -w "\nRequest $i - Status: %{http_code}\n"
done
```

**Expected Results:**
```
Request 1 - Status: 404 (User not found)
Request 2 - Status: 404 (User not found)
Request 3 - Status: 404 (User not found)
Request 4 - Status: 404 (User not found)
Request 5 - Status: 404 (User not found)
Request 6 - Status: 429 (Too Many Requests)
```

**Validation:**
- ✅ First 5 requests succeed (return auth errors)
- ✅ 6th request returns 429 (rate limited)
- ✅ RateLimit headers present

---

### Test Case 3: Test NoSQL Injection Prevention

**Malicious Input (without sanitization):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": { "$ne": null },
    "password": { "$gt": "" }
  }'
```

**Expected Response:**
```json
{
  "message": "User not found"
}
```

**Validation:**
- ✅ Malicious payload doesn't bypass authentication
- ✅ Request is treated as invalid input
- ✅ Database is safe from injection

**What Would Happen Without Sanitization:**
```
User.findOne({ email: { "$ne": null } }) 
// Would match ANY user with non-null email
// Would bypass authentication
```

---

### Test Case 4: Test Parameter Pollution

**Command:**
```bash
curl -X GET "http://localhost:3000/api/notes?search=note1&search=note2"
```

**Expected Behavior:**
```javascript
// Without HPP:
req.query.search = ["note1", "note2"]  // Array causes confusion

// With HPP:
req.query.search = "note2"  // Last value kept
```

**Validation:**
- ✅ Only last parameter value is used
- ✅ Duplicate parameters are removed
- ✅ No ambiguity in request processing

---

### Test Case 5: Test CORS Validation

**Valid Request (from allowed origin):**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Origin: http://localhost:3000" \
  -H "Cookie: token=valid_token"
```

**Expected:**
```
< Access-Control-Allow-Origin: http://localhost:3000
< Access-Control-Allow-Credentials: true
```

**Invalid Request (from different origin):**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Origin: http://malicious-site.com"
```

**Expected:**
```
< Access-Control-Allow-Origin: (not present)
```

**Validation:**
- ✅ Allowed origin receives CORS headers
- ✅ Disallowed origin receives no CORS headers
- ✅ Browser will block cross-origin requests

---

### Test Case 6: Full Security Stack Test

**Setup:**
```bash
# 1. Create a test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "sectest",
    "email": "sectest@example.com",
    "password": "SecurePass123"
  }'

# 2. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sectest@example.com",
    "password": "SecurePass123"
  }' | jq -r '.token')

# 3. Make authenticated request
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: token=$TOKEN" \
  -v
```

**Verification Checklist:**
- ✅ All security headers present
- ✅ Rate limit headers correct
- ✅ CORS headers present
- ✅ Request succeeds (200 OK)
- ✅ User data returned

---

## Troubleshooting

### Issue 1: CORS Error - "Access to XMLHttpRequest blocked"

**Cause:** Frontend domain not in CORS whitelist

**Solution:**
```javascript
// Update src/app.js
app.use(
  cors({
    origin: "https://your-frontend-domain.com", // Add your domain
    credentials: true,
  }),
);
```

**Test:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Origin: https://your-frontend-domain.com" \
  -H "Cookie: token=test"
```

---

### Issue 2: Rate Limit Too Strict

**Cause:** 5 requests in 15 minutes is too restrictive for testing

**Solution:**
```javascript
// For development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increase for dev
  skip: process.env.NODE_ENV === "development", // Disable in dev
});
```

---

### Issue 3: Legitimate Input Being Sanitized

**Cause:** User enters data with `$` or `.` that's valid

**Example:** Email with multiple dots
```
email: "user.name@domain.co.uk"
```

**Solution:**
```javascript
// MongoDB sanitization only affects objects, not strings in email field
// This is safe because email is a string value, not an object

// Only dangerous if input is object:
{ email: { $gt: "" } }  // ← This gets sanitized
{ email: "user@domain.com" } // ← This is safe (it's a string)
```

---

### Issue 4: Headers Not Appearing

**Cause:** Middleware not applied or middleware order wrong

**Solution:**
```javascript
// Middleware order matters! Helmet must come before routes
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());

// Then routes
app.use("/api/auth", authRoutes);
```

---

### Issue 5: "payload too large" Error

**Cause:** Large JSON body exceeds parser limit

**Solution:**
```javascript
// Increase limit for JSON parser
app.use(express.json({ limit: '10mb' }));

// For URL encoded
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

---

## Security Best Practices

### Development Checklist

- ✅ Install helmet for HTTP headers
- ✅ Configure rate limiting per endpoint
- ✅ Add MongoDB sanitization
- ✅ Enable HPP protection
- ✅ Configure CORS for your domain
- ✅ Validate all user inputs
- ✅ Use HTTPS in production
- ✅ Set secure cookie options

### Production Hardening

**1. HTTPS Only:**
```javascript
app.use(helmet({
  hsts: {
    maxAge: 31536000,        // 1 year
    includeSubDomains: true,
    preload: true,
  }
}));
```

**2. Environment-Based Configuration:**
```javascript
const corsOrigin = process.env.FRONTEND_URL || "http://localhost:3000";
const isProduction = process.env.NODE_ENV === "production";

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: isProduction ? 15 * 60 * 1000 : 60 * 1000,
  max: isProduction ? 5 : 100,
  skip: !isProduction, // Disable in dev
});
```

**3. Security Logging:**
```javascript
app.use((req, res, next) => {
  console.log({
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date(),
  });
  next();
});
```

**4. Error Handling (Don't Expose Details):**
```javascript
// Development (detailed errors)
if (process.env.NODE_ENV === "development") {
  console.error(error);
}

// Production (generic errors)
res.status(500).json({
  message: "Internal server error",
  // Don't include: error: error.message
});
```

---

## File Structure

After Task 7 completion, your project structure should include:

```
src/
├── app.js                         [UPDATED] Added security middleware
├── middleware/
│   ├── auth.middleware.js         [Existing]
│   ├── upload.middleware.js       [Existing]
│   └── validation.middleware.js   [NEW] Input validation
├── controllers/
│   └── auth.controller.js         [Existing]
└── routes/
    └── auth.routes.js            [Existing]
```

### Modified Files Summary

**src/app.js**
- Added: `helmet()` for HTTP headers
- Added: `rateLimit()` for request throttling
- Added: `mongoSanitize()` for NoSQL injection prevention
- Added: `hpp()` for parameter pollution protection
- Updated: `cors()` configuration
- Order: CORS → Helmet → Rate Limit → Sanitize → HPP

**src/middleware/validation.middleware.js** (NEW)
- Added: `validateEmail()` function
- Added: `validatePassword()` function
- Added: `validateUsername()` function

---

## Summary

Task 7 implements a comprehensive security framework with:

✅ HTTP headers security (Helmet)  
✅ Rate limiting (5 requests per 15 minutes)  
✅ NoSQL injection prevention (mongo-sanitize)  
✅ Parameter pollution protection (HPP)  
✅ CORS configuration (localhost:3000)  
✅ Input validation helpers  
✅ Security logging setup  
✅ Production-ready configuration  
✅ Complete testing guide (6 test cases)  
✅ Troubleshooting for common issues  

The security stack protects against:
- Cross-Site Scripting (XSS)
- Clickjacking
- MIME sniffing
- NoSQL injection
- Parameter pollution
- Brute force attacks
- CORS abuse

All layers work together to create a robust, production-ready API backend.
