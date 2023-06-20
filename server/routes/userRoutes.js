const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const dotenv = require("dotenv");
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
      if (!result) {
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
      const email = req.body.email;
      let user = await User.findOne({ email });
      if (user) return res.send({ success: false, msg: "User already exists" });
      const name = req.body.name;
      const password = req.body.password;
      let newPassword;
      bcrypt.genSalt(5, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
          newPassword = hash;
        });
      });

      user = await User.create({ name, email, newPassword, password });

      const data = {
        user: {
          id: user.id,
        },
      };
      const token = jwt.sign(data, process.env.ScreatKey);
      return res.send({ success: true, token });
    } catch (error) {
      return res.send({ success: false, msg: "Some Internal Server Error" });
    }
  }
);

module.exports = router;
