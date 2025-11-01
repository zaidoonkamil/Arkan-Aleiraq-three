const express = require("express");
const router = express.Router();
const {Product, User} = require("../models");
const upload = require("../middlewares/uploads");

router.post("/products", upload.array("images", 5), async (req, res) => {
    const { title, videoUrl } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ error: "العنوان ورابط الفيديو مطلوبان" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "يجب رفع صورة واحدة على الأقل" });
    }

    try {
      const images = req.files.map((file) => file.filename);

      const product = await Product.create({
        title,
        videoUrl,
        images,
      });

      res.status(201).json(product);
    } catch (error) {
      console.error("❌ Error creating product:", error);
      res.status(500).json({ error: "خطأ داخلي في الخادم" });
    }
  }
);

router.get("/products", async (req, res) => {
    try {
      const products = await Product.findAll(); 
      res.json(products);
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      res.status(500).json({ error: "خطأ داخلي في الخادم" });
    }
  }
);

router.get("/products/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ error: "المنتج غير موجود" });
      }
      res.json(product);
    } catch (error) {
      console.error("❌ Error fetching product:", error);
      res.status(500).json({ error: "خطأ داخلي في الخادم" });
    }
  }
);

router.delete("/products/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ error: "المنتج غير موجود" });
      }
      await product.destroy();
      res.json({ message: "تم حذف المنتج بنجاح" });
    } catch (error) {
      console.error("❌ Error deleting product:", error);
      res.status(500).json({ error: "خطأ داخلي في الخادم" });
    }
  }
);

module.exports = router;
