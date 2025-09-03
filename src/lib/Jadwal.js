import axios from "axios";
import { URL_ETHOL } from "../utils/url.js";
import { SEMESTER } from "../utils/account.js";
import fs from "fs";

export class Jadwal {
  constructor() {
    this.hakAktif = "mahasiswa";
    this.filename = "jadwal.json";
  }

  parseJadwal() {
    try {
      const raw = fs.readFileSync("jadwal.json", "utf-8");
      const data = JSON.parse(raw);
      const hasil = data.map((item) => ({
        nomor: item.nomor,
        jenisSchema: item.jenisSchema,
      }));
      return hasil;
    } catch (err) {
      console.error("Gagal parsing jadwal:", err);
      return [];
    }
  }
  saveJadwalToFile(data, filename = this.filename) {
    try {
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      console.log(`Jadwal berhasil disimpan ke ${filename}`);
    } catch (err) {
      console.error("Gagal menyimpan jadwal:", err);
    }
  }

  getJadwal = async (ST, Token) => {
    try {
      const res = await axios.get(`${URL_ETHOL}/api/kuliah`, {
        params: {
          tahun: new Date().getFullYear(),
          semester: SEMESTER,
        },
        headers: {
          Cookie: `PHPSESSID=${ST}; token=${Token}; hakAktif=${this.hakAktif}`,
          "Sec-Ch-Ua-Platform": '"Linux"',
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          Dnt: 1,
          "Sec-Ch-Ua":
            '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
          "Sec-Ch-Ua-Mobile": "?0",
          Token: Token,
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Dest": "empty",
        },
      });
      fs.writeFileSync(this.filename, JSON.stringify(res.data, null, 2));
      return res.data;
    } catch (error) {
      console.error("Error getJadwal:", error.message);
      throw error;
    }
  };

  getJadwalHarian = async (ST, Token) => {
    try {
      const kuliahs = this.parseJadwal();
      if (kuliahs.length === 0) {
        throw new Error("Jadwal kosong, silakan ambil jadwal terlebih dahulu.");
      }
      const res = await axios.post(
        `${URL_ETHOL}/api/kuliah/hari-kuliah-in`,
        {
          kuliahs: kuliahs,
          tahun: new Date().getFullYear(),
          semester: SEMESTER,
        },
        {
          headers: {
            Cookie: `PHPSESSID=${ST}; token=${Token}; hakAktif=${this.hakAktif}`,
            "Sec-Ch-Ua-Platform": '"Linux"',
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
            Accept: "application/json, text/plain, */*",
            Dnt: 1,
            "Sec-Ch-Ua":
              '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
            "Sec-Ch-Ua-Mobile": "?0",
            Token: Token,
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
          },
        }
      );
      return res.data;
    } catch (error) {
      console.error("Error getJadwalHarian:", error.message);
      throw error;
    }
  };
  mergeJadwal = async (ST, Token) => {
    try {
      const jadwal = await this.getJadwal(ST, Token);
      const jadwalHarian = await this.getJadwalHarian(ST, Token);
      const merged = jadwal.map((matkul) => {
        const harian = jadwalHarian.find((h) => h.kuliah === matkul.nomor);
        return {
          ...matkul,
          hari: harian?.hari || null,
          jamMulai: harian?.jam_awal || null,
          jamSelesai: harian?.jam_akhir || null,
        };
      });

      this.saveJadwalToFile(merged, this.filename);

      return merged;
    } catch (error) {
      console.error("Error mergeJadwal:", error.message);
      return [];
    }
  };
  getJadwalJson = async () => {
    const data = await fs.promises.readFile(this.filename, "utf-8");
    const jadwal = JSON.parse(data);
    try {
      return jadwal;
    } catch (parseErr) {
      console.error("Gagal parsing file jadwal:", parseErr);
      return [];
    }
  };
}
