import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export const API = axios.create({
  baseURL: `${API_BASE_URL}/api` || "/api",
  withCredentials: true,
});
