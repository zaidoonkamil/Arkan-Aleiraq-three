const express = require('express');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require("multer");
const upload = multer();
const { User, UserDevice } = require('../models');
const { Op } = require("sequelize");

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '350d' } 
    );
};

router.post("/users", upload.none(), async (req, res) => {
    const { name, password , role = 'user', phone} = req.body;
    try {
        if (!name || !phone || !password) {
          return res.status(400).json({ error: "جميع الحقول مطلوبة" });
        }

        const existingUser = await User.findOne({ where: { phone } });
        if (existingUser) {
          return res.status(400).json({ error: "رقم الهاتف مستخدم مسبقًا" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await User.create({ 
          name, 
          phone, 
          password: hashedPassword, 
          role, 
        });

        res.status(201).json({
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
    } catch (err) {
        console.error("❌ Error creating user:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/login", upload.none(), async (req, res) => {
  const { phone , password } = req.body;
  try {


    if (!phone) {
      return res.status(400).json({ error: "يرجى إدخال رقم الهاتف" });
    }

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(400).json({ error: "يرجى إدخال رقم الهاتف بشكل صحيح" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "كلمة المرور غير صحيحة" });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      token
    });

  } catch (err) {
    console.error("❌ خطأ أثناء تسجيل الدخول:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id, {
      include: { model: UserDevice, as: "devices" },
    });

    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    await user.destroy(); 

    res.status(200).json({ message: "تم حذف المستخدم وأجهزته بنجاح" });
  } catch (err) {
    console.error("❌ خطأ أثناء الحذف:", err);
    res.status(500).json({ error: "حدث خطأ أثناء عملية الحذف" });
  }
});

router.get("/usersOnly", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where: {
        role: {
          [Op.notIn]: ["admin", "agent"] 
        }
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]]
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      users,
      pagination: {
        totalUsers: count,
        currentPage: page,
        totalPages,
        limit
      }
    });
  } catch (err) {
    console.error("❌ Error fetching users with pagination:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/agentsOnly", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where: {
        role: {
          [Op.notIn]: ["admin", "user"] 
        }
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]]
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      users,
      pagination: {
        totalUsers: count,
        currentPage: page,
        totalPages,
        limit
      }
    });
  } catch (err) {
    console.error("❌ Error fetching users with pagination:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/profile", async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "Token is missing" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "التوكن غير صالح سجل الدخول مرة اخرى" });
    }

    try {
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error("خطأ في جلب بيانات هذا المستخدم", error);
      res.status(500).json({ error: "خطأ من السيرفر" });
    }
  });
});

module.exports = router;