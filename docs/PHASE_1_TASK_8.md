# Phase 1 Task 8: Comprehensive Logging Infrastructure

## Overview

This task implements a production-grade logging infrastructure using **Winston** for application logging and **Morgan** for HTTP request logging. The logging system captures application lifecycle events, HTTP requests, database operations, authentication flows, and errors with structured JSON output for easy monitoring and debugging.

## Learning Objectives

By completing this task, you will:
- ✅ Understand centralized logging patterns in Node.js/Express applications
- ✅ Configure Winston logger with multiple transports (console, file)
- ✅ Integrate Morgan HTTP request logging with Winston
- ✅ Implement structured JSON logging for machine parsing
- ✅ Set up log rotation and file size management
- ✅ Add application-level logging throughout controllers
- ✅ Monitor logs in real-time and debug using log analysis
- ✅ Implement logging best practices for security and performance

## Architecture

### Logging Stack Components

```
┌─────────────────────────────────────────────────────────┐
│          Application & Express Requests                  │
├─────────────────────────────────────────────────────────┤
│                   logger.info()                          │
│                   Morgan middleware                      │
└────────────┬──────────────────────────────┬──────────────┘
             │                              │
             ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  Winston Logger Config   │    │   Morgan HTTP Logger     │
│  (src/config/logger.js)  │    │   (app.js integration)   │
└────────────┬─────────────┘    └────────────┬─────────────┘
             │                               │
    ┌────────┴──────────┬────────────┐       │
    │                   │            │       │
    ▼                   ▼            ▼       ▼
┌──────────┐  ┌─────────────┐  ┌──────────────┐
│ Console  │  │ error.log   │  │combined.log  │
│(Terminal)│  │(Errors only)│  │(All logs)    │
└──────────┘  └─────────────┘  └──────────────┘
```

### Log Format

**Winston JSON Format:**
```json
{
  "level": "info",
  "message": "User login successful",
  "timestamp": "2026-07-23T15:30:45.123Z",
  "userId": "507f1f77bcf86cd799439011",
  "action": "authentication"
}
```

**Morgan HTTP Request Format:**
```
GET /api/auth/me 200 2.345 ms - 512
POST /api/notes 201 5.678 ms - 1024
DELETE /api/me 204 1.234 ms - -
```

### Logging Levels

- **error** (0): Critical application failures (database errors, crashes, validation failures)
- **warn** (1): Warnings that don't stop execution (deprecated APIs, missing optional fields)
- **info** (2): General application events (startup, requests, authentication, state changes)
- **debug** (3): Detailed debugging information (variable values, function entry/exit)

### Transport Configuration

**Console Transport:**
- Outputs to terminal in real-time
- Best for development
- All levels

**File Transport (error.log):**
- Only ERROR level logs
- 10MB max file size
- Keeps last 5 rotated files
- Path: `logs/error.log`

**File Transport (combined.log):**
- All INFO and above logs
- 10MB max file size
- Keeps last 5 rotated files
- Path: `logs/combined.log`

## Implementation Steps

### Step 1: Verify Logger Configuration

**File:** `src/config/logger.js`

```javascript
import winston from "winston";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(dirname(__dirname)); // Go up to project root

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),

  transports: [
    new winston.transports.Console(),

    new winston.transports.File({
      filename: join(projectRoot, "logs", "error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: join(projectRoot, "logs", "combined.log"),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

export default logger;
```

**Key Points:**
- Uses `import.meta.url` to calculate absolute paths (ES modules)
- Combines multiple formats: timestamp, error stacks, JSON
- Console transport for development feedback
- Separate file transports for errors and all logs
- File rotation at 10MB with 5 backups

### Step 2: Verify Morgan Integration in app.js

**File:** `src/app.js` (lines 55-65)

```javascript
import morgan from "morgan";
import logger from "./config/logger.js";

// Use morgan for logging HTTP requests, integrated with winston logger
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);
logger.info("Morgan HTTP request logger initialized");
```

**Key Points:**
- `"combined"` format includes: IP, method, path, status, response time, size
- Custom stream writes to Winston logger instead of stdout
- `.trim()` removes trailing newlines from Morgan output
- Each HTTP request is logged as a structured entry

### Step 3: Add Application-Level Logging in Controllers

**File:** `src/controllers/auth.controller.js`

**Example: loginUser() function**

```javascript
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info("Login attempt", { email, action: "login_attempt" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      logger.warn("Login failed: user not found", { email });
      throw new AppError("User not found", 404);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn("Login failed: invalid password", { email });
      throw new AppError("Invalid password", 401);
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    logger.info("Login successful", { userId: user._id, email });

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Login error", { 
      error: error.message, 
      email: req.body.email 
    });
    // Error handler middleware will catch this
  }
};
```

**Example: registerUser() function**

```javascript
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    logger.info("Registration attempt", { email, username });

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      logger.warn("Registration failed: user exists", { email, username });
      throw new AppError("User already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "employee",
    });

    const accessToken = newUser.generateAccessToken();
    const refreshToken = newUser.generateRefreshToken();

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    logger.info("User registered successfully", { 
      userId: newUser._id, 
      email, 
      username 
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error", { 
      error: error.message, 
      email: req.body.email 
    });
  }
};
```

**Example: forgotPassword() function**

```javascript
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    logger.info("Password reset request", { email });

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Password reset requested for non-existent user", { email });
      throw new AppError("User not found", 404);
    }

    const resetToken = user.generatePasswordResetToken();
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    const resetUrl = `http://localhost:3000/api/auth/reset-password/${resetToken}`;
    logger.info("Password reset token generated", { 
      userId: user._id, 
      email,
      expiresIn: "1 hour"
    });

    // TODO: Send email with reset link
    console.log(`Reset link: ${resetUrl}`);

    res.status(200).json({
      message: "Password reset link sent to email",
    });
  } catch (error) {
    logger.error("Password reset error", { 
      error: error.message, 
      email: req.body.email 
    });
  }
};
```

**Example: refreshTokens() function**

```javascript
export const refreshTokens = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn("Refresh token missing in request");
      throw new AppError("Refresh token is required", 400);
    }

    logger.info("Token refresh attempt");

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || "");
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      logger.warn("Token refresh failed: invalid or expired token", { 
        userId: decoded.id 
      });
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    logger.info("Tokens refreshed successfully", { userId: user._id });

    res.status(200).json({
      message: "Tokens refreshed",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Token refresh error", { error: error.message });
  }
};
```

### Step 4: Global Error Handler Logging

**File:** `src/middleware/error.middleware.js`

```javascript
import logger from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
  const { statusCode = 500, message } = err;

  // Log error details
  logger.error("Request error", {
    message,
    statusCode,
    method: req.method,
    path: req.path,
    userId: req.user?._id,
    stack: err.stack,
  });

  res.status(statusCode).json({
    status: statusCode < 500 ? "fail" : "error",
    message,
  });
};
```

### Step 5: Database Operation Logging

**File:** `src/controllers/note.controller.js` (example)

```javascript
export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user._id;

    logger.info("Creating note", { userId, title });

    const note = await Note.create({
      title,
      content,
      owner: userId,
    });

    logger.info("Note created successfully", { 
      noteId: note._id, 
      userId 
    });

    res.status(201).json({
      message: "Note created successfully",
      note,
    });
  } catch (error) {
    logger.error("Note creation error", { 
      error: error.message, 
      userId: req.user._id 
    });
  }
};
```

## Testing & Validation

### Test Case 1: Verify Logger Initialization

**Steps:**
1. Start the server: `npm run dev`
2. Check console output for initialization messages
3. Verify `logs/combined.log` exists and contains entries

**Expected Output:**
```
MongoDB connected successfully
Initializing Express application...
Setting up CORS middleware
Cookie parser middleware initialized
...
Server is running on port 3000
```

**Validation:**
```bash
# Check log file
cat logs/combined.log | grep "Initializing Express"
# Should return: {"level":"info","message":"Initializing Express application...","timestamp":"..."}
```

### Test Case 2: Monitor HTTP Requests

**Steps:**
1. Make a test request: `curl http://localhost:3000/`
2. Check console for Morgan log
3. Verify entry in `combined.log`

**Command:**
```bash
curl http://localhost:3000/
```

**Expected Console Output:**
```
GET / 200 1.234 ms - 80
```

**Expected Log File Entry:**
```json
{
  "level": "info",
  "message": "GET / 200 1.234 ms - 80",
  "timestamp": "2026-07-23T15:35:22.456Z"
}
```

### Test Case 3: Test User Registration Logging

**Steps:**
1. Register a new user via POST `/api/auth/register`
2. Check both console and log files

**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Password123"}'
```

**Expected Log Entries:**
```json
{"level":"info","message":"Registration attempt","userId":"...","email":"test@example.com"}
{"level":"info","message":"User registered successfully","userId":"507f...","email":"test@example.com"}
```

### Test Case 4: Test Login Logging (Success & Failure)

**Success Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

**Expected Logs:**
```json
{"level":"info","message":"Login attempt","email":"test@example.com"}
{"level":"info","message":"Login successful","userId":"507f...","email":"test@example.com"}
```

**Failed Login (Wrong Password):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"WrongPassword"}'
```

**Expected Logs:**
```json
{"level":"info","message":"Login attempt","email":"test@example.com"}
{"level":"warn","message":"Login failed: invalid password","email":"test@example.com"}
```

### Test Case 5: Test Error Logging

**Steps:**
1. Make request with invalid data
2. Verify error logged in both `error.log` and `combined.log`

**Command (Missing required field):**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}'
```

**Expected Logs:**
```json
{"level":"error","message":"Registration error","error":"Email is required"}
```

### Test Case 6: Real-Time Log Monitoring

**PowerShell Command (Windows):**
```powershell
Get-Content -Path "logs/combined.log" -Tail 10 -Wait
```

**Expected Output:**
```
{"level":"info","message":"GET /api/auth/me 200 1.234 ms","timestamp":"2026-07-23T15:40:10.123Z"}
{"level":"info","message":"Login successful","userId":"507f...","email":"user@example.com"}
```

**Linux/macOS Command:**
```bash
tail -f logs/combined.log
```

## Troubleshooting

### Issue 1: Logger Not Writing to Files

**Symptoms:**
- `logs/combined.log` is empty or not created
- Only console output appears

**Root Causes:**
- Path calculation incorrect
- File permissions issue
- Winston directory doesn't exist

**Solutions:**
1. Verify absolute path calculation in `logger.js`:
```javascript
console.log("Project root:", projectRoot);
console.log("Combined log path:", join(projectRoot, "logs", "combined.log"));
```

2. Ensure `logs/` directory exists:
```bash
mkdir -p logs
```

3. Check file permissions:
```bash
ls -la logs/
chmod 755 logs/
```

4. Verify relative path is being used correctly:
```javascript
// WRONG - relative path doesn't work with Winston
filename: "logs/combined.log"

// CORRECT - absolute path
filename: join(projectRoot, "logs", "combined.log")
```

### Issue 2: Logs Not Appearing in Real-Time

**Symptoms:**
- File exists but doesn't update during requests
- Old logs visible but new ones missing

**Root Causes:**
- VS Code caching file content
- Winston buffering output
- File descriptor issues

**Solutions:**
1. Reload file in VS Code:
   - Right-click file in Explorer → "Revert File"
   - Close and reopen tab

2. Monitor logs from terminal instead:
```powershell
Get-Content -Path "logs/combined.log" -Tail 20 -Wait
```

3. Force flush Winston on shutdown:
```javascript
process.on("SIGTERM", () => {
  logger.close();
  process.exit(0);
});
```

### Issue 3: Morgan Not Logging HTTP Requests

**Symptoms:**
- HTTP request messages missing from logs
- Only app initialization logs visible

**Root Causes:**
- Morgan middleware not registered
- Incorrect middleware order
- Stream function not configured

**Solutions:**
1. Verify Morgan is registered AFTER security middleware:
```javascript
// Correct order
app.use(helmet());
app.use(rateLimit());
app.use(morgan(...)); // Morgan AFTER security middleware
```

2. Check stream configuration:
```javascript
// Correct
morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
})

// WRONG
morgan("combined", {
  stream: logger,
})
```

3. Verify Morgan is registered before route handlers:
```javascript
app.use(morgan(...)); // BEFORE routes
app.use("/api/auth", authRoutes); // AFTER Morgan
```

### Issue 4: Error Logs Not Separated from Combined Logs

**Symptoms:**
- `error.log` is empty
- All logs including errors in `combined.log`

**Root Causes:**
- Error transport `level: "error"` not configured
- Errors being caught before logger.error() call

**Solutions:**
1. Verify error transport configuration:
```javascript
new winston.transports.File({
  filename: join(projectRoot, "logs", "error.log"),
  level: "error",  // This is REQUIRED
  maxsize: 10485760,
  maxFiles: 5,
}),
```

2. Ensure errors are logged before being handled:
```javascript
catch (error) {
  logger.error("Operation failed", { 
    error: error.message,
    stack: error.stack 
  });
  // Then pass to error handler
}
```

### Issue 5: File Size Growing Too Large

**Symptoms:**
- Log files exceed expected size
- Application performance degradation
- Disk space issues

**Root Causes:**
- Excessive logging
- Log rotation not working
- `maxsize` configuration ignored

**Solutions:**
1. Verify rotation is configured:
```javascript
new winston.transports.File({
  filename: join(projectRoot, "logs", "combined.log"),
  maxsize: 10485760, // 10MB
  maxFiles: 5,       // Keep only 5 rotated files
}),
```

2. Reduce logging verbosity:
```javascript
// Log only important events, not every operation
logger.info("Important event only");

// Don't log every single variable value
logger.debug("Debug info"); // Use debug level for development
```

3. Implement log cleanup cron job (optional):
```javascript
import cron from "node-cron";

// Clean logs older than 30 days
cron.schedule("0 0 * * *", () => {
  logger.info("Running daily log cleanup");
  // Implementation: delete logs older than 30 days
});
```

### Issue 6: Timestamp Format Issues

**Symptoms:**
- Timestamps incorrect or missing
- Timezone information wrong

**Root Causes:**
- Winston format not including timestamp
- Timezone conversion issue

**Solutions:**
1. Verify timestamp format is included:
```javascript
format: winston.format.combine(
  winston.format.timestamp(), // REQUIRED
  winston.format.json(),
)
```

2. If timezone is wrong, specify in timestamp:
```javascript
winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss Z" })
```

## Production Considerations

### 1. Log Retention Policy

```javascript
// Implement log rotation by date
new winston.transports.File({
  filename: join(projectRoot, "logs", "combined.log"),
  maxsize: 10485760,      // 10MB per file
  maxFiles: 30,           // Keep 30 files
  timetamp: true,         // Add timestamp to rotated filenames
})
```

### 2. Sensitive Data Redaction

```javascript
// Don't log passwords or tokens
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  logger.info("Login attempt", { 
    email, 
    // password NOT logged
  });
  
  // ... rest of function
};
```

### 3. Structured Logging for Analysis

```javascript
// Use consistent field names for analytics
logger.info("User action", {
  action: "note_created",
  userId: user._id,
  noteId: note._id,
  timestamp: new Date(),
  duration: Date.now() - startTime,
});
```

### 4. Environment-Based Configuration

```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  
  transports: process.env.NODE_ENV === "production" 
    ? [
        // Production: Only file logging
        new winston.transports.File({
          filename: join(projectRoot, "logs", "combined.log"),
          maxsize: 10485760,
          maxFiles: 30,
        }),
      ]
    : [
        // Development: Console + files
        new winston.transports.Console(),
        new winston.transports.File({
          filename: join(projectRoot, "logs", "combined.log"),
        }),
      ]
});
```

### 5. Log Analysis & Monitoring

For production systems, integrate with log aggregation services:

```javascript
// Example: Elasticsearch integration
import ElasticsearchTransport from "winston-elasticsearch";

new ElasticsearchTransport({
  level: "info",
  clientOpts: { node: "http://localhost:9200" },
  index: "app-logs",
})
```

## Common Patterns

### Pattern 1: Log Request Start & Completion

```javascript
export const getUserById = async (req, res) => {
  const startTime = Date.now();
  const userId = req.params.id;

  logger.info("Fetching user", { userId });

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      logger.warn("User not found", { userId });
      throw new AppError("User not found", 404);
    }

    const duration = Date.now() - startTime;
    logger.info("User fetched successfully", { 
      userId, 
      duration: `${duration}ms` 
    });

    res.status(200).json({ user });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Get user error", { 
      error: error.message, 
      userId,
      duration: `${duration}ms`
    });
  }
};
```

### Pattern 2: Log State Transitions

```javascript
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const note = await Note.findById(id);
    
    if (!note) {
      logger.warn("Note not found", { noteId: id });
      throw new AppError("Note not found", 404);
    }

    const oldTitle = note.title;
    note.title = title;
    note.content = content;
    await note.save();

    logger.info("Note updated", {
      noteId: id,
      changes: {
        title: { old: oldTitle, new: title },
      },
    });

    res.status(200).json({ note });
  } catch (error) {
    logger.error("Note update error", { error: error.message });
  }
};
```

### Pattern 3: Log Third-Party Service Calls

```javascript
export const sendPasswordResetEmail = async (email, resetToken) => {
  logger.info("Sending password reset email", { email });

  try {
    // Call email service
    await emailService.send({
      to: email,
      subject: "Password Reset",
      template: "reset-password",
      context: { resetToken },
    });

    logger.info("Password reset email sent successfully", { email });
  } catch (error) {
    logger.error("Failed to send password reset email", {
      email,
      error: error.message,
    });
    
    // Still throw error to be caught by caller
    throw error;
  }
};
```

## Summary

✅ **Completed in this task:**
- Winston logger configuration with multiple transports
- Morgan HTTP request logging integration
- Absolute path resolution for log files
- Application-level logging in authentication controllers
- Error logging with full context
- Global error handler logging
- Database operation logging
- Real-time log monitoring setup

✅ **Testing Coverage:**
- Logger initialization verification
- HTTP request logging validation
- User registration logging
- Login success/failure logging
- Error logging separation
- Real-time monitoring

✅ **Troubleshooting Guides:**
- File not being written
- Logs not appearing in real-time
- Morgan not logging requests
- Error logs not separated
- File size management
- Timestamp issues

**Next Steps:**
1. Implement logger integration in all remaining controllers (note, profile, user)
2. Add email service integration for password reset
3. Set up log aggregation for production (Elasticsearch, Datadog, etc.)
4. Implement log analysis dashboards
5. Create alerting rules for error thresholds
