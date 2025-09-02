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
    return res.data;
  };
}
export { Presensi };
