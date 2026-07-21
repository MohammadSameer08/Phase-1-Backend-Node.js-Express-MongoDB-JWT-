// @ts-ignore
const authorizeRole =
  // @ts-ignore
  (...requiredRoles) =>
  // @ts-ignore
  async (req, res, next) => {
    const userRole = req.user.role; // Assuming the user role is available in req.user
    console.log("User Role:", userRole);
    // Convert all required roles to lowercase and check if user role is included
    const allowedRoles = requiredRoles.map((role) => role.toLowerCase());
    if (!allowedRoles.includes(userRole.toLowerCase())) {
      return res.status(403).json({
        message:
          "Forbidden: You do not have the required role to access this resource.",
      });
    }
    next();
  };

export default authorizeRole;
