const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const dotenv = require("dotenv");
const fetchUser = require("../middleware/fetchUser");
const logger = require("../logger");
dotenv.config({ path: "../.env" });

//login route for users
router.post(
  "/login",
  [
    body("email", "Invalid email address").isEmail(),
    body("password", "password can't be empty").notEmpty(),
  ],
  async (req, res) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).send({ success: false,err:"Validation failed", msg:  result.errors[0].msg });
      }
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(401).send({ success: false,err:"Invalid credentials", msg: "Please check your email or password once again" });
      }
      const passComp =await bcrypt.compare(req.body.password, user.password);
      if (!passComp) {
        return res.status(401).send({ success: false, err: "Invalid credentials" , msg: "Please check your email or password once again" });
      }
      const data = {
        user: {
          id: user.id,
        },
      };
      const token = jwt.sign(data, process.env.SecretKey);
      return res.send({ success: true, token });
    } catch (error) {
      logger.error("Login error:", error);
      return res.status(500).send({ success: false, err: "Internal server error" });
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
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).send({ success: false,err:"Validation failed", msg: result.errors[0].msg });
      }

      let user = await User.findOne({ email: req.body.email });
      if (user) return res.status(409).send({ success: false,err:"User already exists", msg:"You need to login as you have already account"  });

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
      const token = jwt.sign(data, process.env.SecretKey);
      return res.send({ success: true, token });
    } catch (error) {
      logger.error("Create user error:", error);
      return res.status(500).send({ success: false, err: "Internal Server Error" });
    }
  }
);

//join a room
router.post("/join", fetchUser, async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.email) {
      return res.status(400).send({ success: false, err: "Missing email", msg: "Email is required" });
    }
    if (!req.body.roomId) {
      return res.status(400).send({ success: false, err: "Missing room ID", msg: "Room ID is required" });
    }
    
    // // Validate roomId format (assuming it should be a valid MongoDB ObjectId)
    // if (!/^[0-9a-fA-F]{24}$/.test(req.body.roomId)) {
    //   return res.status(400).send({ success: false, err: "Invalid room ID", msg: "Room ID must be a valid format" });
    // }

    let owner = await User.findById(req.userId.id);
    if (owner.email === req.body.email)
      return res.status(409).send({ success: false, err: "Already have access",msg:"This user already have access to this document" });
    
    let response = await User.findOne({ email: req.body.email });
    if (!response) {
      return res.status(404).send({ success: false, err: "User not found", msg: "No user found with this email address" });
    }
    
    for (let i = 0; i < response.Docs.length; i++) {
      if (response.Docs[i] === req.body.roomId)
        return res.status(409).send({ success: false, err: "Already have access", msg:"This user already have access to this document" });
    }
    
    response.Docs.push(req.body.roomId);
    response = await User.findByIdAndUpdate(
      response.id,
      { $set: response },
      { new: true }
    );
    res.send({ success: true, response });
  } catch (error) {
    logger.error("Join room error:", error);
    res.status(500).send({ success: false, err: "Internal Server Error" });
  }
});

router.get("/getuser", fetchUser, async (req, res) => {
  try {
    const response = await User.findById(req.userId.id);
    res.send({ success: true, response });
  } catch (error) {
    logger.error("Get user error:", error);
    res.status(500).send({ success: false, err: "Internal Server Error" });
  }
});

module.exports = router;
