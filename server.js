const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("./models/User");

const app = express();

app.use(express.json());
app.use(cors());
 mongoose.connect("mongodb://127.0.0.1:27017/salon")
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err));
// =====================
// DATA (DEMO MEMORY)
// =====================

let services = [];
let appointments = [
  {
    _id: "1",
    firstName: "Ali",
    phone: "0300",
    email: "ali@test.com",
    date: "2026-06-20",
    service: "Hair Cut",
    status: "Pending"
  },
  {
    _id: "2",
    firstName: "Sara",
    phone: "0311",
    email: "sara@test.com",
    date: "2026-06-21",
    service: "Facial",
    status: "Pending"
  }
];

// =====================
// ADMIN LOGIN
// =====================
app.post("/admin-login", (req,res)=>{
  if(req.body.password === "admin123"){
    res.json({success:true});
  } else {
    res.json({success:false});
  }
});

// =====================
// APPOINTMENTS
// =====================
app.get("/appointments",(req,res)=>{
  res.json(appointments);
});

app.put("/appointment/:id",(req,res)=>{
  let appo = appointments.find(a=>a._id === req.params.id);
  if(appo){
    appo.status = req.body.status;
  }
  res.json({message:"updated"});
});

app.delete("/appointment/:id",(req,res)=>{
  appointments = appointments.filter(a=>a._id !== req.params.id);
  res.json({message:"deleted"});
});

// =====================
// SERVICES
// =====================
app.post("/service",(req,res)=>{
  let newService = {
    _id: Date.now().toString(),
    name: req.body.name,
    price: req.body.price
  };

  services.push(newService);
  res.json({message:"added"});
});

app.get("/services",(req,res)=>{
  res.json(services);
});

app.delete("/service/:id",(req,res)=>{
  services = services.filter(s=>s._id !== req.params.id);
  res.json({message:"deleted"});
});

// =====================
app.listen(5000,()=>{
  console.log("Server running on 5000");
});
// SIGNUP
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.json({ message: "User already exists" });
    }

    const newUser = new User({ email, password });
    await newUser.save();

    res.json({ message: "Account created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.password !== password) {
      return res.json({ success: false, message: "Wrong password" });
    }

    res.json({ success: true, message: "Login successful" });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/forgot-password", async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "User not found"
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    user.resetOTP = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    res.json({
      message: "OTP Generated",
      otp: otp

    });

  }

  catch (err) {

    console.log("Forgot Password Error:");

    console.log(err);

    res.status(500).json({

      message: "Server Error"

    });

  }

});
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.json({ message: "User not found" });

  if (user.resetOTP !== otp) {
    return res.json({ message: "Invalid OTP" });
  }

  if (user.otpExpire < Date.now()) {
    return res.json({ message: "OTP expired" });
  }

  res.json({ message: "OTP verified" });
});
app.post("/reset-password", async (req, res) => {

  const { email, newPassword } = req.body;

  try {

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "User not found"
      });
    }

    user.password = newPassword;

    user.resetOTP = "";
    user.otpExpire = null;

    await user.save();

    res.json({
      message: "Password updated successfully"
    });

  }

  catch(err){

    res.status(500).json({
      message:"Server Error"
    });

  }

});
module.exports=app;
