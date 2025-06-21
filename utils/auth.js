const users = {
  netrunnerX: { id: "netrunnerX", role: "admin" },
  reliefAdmin: { id: "reliefAdmin", role: "admin" },
  citizen1: { id: "citizen1", role: "contributor" },
  citizen2: { id: "citizen2", role: "contributor" },
};

module.exports = function mockAuth(req, res, next) {
  // For demo, get user from header or default to citizen1
  const userId = req.header("x-user-id") || "citizen1";
  req.user = users[userId] || users["citizen1"];
  next();
};
