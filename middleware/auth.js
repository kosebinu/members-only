// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You must be logged in to access this page.");
    res.redirect("/login");
}

module.exports = { isAuthenticated };
