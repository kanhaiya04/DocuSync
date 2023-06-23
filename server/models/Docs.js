const Schema = require("mongoose").Schema;
const Model = require("mongoose").model;

const DocSchema = new Schema({
  _id: {
    type: String,
    alias: "roomId",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Doc = Model("Docs", DocSchema);
module.exports = Doc;
