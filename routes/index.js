const express = require("express");
const router = express.Router();
const pool = require("../db");
const passport = require("passport");
const { isAuthenticated } = require("../middleware/auth");

// Root route: Display all messages
router.get("/", async (req, res) => {
    try {
        // Fetch all messages from the database
        const messagesResult = await pool.query(
            `SELECT messages.*, users.full_name 
             FROM messages 
             JOIN users ON messages.user_id = users.id 
             ORDER BY messages.created_at DESC`
        );

        const messages = messagesResult.rows;

        // Render the home page
        res.render("index", {
            user: req.user, // Pass the logged-in user information (if any)
            messages, // Pass the fetched messages
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

// Display the login page
router.get("/login", (req, res) => {
    res.render("login", { error: req.flash("error") });
});

// Handle login form submission
router.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/", // Redirect to the home page on success
        failureRedirect: "/login", // Redirect back to login on failure
        failureFlash: true, // Enable flash messages for login errors
    })
);

// Display the signup page
router.get("/signup", (req, res) => {
    res.render("signup", { error: req.flash("error") });
});

// Handle signup form submission
router.post("/signup", async (req, res) => {
    const { full_name, username, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        req.flash("error", "Passwords do not match.");
        return res.redirect("/signup");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO users (full_name, username, password) VALUES ($1, $2, $3)",
            [full_name, username, hashedPassword]
        );
        req.flash("success", "Account created successfully! Please log in.");
        res.redirect("/login");
    } catch (err) {
        console.error(err);
        req.flash("error", "Error creating account. Please try again.");
        res.redirect("/signup");
    }
});

// Display the "Create a New Message" form (only for logged-in users)
router.get("/new-message", isAuthenticated, (req, res) => {
    res.render("new_message", { user: req.user });
});

// Handle new message submission
router.post("/new-message", isAuthenticated, async (req, res) => {
    const { title, body } = req.body;
    try {
        // Insert the new message into the database
        await pool.query(
            "INSERT INTO messages (user_id, title, body) VALUES ($1, $2, $3)",
            [req.user.id, title, body]
        );
        req.flash("success", "Message created successfully!");
        res.redirect("/");
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to create the message.");
        res.redirect("/new-message");
    }
});

// Display the join page (only for logged-in users)
router.get("/join", isAuthenticated, (req, res) => {
    res.render("join");
});

// Handle join form submission
router.post("/join", isAuthenticated, async (req, res) => {
    const { passcode } = req.body;
    const SECRET_PASSCODE = "clubsecret"; // Replace with your actual passcode

    if (passcode === SECRET_PASSCODE) {
        try {
            await pool.query("UPDATE users SET is_member = TRUE WHERE id = $1", [req.user.id]);
            req.flash("success", "You are now a club member!");
            res.redirect("/");
        } catch (err) {
            console.error(err);
            req.flash("error", "Failed to join the club.");
            res.redirect("/join");
        }
    } else {
        req.flash("error", "Incorrect passcode.");
        res.redirect("/join");
    }
});

// Handle logout
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            req.flash("error", "Error logging out.");
            return res.redirect("/");
        }
        req.flash("success", "Logged out successfully.");
        res.redirect("/");
    });
});

module.exports = router;
