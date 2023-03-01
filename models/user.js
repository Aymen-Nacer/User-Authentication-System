const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: String,
  password: String,
  googleId : String
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

const UserModel = mongoose.model('user', UserSchema);
module.exports = UserModel;
