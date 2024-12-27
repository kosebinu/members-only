const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const pool = require("./db");
const path = require("path");
const flash = require("connect-flash");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Configure Passport.js for authentication
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const res = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
            const user = res.rows[0];
            if (!user) {
                return done(null, false, { message: "Incorrect username or password" });
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: "Incorrect username or password" });
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        const user = res.rows[0];
        if (!user) return done(new Error("User not found"));
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || "secret", // Use environment variable for session secret
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // Set `secure: true` in production with HTTPS
    })
);

// Flash messages
app.use(flash());

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Middleware to make flash messages and user info available to all views
app.use((req, res, next) => {
    res.locals.user = req.user; // Make the logged-in user available to views
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// Routes
app.use("/", require("./routes"));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
