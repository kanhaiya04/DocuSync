const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const logger = require("../logger");
dotenv.config({ path: "../.env" });

const fetchUser = (req, res, next) => {
  const token = req.header("token");
  
  // Check if token exists
  if (!token) {
    return res.status(401).send({ 
      success: false, 
      err: "Authentication required", 
      msg: "No token provided" 
    });
  }

  // Validate environment variable
  if (!process.env.SecretKey) {
    logger.error("SecretKey environment variable is not set");
    return res.status(500).send({ 
      success: false, 
      err: "Server configuration error", 
      msg: "Internal Server Error" 
    });
  }

  try {
    const data = jwt.verify(token, process.env.SecretKey);
    
    // Validate token payload structure
    if (!data || !data.user || !data.user.id) {
      return res.status(401).send({ 
        success: false, 
        err: "Invalid token", 
        msg: "Token payload is malformed" 
      });
    }
    
    req.userId = data.user;
    next();
  } catch (error) {
    logger.error("JWT verification error:", error);
    
    // Handle different JWT error types
    if (error.name === 'TokenExpiredError') {
      return res.status(401).send({ 
        success: false, 
        err: "Token expired", 
        msg: "Please login again" 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).send({ 
        success: false, 
        err: "Invalid token", 
        msg: "Authentication failed" 
      });
    } else {
      return res.status(500).send({ 
        success: false, 
        err: "Internal Server Error", 
        msg: "Authentication service unavailable" 
      });
    }
  }
};

module.exports = fetchUser;