import { Jadwal } from "./lib/Jadwal.js";
import { Login } from "./lib/Login.js";
import { Presensi } from "./lib/Presensi.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const login = new Login();
  const isLogin = await login.getAuth();
  if (!isLogin) {
    console.log("Login...");
    await login.getAuth();
  }
  const jadwal = new Jadwal();
  const presensi = new Presensi();
  console.log("Mengambil data jadwal...");
  let dataJadwal = await jadwal.mergeJadwal(login.ST, login.token);
  if (!dataJadwal || dataJadwal.length === 0) {
    console.log("Gagal mendapatkan data jadwal.");
    console.log("Mengambil jadwal dari file...");
    await jadwal.mergeJadwal();
    dataJadwal = await jadwal.mergeJadwal(login.ST, login.token);
    return;
  }

  while (true) {
    const hariIni = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jum'at",
      "Sabtu",
    ][new Date().getDay()];
    const sekarang = new Date()
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(".", ":");
    // const sekarang = "10:00";
    console.log(`Hari ini: ${hariIni}, Jam: ${sekarang}`);
    console.log("Mencari jadwal yang sesuai...");

    const jadwalData = await jadwal.getJadwalJson();
    console.log(jadwalData);
    let jadwalSekarang = null;
    if (Array.isArray(jadwalData)) {
      jadwalSekarang = jadwalData.find(
        (j) =>
          j.hari === hariIni &&
          j.jamMulai &&
          j.jamSelesai &&
          sekarang >= j.jamMulai &&
          sekarang <= j.jamSelesai
      );
    } else {
      console.log("Data jadwal kosong atau tidak valid:", jadwalData);
    }

    if (jadwalSekarang) {
      console.log("Jadwal kuliah ditemukan:", jadwalSekarang);
      console.log("Jadwal ditemukan:", jadwalSekarang.matakuliah.nama);
      console.log("Melakukan pengecekan presensi...");
      const infoPresensi = await presensi.lastKulliah(
        login.ST,
        login.token,
        jadwalSekarang.nomor,
        jadwalSekarang.matakuliah.jenisSchemaMk
      );
      console.log("Info Presensi:", infoPresensi);
      if (infoPresensi.open == true) {
        console.log("Presensi dibuka, silakan lakukan presensi.");
        const notifikasi = await presensi.getNotifikasi(login.ST, login.token);
        const dataTerkaitCheck = `${jadwalSekarang.nomor}-${jadwalSekarang.matakuliah.jenisSchemaMk}`;
        const checkPresensi = notifikasi.find(
          (n) => n.status == "1" && n.dataTerkait == dataTerkaitCheck
        );
        if (checkPresensi) {
          const checkRiwayatPresensi = await presensi.getRiwayatPresensi(
            login.ST,
            login.token,
            jadwalSekarang.nomor,
            jadwalSekarang.matakuliah.jenisSchemaMk,
            login.nomorMhs
          );
          console.log("Riwayat Presensi:", checkRiwayatPresensi);
          const keyPresensi = checkRiwayatPresensi.find(
            (r) =>
              r.tanggal.split(" ")[0] === new Date().toISOString().split("T")[0]
          );
          if (!keyPresensi) {
            console.log("Belum melakukan presensi hari ini.");
            console.log("Melakukan presensi...");
            const push = await presensi.sumbitPresensi(
              login.ST,
              login.token,
              jadwalSekarang.nomor,
              login.nomorMhs,
              jadwalSekarang.matakuliah.jenisSchemaMk,
              jadwalSekarang.kuliah_asal,
              infoPresensi.key
            );
            if (push.status === "success") {
              console.log("Presensi berhasil:", push.message);
            } else {
              console.log("Gagal presensi:", push.message);
            }
          } else {
            console.log("Sudah melakukan presensi hari ini:", keyPresensi);
          }
        } else {
          console.log("Tidak ada notifikasi presensi yang sesuai.");
        }
      } else {
        console.log("Presensi belum dibuka.");
      }
    } else {
      console.log("Tidak ada jadwal kuliah saat ini.");
    }
    console.log("Menunggu 5 menit sebelum pengecekan berikutnya...");
    await delay(5 * 60 * 1000);
  }
}

main();
