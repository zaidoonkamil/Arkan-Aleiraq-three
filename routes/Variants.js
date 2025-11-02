const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const { ProductVariant, Product, UserHiddenVariant, User, PreparationLog } = require("../models");
const { sendNotificationToRole } = require("../services/notifications");
const { Op } = require("sequelize");

router.post("/products/:id/variants", upload.none(),async (req, res) => {
    const { id } = req.params;
    const { color, size, userId, productCount} = req.body;

    if (!color || !size || !productCount) {
        return res.status(400).json({ error: " اللون و الحجم مطلوبين و العدد" });
    }

    try {
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: "المنتج غير موجود" });
        }

        const variant = await ProductVariant.create({
            product_id: id,
            color,
            ProductCount: productCount,
            size,
            created_by: userId,
            status: "قيد التجهيز",
        });

        await sendNotificationToRole(
        "user",
        `تمت إضافة نوع جديد (${color} - ${size}) إلى المنتج "${product.title}"`,
        "إضافة نوع جديد للمنتج"
        );
        
        res.status(201).json(variant);
    } catch (error) {
        console.error("❌ Error creating variant:", error);
        res.status(500).json({ error: "خطأ داخلي في الخادم" });
    }
});

router.get("/products/:id/variants", async (req, res) => {
  const { id } = req.params;
  const userId = req.query.user_id;

  try {
    let variants = await ProductVariant.findAll({ where: { product_id: id } });

    const hidden = await UserHiddenVariant.findAll({
      where: { user_id: userId },
      attributes: ["variant_id"],
    });

    const hiddenIds = hidden.map(h => h.variant_id);

    variants = variants.filter(v => !hiddenIds.includes(v.id));

    res.json(variants);
  } catch (error) {
    console.error("❌ Error fetching variants:", error);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.delete("/variants/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.query.user_id;

  try {
    const variant = await ProductVariant.findByPk(id);
    if (!variant) return res.status(404).json({ error: "الـ variant غير موجود" });

    await UserHiddenVariant.create({
      user_id: userId,
      variant_id: id,
    });

    res.json({ message: "تم إخفاء الـ variant من حسابك فقط" });
  } catch (error) {
    console.error("❌ Error hiding variant:", error);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.get("/products-with-variants", async (req, res) => {
  const userId = req.query.user_id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const offset = (page - 1) * limit;

  if (!userId) {
    return res.status(400).json({ error: "يجب إرسال user_id في الاستعلام" });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    const hiddenVariants = await UserHiddenVariant.findAll({
      where: { user_id: userId },
      attributes: ["variant_id"],
    });
    const hiddenIds = hiddenVariants.map(h => h.variant_id);

    if (user.role === "user") {
      const products = await Product.findAndCountAll({
        limit,
        offset,
        include: [
          {
            model: ProductVariant,
            as: "variants",
            where: {
              status: "قيد التجهيز",
              ...(hiddenIds.length && { id: { [Op.notIn]: hiddenIds } }),
            },
            required: true,
            order: [["createdAt", "DESC"]],
            include: [
              { model: User, as: "preparer", attributes: ["id", "name"] },
              { model: User, as: "creator", attributes: ["id", "name"] },
            ],
          },
        ],
      });

      return res.json(products.rows);
    } else {
      const products = await Product.findAndCountAll({
        limit,
        offset,
        include: [
          {
            model: ProductVariant,
            as: "variants",
            where: hiddenIds.length ? { id: { [Op.notIn]: hiddenIds } } : {},
            required: true,
            separate: true,
            order: [["createdAt", "DESC"]],
            include: [
              { model: User, as: "preparer", attributes: ["id", "name"] },
              { model: User, as: "creator", attributes: ["id", "name"] },
            ],
          },
        ],
      });

      return res.json(products.rows);
    }
  } catch (error) {
    console.error("❌ Error fetching products with variants:", error);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.put("/variants/:id/complete", async (req, res) => {
  const { id } = req.params;
  const { date, user_id  } = req.body;

  try {
    const variant = await ProductVariant.findByPk(id, {
      include: [{ model: Product, as: "product" }],
    });

    if (!variant) return res.status(404).json({ error: "الـ variant غير موجود" });
    if (variant.status === "تم التجهيز") {
      return res.status(400).json({ error: "تم تجهيز هذا النوع مسبقًا من قبل مستخدم آخر" });
    }

    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });

    variant.status = "تم التجهيز";
    variant.prepared_by = user.id;
    await variant.save();

    await PreparationLog.create({
      user_id: user.id,
      variant_id: variant.id,
      product_id: variant.product_id,
      date: date ? new Date(date) : new Date(),
    });

    await sendNotificationToRole(
      "agent",
      `تم تحديث النوع (${variant.color} - ${variant.size}) من المنتج "${variant.product.title}" بواسطة ${user.name}`,
      "تحديث حالة النوع"
    );

    res.json({ message: "تم تجهيز النوع بنجاح", variant });
  } catch (error) {
    console.error("❌ Error updating variant status:", error);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.get("/preparation-logs", async (req, res) => {
  const { startDate, endDate, startTime, endTime } = req.query;

  try {
    const start = startDate
      ? new Date(`${startDate}T${startTime || "00:00:00"}`)
      : new Date();

    const end = endDate
      ? new Date(`${endDate}T${endTime || "23:59:59"}`)
      : new Date(); 

    const logs = await PreparationLog.findAll({
      where: {
        createdAt: { [Op.between]: [start, end] },
      },
      include: [
        { model: User, as: "user", attributes: ["id", "name"] },
        { model: Product, as: "product", attributes: ["id", "title", "images"] },
        { model: ProductVariant, as: "variant", attributes: ["id", "color", "size", "ProductCount"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(logs);
  } catch (error) {
    console.error("❌ Error fetching logs:", error);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});


module.exports = router;
