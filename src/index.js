import { Login } from "./lib/Login.js";
import { Jadwal } from "./lib/Jadwal.js";

(async () => {
  const login = new Login();
  const session = await login.login();
  const jadwal = new Jadwal();
  let Tahun = new Date().getFullYear();
  let Hari = new Date().getDay();
  let Waktu =
    new Date().toDateString() +
    " " +
    new Date().toLocaleTimeString("id-ID", { hour12: false });
  if (session) {
    const mergedData = await jadwal.mergeJadwal(session.ST, session.token);
    console.log(mergedData);
    while (true) {
      // Do something
    }
  }
})();
