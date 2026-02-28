import { io } from "socket.io-client";

const socket = io(process.env.API_URL, {
  autoConnect: false,
});

export default socket;
