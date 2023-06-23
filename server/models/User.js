const Schema = require("mongoose").Schema;
const Model = require("mongoose").model;

const UserSchema = new Schema({
  name: {
    type: "string",
    required: true,
  },
  email: {
    type: "string",
    required: true,
    unique: true,
  },
  password: {
    type: "string",
    required: true,
  },
  date: {
    type: "date",
    default: Date.now,
  },
  Docs: [
    {
      type: Schema.Types.String,
      ref: "Doc",
    },
  ],
});

const User = Model("users", UserSchema);
module.exports = User;
