/**
 * Feature 5: Central RBAC middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const role = (req.user.role || "").toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: `Requires one of: ${roles.join(", ")}` });
    }
    next();
  };
};

const requireTeacher = authorize("teacher");
const requireStudentOrTeacher = authorize("student", "teacher");

module.exports = {
  authorize,
  requireTeacher,
  requireStudentOrTeacher,
};
