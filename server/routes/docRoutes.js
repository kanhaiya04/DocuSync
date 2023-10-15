const fetchUser = require("../middleware/fetchUser");
const { body, validationResult } = require("express-validator");
const router = require("express").Router();
const Doc = require("../models/Docs");
const User = require("../models/User");
const logger = require("../logger");

//get all docs
router.get("/getalldoc", fetchUser, async (req, res) => {
  try {
    const response = await Doc.find({ user: req.userId.id });
    const userData = await User.findById(req.userId.id);
    const updatedDoc = [];
    for (let i = 0; i < userData.Docs.length; i++) {
      const newDoc = await Doc.findById(userData.Docs[i]);
      if (newDoc) {
        updatedDoc.push(userData.Docs[i]);
        response.push(newDoc);
      }
    }
    if (updatedDoc.length !== userData.Docs.length) {
      userData.Docs = updatedDoc;

      await User.findByIdAndUpdate(
        req.userId.id,
        { $set: userData },
        { new: true }
      );
    }
    res.send({ success: true, response });
  } catch (error) {
    logger.error("Get all docs error:", error);
    res.status(500).send({
      success: false,
      err: "Internal Server Error",
    });
  }
});

router.get("/getdoc", async (req, res) => {
  try {
    if (!req.query.id) {
      return res.status(400).send({ success: false, err: "Missing document ID", msg: "Document ID is required" });
    }
    
    const response = await Doc.findById(req.query.id);
    if (!response) {
      return res.status(404).send({ success: false, err: "Document not found", msg: "No document found with this ID" });
    }
    res.send({ success: true, response });
  } catch (error) {
    logger.error("Get doc error:", error);
    res.status(500).send({ success: false, err: "Internal Server Error"});
  }
});

//create a doc
router.post(
  "/createdoc",
  [
    body("title", "title not be empty").notEmpty()  ,
    body("roomId", "roomId not be empty").notEmpty(),
  ],
  fetchUser,
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).send({ success: false, err: "Validation failed", msg:result.errors[0].msg});
      }
      const doc = await Doc.create({
        title: req.body.title,
        user: req.userId.id,
        _id: req.body.roomId,
      });
      const response = await doc.save();
      res.send({ success: true, response });
    } catch (error) {
      logger.error("Create doc error:", error);
      res.status(500).send({ success: false, err: "Internal Server Error" });
    }
  }
);

router.post("/updatedoc", fetchUser, async (req, res) => {
  try {
    if (!req.body._id) {
      return res.status(400).send({ success: false, err: "Missing document ID", msg: "Document ID is required" });
    }
    
    if (!req.body.content) {
      return res.status(400).send({ success: false, err: "Missing content", msg: "Content is required" });
    }
    
    let valid = false;
    let response = await Doc.findById(req.body._id);
    
    if (!response) {
      return res.status(404).send({ success: false, err: "Document not found", msg: "No document found with this ID" });
    }
    const userData = await User.findById(req.userId.id);

    if (response.user == req.userId.id) {
      valid = true;
    }
    if (!valid) {
      for (let i = 0; i < userData.Docs.length; i++) {
        if (response._id === userData.Docs[i]) {
          valid = true;
        }
      }
    }
    if (valid) {
      response = await Doc.updateOne(
        { _id: req.body._id },
        { $set: { content: req.body.content } }
      );
      return res.send({ success: true, response });
    }
    res.status(403).send({ success: false, err: "Invalid Access",msg: "You don't have access to perform this operation"});
  } catch (error) {
    logger.error("Update doc error:", error);
    res.status(500).send({ success: false, err: "Internal Server Error" });
  }
});

router.delete("/deletedoc", fetchUser, async (req, res) => {
  try {
    if (!req.body._id) {
      return res.status(400).send({ success: false, err: "Missing document ID", msg: "Document ID is required" });
    }
    
    let valid = false;
    let response = await Doc.findById(req.body._id);
    
    if (!response) {
      return res.status(404).send({ success: false, err: "Document not found", msg: "No document found with this ID" });
    }
    const userData = await User.findById(req.userId.id);

    if (response.user == req.userId.id) {
      valid = true;
    }
    if (!valid) {
      for (let i = 0; i < userData.Docs.length; i++) {
        if (response._id === userData.Docs[i]) {
          valid = true;
        }
      }
    }
    if (valid) {
      response = await Doc.findByIdAndDelete(req.body._id);
      return res.send({ success: true, response });
    }
    res.status(403).send({ success: false, err: "Invalid Access",msg: "You don't have access to perform this operation" });
  } catch (error) {
    logger.error("Delete doc error:", error);
    res.status(500).send({ success: false, err: "Internal Server Error" });
  }
});

module.exports = router;
