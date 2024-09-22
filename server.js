const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config();

const app = express();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//連接MongoDB資料庫
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch( err => console.error("MongoDB connection error:", err));

//建立使用者schema(中譯: 欄位格式、結構、條件??)，定義該schema中該該包含的內容與規則
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }
});

//建立使用者model，第一參數: 模型名稱(集合名稱)；第二參數: 模型內容
const User = mongoose.model('User', userSchema);


//處理註冊路由
app.post("/register", async(req, res) => {
    const {username, password} = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        const existingUser = await User.findOne({username});
        if (existingUser) {
            return res.status(400).json({message: "Username already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10); //調用bcryptjs的bcrypt.hash函式把password經過10運算獲得hash value，hash value是隨機、不可逆的，無法從hash值回推成password，增加安全性
        const newUser = new User({username, password: hashedPassword}); //創建一個新的User實例

        await newUser.save();  //將實例其存入User集合中
        res.json({message: "User registered successfully"});
    }
    catch (error) {
        res.status(500).json({ message: "Server error"});
    }
});

//處理登陸路由
app.post("/login", async(req, res) => {
    const {username, password} = req.body;

    try {
        const user = await User.findOne({username});
        if (!user) {
            return res.status(400).json({message: "Invalid username or password"});
        }

        const token = jwt.sign({username}, SECRET_KEY);  //調用jsonwebtoken中的jwt.sign()函式，該函式返回一個字串，即為token，這個token中會包含username: XXX、SECRET_KEY，toekn的有效期限為1小時，超過1小時，則token失效，用戶需要重新登入
        res.json({token});
    }
    catch (error) {
        res.status(500).json({message:"Server error"});
    }
})


//處理綠界回傳的POST請求
let currentStoreAddress;
app.post("/reply", async(req, res) => {
    try {
        console.log(req.body);

        const { CVSAddress } = req.body;
        // currenStoreAddress = CVSAddress;
        // res.json({ "StoreAddress": CVSAddress });
        res.redirect(`http://localhost:3000/purchase?address=${encodeURIComponent(CVSAddress)}`);
    }
    catch (error) {
        res.json({"Error": error});
    }
});


//伺服器啟動
app.listen(5000, () => {
    console.log("Server is running on port 5000")
})