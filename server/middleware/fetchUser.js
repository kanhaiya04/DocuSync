const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

const fetchUser = (req, res, next) => {
  const token = req.header("token");
  if (!token) {
    return res.send({ success: false, msg: "Invalid token" });
  }
  try {
    const data = jwt.verify(token, process.env.ScreatKey);
    req.userId=data.user;
    next();
  } catch (error) {
    res.send({ success: false, msg:"Internal Server Error"});
  }
};

module.exports= fetchUser;