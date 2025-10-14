import "dotenv/config";
import { password } from "@inquirer/prompts";
import axios from "axios";
import https from "https";

const TOKEN = await password({ message: "token :" });
const VAULT_URL = process.env.VAULT_URL;
let USERNAME, PASSWORD, SEMESTER;

const vault = axios.create({
  baseURL: `${VAULT_URL}/v1`,
  headers: {
    "X-Vault-Token": TOKEN,
  },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
});

try {
  const response = await vault.get(`attendance/account`);
  const { data } = response.data;

  USERNAME = data["email"];
  PASSWORD = data["password"];
  SEMESTER = process.env.semester;
} catch (err) {
  console.error("Error accessing Vault:", err.message);
  process.exit(1);
}

export { USERNAME, PASSWORD, SEMESTER };
