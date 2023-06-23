const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const dotenv = require("dotenv");
const fetchUser = require("../middleware/fetchUser");
dotenv.config({ path: "../.env" });

//login route for users
router.post(
  "/login",
  [
    body("email", "Invalid email address").isEmail(),
    body("password", "password can't be null").exists(),
  ],
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.send({ success: false, msg: "validation failed" });
      }
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.send({ success: false, msg: "Invalid credentials" });
      }
      const passComp = bcrypt.compare(req.body.password, user.password);
      if (!passComp) {
        return res.send({ success: false, msg: "Invalid credentials" });
      }
      const data = {
        user: {
          id: user.id,
        },
      };
      const token = jwt.sign(data, process.env.ScreatKey);
      return res.send({ success: true, token });
    } catch (error) {
      return res.send({ success: false, msg: "Internal server error" });
    }
  }
);

//create a new user account
router.post(
  "/createuser",
  [
    body("name", "name can't be empty").notEmpty(),
    body("email", "invalid email").isEmail(),
    body("password", "min. Length of password should 5").isLength({ min: 5 }),
  ],
  async (req, res) => {
    const result = validationResult(req);
    try {
      if (!result.isEmpty()) {
        return res.send({ success: false, msg: result.errors[0].msg });
      }

      let user = await User.findOne({ email: req.body.email });
      if (user) return res.send({ success: false, msg: "User already exists" });

      const salt = bcrypt.genSaltSync(10);
      const secPassword = bcrypt.hashSync(req.body.password, salt);

      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPassword,
      });

      const data = {
        user: {
          id: user.id,
        },
      };
      const token = jwt.sign(data, process.env.ScreatKey);
      return res.send({ success: true, token });
    } catch (error) {
      //console.log(error);
      return res.send({ success: false, msg: "Internal Server Error" });
    }
  }
);


//join a room
router.post("/join",fetchUser,async (req, res) => {
    try {
      let response = await User.findById(req.userId.id);
      response.Docs.push(req.body.roomId);
      response = await User.findByIdAndUpdate(
        req.userId.id,
        { $set: response },
        { new: true }
      );
      res.send({success:true,response});
    } catch (error) {
      res.send({success:false,msg:"Internal Server Error"});
    }
});

module.exports = router;
