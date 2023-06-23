const fetchUser = require("../middleware/fetchUser");
const { body, validationResult } = require("express-validator");
const router = require("express").Router();
const Doc = require("../models/Docs");
const User = require("../models/User");

//get all docs
router.get("/getdoc", fetchUser, async (req, res) => {
  try {
    const response = await Doc.find({ user: req.userId.id });
    console.log(response);
    const userData = await User.findById(req.userId.id);
    console.log(userData.Docs.length);
    for (let i = 0; i < userData.Docs.length; i++) {
      const newDoc = await Doc.findById(userData.Docs[i]);
      response.push(newDoc);
    }
    console.log(response);
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
      console.log(error);
      res.send({ success: false, msg: "Internal Server Error" });
    }
  }
);

// router.post("/updatedoc",fetchUser, async (req, res) => {
      
// })

module.exports = router;
