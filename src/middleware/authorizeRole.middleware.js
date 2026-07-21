// @ts-ignore
const authorizeRole = (requiredRole) => async (req, res, next) => {
  const userRole = req.user.role; // Assuming the user role is available in req.user
  console.log("User Role:", userRole);
  if (userRole !== requiredRole.toLowerCase()) {
    return res.status(403).json({
      message:
        "Forbidden: You do not have the required role to access this resource.",
    });
  }
  next();
};

export default authorizeRole;
