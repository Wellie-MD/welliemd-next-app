import axios from "axios";

const adminApi = axios.create({
  baseURL: "https://adminapi.welliemd.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// no auth headers here unless adminapi requires it
export default adminApi;
