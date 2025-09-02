import axios from "axios";

import { URL_ETHOL } from "../utils/url.js";
import fs from "fs";
class Presensi {
  constructor() {}

  lastKulliah = async (ST, Token, nomor_kuliah, jenisSchema) => {
    const res = await axios.get(`${URL_ETHOL}/api/presensi/terakhir-kuliah`, {
      params: {
        kuliah: nomor_kuliah,
        jenis_schema: jenisSchema,
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
    console.log(res.data);
    return res.data;
  };

  jedaWaktu = (start, end) => {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };
}
export { Presensi };
