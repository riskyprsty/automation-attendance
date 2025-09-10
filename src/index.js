import { Jadwal } from "./lib/Jadwal.js";
import { Login } from "./lib/Login.js";
import { Presensi } from "./lib/Presensi.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTokenRefresh(login, apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    if (
      error.response?.data?.pesan?.includes("Token tidak valid") ||
      error.response?.status === false
    ) {
      console.log("Token expired, refreshing...");
      await login.getAuth();
      return await apiCall();
    }
    throw error;
  }
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

  function calculateOptimalDelay(jadwalData) {
    const now = new Date();
    const currentDay = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jum'at",
      "Sabtu",
    ][now.getDay()];
    const currentTime = now
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(".", ":");

    const todaySchedules = jadwalData.filter(
      (j) => j.hari === currentDay && j.jamMulai && j.jamSelesai
    );
    const upcomingToday = todaySchedules.filter(
      (j) => currentTime < j.jamMulai
    );

    if (upcomingToday.length > 0) {
      const nextSchedule = upcomingToday.sort((a, b) =>
        a.jamMulai.localeCompare(b.jamMulai)
      )[0];
      const [nextHour, nextMinute] = nextSchedule.jamMulai
        .split(":")
        .map(Number);
      const [currentHour, currentMinute] = currentTime.split(":").map(Number);

      const nextTime = new Date(now);
      nextTime.setHours(nextHour, nextMinute, 0, 0);

      const timeDiff = nextTime - now;
      console.log(
        `Jadwal selanjutnya: ${nextSchedule.matakuliah.nama} pada ${nextSchedule.jamMulai}`
      );
      console.log(
        `Menunggu ${Math.round(
          timeDiff / 60000
        )} menit hingga jadwal dimulai...`
      );

      return Math.max(timeDiff - 5 * 60 * 1000, 60000); // minimal 1 menit
    }

    const daysOrder = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jum'at",
      "Sabtu",
    ];
    const currentDayIndex = daysOrder.indexOf(currentDay);

    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDay = daysOrder[nextDayIndex];
      const nextDaySchedules = jadwalData.filter(
        (j) => j.hari === nextDay && j.jamMulai
      );

      if (nextDaySchedules.length > 0) {
        const earliestSchedule = nextDaySchedules.sort((a, b) =>
          a.jamMulai.localeCompare(b.jamMulai)
        )[0];
        console.log(
          `Jadwal selanjutnya: ${earliestSchedule.matakuliah.nama} pada ${nextDay} ${earliestSchedule.jamMulai}`
        );

        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + i);
        const [scheduleHour, scheduleMinute] = earliestSchedule.jamMulai
          .split(":")
          .map(Number);
        nextDate.setHours(scheduleHour, scheduleMinute, 0, 0);

        const timeDiff = nextDate - now;
        console.log(
          `Menunggu ${Math.round(
            timeDiff / 3600000
          )} jam hingga jadwal berikutnya...`
        );

        return Math.min(timeDiff - 5 * 60 * 1000, 6 * 60 * 60 * 1000);
      }
    }

    console.log(
      "Tidak ada jadwal dalam 7 hari ke depan. Cek lagi dalam 1 jam..."
    );
    return 60 * 60 * 1000; // 1 jam
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
    // const sekarang = "10:00"; // TESTING
    console.log(`Hari ini: ${hariIni}, Jam: ${sekarang}`);
    console.log("Mencari jadwal yang sesuai...");

    const jadwalData = await jadwal.getJadwalJson();
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
      const infoPresensi = await withTokenRefresh(login, () =>
        presensi.lastKulliah(
          login.ST,
          login.token,
          jadwalSekarang.nomor,
          jadwalSekarang.matakuliah.jenisSchemaMk
        )
      );
      console.log("Info Presensi:", infoPresensi);
      if (infoPresensi.open == true) {
        console.log("Presensi dibuka, silakan lakukan presensi.");
        const notifikasi = await withTokenRefresh(login, () =>
          presensi.getNotifikasi(login.ST, login.token)
        );
        const dataTerkaitCheck = `${jadwalSekarang.nomor}-${jadwalSekarang.matakuliah.jenisSchemaMk}`;
        const checkPresensi = notifikasi.find(
          (n) => n.status == "1" && n.dataTerkait == dataTerkaitCheck
        );
        if (checkPresensi) {
          const checkRiwayatPresensi = await withTokenRefresh(login, () =>
            presensi.getRiwayatPresensi(
              login.ST,
              login.token,
              jadwalSekarang.nomor,
              jadwalSekarang.matakuliah.jenisSchemaMk,
              login.nomorMhs
            )
          );
          console.log("Riwayat Presensi:", checkRiwayatPresensi);
          const today = new Date().toISOString().split("T")[0];
          const keyPresensi = checkRiwayatPresensi.find((r) => {
            const [dd, mm, yyyy] = r.tanggal.split(" ")[0].split("-");
            const tanggalRiwayat = `${yyyy}-${mm}-${dd}`;
            return tanggalRiwayat === today && r.key === infoPresensi.key;
          });
          console.log("Cek Presensi hari ini:", keyPresensi);
          if (!keyPresensi || keyPresensi === undefined) {
            console.log("Belum melakukan presensi hari ini.");
            console.log("Melakukan presensi...");
            const push = await withTokenRefresh(login, () =>
              presensi.sumbitPresensi(
                login.ST,
                login.token,
                jadwalSekarang.nomor,
                login.nomorMhs,
                jadwalSekarang.matakuliah.jenisSchemaMk,
                jadwalSekarang.kuliah_asal,
                infoPresensi.key
              )
            );
            if (push.sukses == true) {
              console.log("Presensi berhasil:", push.message);
              const optimalDelay = calculateOptimalDelay(jadwalData);
              await delay(optimalDelay);
              continue;
            } else {
              console.log(JSON.stringify(push))
              console.log("Gagal presensi:", push.message);
            }
          } else {
            console.log("Sudah melakukan presensi hari ini:", keyPresensi);
            const optimalDelay = calculateOptimalDelay(jadwalData);
            await delay(optimalDelay);
            continue;
          }
        } else {
          console.log("Tidak ada notifikasi presensi yang sesuai.");
          const optimalDelay = calculateOptimalDelay(jadwalData);
          await delay(optimalDelay);
          continue;
        }
      } else {
        console.log("Presensi belum dibuka.");
      }
      console.log("Menunggu 15 menit untuk pengecekan berikutnya...");
      await delay(3 * 60 * 1000);
    } else {
      console.log("Tidak ada jadwal kuliah saat ini.");

      const optimalDelay = calculateOptimalDelay(jadwalData);
      await delay(optimalDelay);
    }
  }
}

main().catch((err) => {
  console.error("Error di main:", err);
});
