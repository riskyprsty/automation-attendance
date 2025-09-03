let Tahun = new Date().getFullYear();
let Hari = new Date().getDay();
let Waktu =
  new Date().toDateString() +
  " " +
  new Date().toLocaleTimeString("id-ID", { hour12: false });

console.log(`🕒 ${Waktu}`);
console.log(`📅 Tahun: ${Tahun}, Hari: ${Hari}`);
console.log("===================================");
console.log(new Date().toISOString());
