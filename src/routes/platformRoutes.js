const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const protect = require("../middleware/authMiddleware");
const { requireTeacher } = require("../middleware/rbac");
const audit = require("../middleware/audit");
const classCtrl = require("../controllers/classController");
const notifCtrl = require("../controllers/notificationController");
const msgCtrl = require("../controllers/messageController");
const assignCtrl = require("../controllers/assignmentController");
const flashCtrl = require("../controllers/flashcardController");
const platform = require("../controllers/platformController");
const { UPLOADS } = require("../config/paths");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOADS, "files");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Classes
router.post("/classes", protect, requireTeacher, audit("class.create"), classCtrl.createClass);
router.post("/classes/join", protect, classCtrl.joinClass);
router.get("/classes", protect, classCtrl.myClasses);
router.get("/classes/:id", protect, classCtrl.getClass);
router.get("/classes/:id/roster", protect, classCtrl.roster);
router.post("/classes/:id/announce", protect, requireTeacher, classCtrl.announce);
router.post("/classes/:id/files", protect, upload.single("file"), classCtrl.addFile);

// Notifications
router.get("/notifications", protect, notifCtrl.list);
router.get("/notifications/unread-count", protect, notifCtrl.unreadCount);
router.post("/notifications/:id/read", protect, notifCtrl.markRead);
router.post("/notifications/read-all", protect, notifCtrl.markAllRead);
router.post("/notifications/digest", protect, notifCtrl.sendDigest);

// Messages
router.get("/messages/inbox", protect, msgCtrl.inbox);
router.post("/messages/dm", protect, msgCtrl.sendDM);
router.post("/messages/class", protect, msgCtrl.sendClassChat);
router.get("/messages/with/:withUserId", protect, msgCtrl.getConversation);
router.get("/messages/class/:classId", protect, msgCtrl.getClassMessages);

// Assignments
router.post("/assignments", protect, requireTeacher, audit("assignment.create"), assignCtrl.create);
router.get("/assignments", protect, assignCtrl.list);
router.post("/assignments/:id/submit", protect, upload.single("file"), assignCtrl.submit);
router.post("/assignments/:id/grade", protect, requireTeacher, assignCtrl.grade);


// Flashcards
router.post("/flashcards", protect, flashCtrl.create);
router.get("/flashcards", protect, flashCtrl.list);
router.get("/flashcards/due", protect, flashCtrl.due);
router.post("/flashcards/:id/review", protect, flashCtrl.review);


// Study groups, events, clubs, mentorship
router.post("/study-groups", protect, platform.createStudyGroup);
router.get("/study-groups", protect, platform.listStudyGroups);
router.post("/study-groups/:id/join", protect, platform.joinStudyGroup);
router.put("/study-groups/:id/whiteboard", protect, platform.updateWhiteboard);

router.post("/events", protect, platform.createEvent);
router.get("/events", protect, platform.listEvents);
router.get("/events/export.ics", protect, platform.exportIcs);

router.post("/clubs", protect, platform.createClub);
router.get("/clubs", protect, platform.listClubs);
router.post("/clubs/:id/join", protect, platform.joinClub);




// Search, mastery, plan, presence
router.get("/search", protect, platform.search);
router.get("/mastery", protect, platform.masteryMap);
router.get("/study-plan", protect, platform.weeklyStudyPlan);
router.post("/presence/heartbeat", protect, platform.heartbeat);
router.get("/presence/online", protect, platform.online);


// Admin routes removed

module.exports = router;
