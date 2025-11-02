const express = require("express");
const sequelize = require("./config/db");
const usersRouter = require("./routes/user");
const notifications = require("./routes/notifications");
const product = require("./routes/products");
const variants = require("./routes/Variants");


const app = express();
app.use(express.json());
app.use("/uploads", express.static("./" + "uploads"));

sequelize.sync({
   // alter: true
    force: true,
 }).then(() => console.log("✅ Database & User table synced!"))
  .catch(err => console.error("❌ Error syncing database:", err));


app.use("/", usersRouter);
app.use("/", notifications);
app.use("/", product);
app.use("/", variants);

app.listen( 1600 , () => {
    console.log(`🚀 Server running on http://localhost:1600`);
});