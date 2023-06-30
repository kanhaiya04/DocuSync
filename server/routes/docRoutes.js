const fetchUser = require("../middleware/fetchUser");
const { body, validationResult } = require("express-validator");
const router = require("express").Router();
const Doc = require("../models/Docs");
const User = require("../models/User");

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
      userData.Docs.length = 0;

      userData.Docs.push(...updatedDoc);

      await User.findByIdAndUpdate(
        req.userId.id,
        { $set: userData },
        { new: true }
      );
    }
    res.send({ success: true, response });
  } catch (error) {
    res.send({
      success: false,
      err: "Internal Server Error",
    });
  }
});

router.post("/getdoc", async (req, res) => {
  try {
    const response = await Doc.findById(req.body.id);
    res.send({ success: true, response });
  } catch (error) {
    res.send({ success: false, err: "Internal Server Error"});
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
        return res.send({ success: false, err: "Validation failed", msg:result.errors[0].msg});
      }
      const doc = await Doc.create({
        title: req.body.title,
        user: req.userId.id,
        _id: req.body.roomId,
      });
      const response = await doc.save();
      res.send({ success: true, response });
    } catch (error) {
      res.send({ success: false, err: "Internal Server Error" });
    }
  }
);

router.post("/updatedoc", fetchUser, async (req, res) => {
  try {
    let valid = false;
    let response = await Doc.findById(req.body._id);
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
    res.send({ success: false, err: "Invalid Access",msg: "You don't have access to perform this operation"});
  } catch (error) {
    res.send({ success: false, err: "Internal Server Error" });
  }
});

router.delete("/deletedoc", fetchUser, async (req, res) => {
  try {
    let valid = false;
    let response = await Doc.findById(req.body._id);
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
      response = await Doc.findByIdAndDelete({ _id: req.body._id });
      return res.send({ success: true, response });
    }
    res.send({ success: false, err: "Invalid Access",msg: "You don't have access to perform this operation" });
  } catch (error) {
    res.send({ success: false, err: "Internal Server Error" });
  }
});

module.exports = router;
