const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const mongoose = require("mongoose");
const express = require("express");

const app = express();

/* 🔗 CONNECT MONGODB */
mongoose.connect("mongodb+srv://dhyan:dhyan123@dhathri-collections.utxz7rp.mongodb.net/shop?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("💾 MongoDB Connected"))
.catch(err => console.log("❌ Mongo Error:", err.message));

/* 📦 PRODUCT MODEL */
const Product = mongoose.model("Product", {
  caption: String,
  price: String,
  images: [String],
  category: String
});

/* 🤖 START WHATSAPP BOT */
async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  /* 🔥 CONNECTION + QR HANDLING */
  sock.ev.on("connection.update", (update) => {
    const { qr, connection } = update;

    if (qr) {
      console.log("📱 Scan QR here:");
      console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected!");
    }

    if (connection === "close") {
      console.log("❌ Connection closed, retrying...");
    }
  });

  /* 📩 MESSAGE HANDLER */
  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0];
    if (!msg.message) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    console.log("📩 Message:", text);

    if (text?.startsWith("product:")) {

      let [name, price] = text.replace("product:", "").split(",");

      await Product.create({
        caption: name || "No name",
        price: price || "0",
        images: ["https://via.placeholder.com/300"],
        category: "auto"
      });

      console.log("✅ Product saved to DB");
    }
  });
}

startBot();

/* 🌐 SERVER */
app.get("/", (req, res) => {
  res.send("🤖 Dhathri Bot Running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server started");
});
