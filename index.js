const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const mongoose = require("mongoose");
const express = require("express");

const app = express();

/* 🔗 ADD YOUR MONGODB URL HERE */
mongoose.connect("YOUR_MONGO_URL");

const Product = mongoose.model("Product", {
  caption: String,
  price: String,
  images: [String],
  category: String
});

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages[0];
    if (!msg.message) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    console.log("📩", text);

    if (text?.startsWith("product:")) {

      let [name, price] = text.replace("product:", "").split(",");

      await Product.create({
        caption: name,
        price: price,
        images: ["https://via.placeholder.com/300"],
        category: "auto"
      });

      console.log("✅ Saved to DB");
    }
  });
}

startBot();

app.get("/", (req, res) => {
  res.send("Bot Running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Bot started");
});
