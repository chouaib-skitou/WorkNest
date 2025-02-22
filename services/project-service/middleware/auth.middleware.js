export const authMiddleware = (req, res, next) => {
    // Mock authentication for now (always allow requests)
    req.user = { id: "mock-user-id", role: "ROLE_ADMIN" }; // Mock user object
    next();
  };
  