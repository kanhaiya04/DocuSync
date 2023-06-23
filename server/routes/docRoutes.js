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
    for (let i = 0; i < userData.Docs.length; i++) {
      const newDoc = await Doc.findById(userData.Docs[i]);
      response.push(newDoc);
    }
    res.send({ success: true, response });
  } catch (error) {
    res.send({ success: false, msg: "Internal Server Error", error });
  }
});

router.post("/getdoc", async (req, res) => {
  try {
    const response = await Doc.findById(req.body.id);
    res.send({ success: true, response });
  } catch (error) {
    res.send({ success: false, msg: "Internal Server Error", error });
  }
});

//create a doc
router.post(
  "/createdoc",
  [
    body("title", "title not be empty").exists(),
    body("roomId", "roomId not be empty").exists(),
  ],
  fetchUser,
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result) {
        res.send({ success: false, msg: "Validation failed" });
      }
      const doc = await Doc.create({
        title: req.body.title,
        user: req.userId.id,
        _id: req.body.roomId,
      });
      const response = await doc.save();
      res.send({ success: true, response });
    } catch (error) {
      res.send({ success: false, msg: "Internal Server Error" });
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
      response = await Doc.updateOne({_id:req.body._id},{$set:{content:req.body.content}});
      return res.send({success:true});
    }
    res.send({ success: false, msg: "Invalid Access" });
  } catch (error) {
    res.send({ success: false, msg: "Internal Server Error" });
  }
});

module.exports = router;
