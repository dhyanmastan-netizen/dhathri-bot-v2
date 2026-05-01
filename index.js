const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const mongoose = require("mongoose");
const express = require("express");

const app = express();

/* MongoDB */
mongoose.connect("mongodb+srv://dhyan:dhyan123@dhathri-collections.utxz7rp.mongodb.net/shop?retryWrites=true&w=majority");

/* Model */
const Product = mongoose.model("Product", {
  caption: String,
  price: String,
  images: [String],
  category: String
});

async function startBot() {

  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  /* 🔥 THIS SHOWS QR CODE */
  sock.ev.on("connection.update", (update) => {
    const { qr } = update;

    if (qr) {
      console.log("📱 Scan this QR:");
      qrcode.generate(qr, { small: true });
    }
  });

  /* Messages */
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

/* Server */
app.get("/", (req, res) => {
  res.send("Bot Running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Bot started");
});
