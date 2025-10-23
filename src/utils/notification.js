import "dotenv/config";
import axios from "axios";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; 
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;   

export async function sendNotification(text) {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.warn("[INFO] TELEGRAM_TOKEN/CHAT_ID belum diset");
    return;
  }

  try {
    const res = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text,
        parse_mode: "Markdown",
      }
    );
    console.log(`[INFO] Dikirim ke Telegram: ${res.data?.ok ? "OK" : "FAIL"}`);
  } catch (err) {
    console.error("[INFO] Gagal kirim Telegram:", err?.response?.data || err.message);
  }
}
