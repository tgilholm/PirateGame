import express from "express";
import http from "http";
import path, { dirname } from "path";
import { Server } from "socket.io"
import { fileURLToPath } from "url";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, '../client')));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

io.on("connection", (socket) => {
    console.log("Player connected: ", socket.id);

    socket.on("disconnect", () => {
        console.log("Player disconnected: ", socket.id);
    })
})

server.listen(3000, () => {
    console.log("Server launched on port 3000");
});
