// Simple authentication middleware
// Since the project doesn't use JWT, we'll use a simple session-based auth

const authMiddleware = async (req, res, next) => {
  try {
    // Get userId from headers (sent by frontend after login)
    const userId = req.headers["x-user-id"] || req.headers["userid"];

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
        error: "No user ID provided",
      });
    }

    // Attach userId to request object for use in routes
    req.user = {
      userId: userId,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      message: "Authentication failed",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
