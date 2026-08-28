import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const PISTON_API_URL = process.env.PISTON_API_URL || "http://127.0.0.1:2000/api/v2/execute";
const PISTON_API_TOKEN = process.env.PISTON_API_TOKEN;
const io = new Server(server, {
    cors:{
        origin: "*",
    },
});

const rooms = new Map();
io.on("connection", (socket)=>{
    console.log("user connected", socket.id);

    let currentRoom = null;
    let currentUser = null;

    socket.on("join", ({roomId, userName})=>{
        if(currentRoom){
            socket.leave(currentRoom);
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
        }

        currentRoom = roomId;
        currentUser = userName;
        socket.join(roomId);

        if(!rooms.has(roomId)){
            rooms.set(roomId, new Set());
        }

        rooms.get(roomId).add(userName);
        io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)))
    });

    socket.on("codeChange", ({roomId, code}) => {
        socket.to(roomId).emit("codeUpdate", code);
        socket.emit("code-update-ack", { receivedAt: new Date().toISOString() });
    });

    socket.on("leaveRoom", ()=>{
        if(currentRoom && currentUser){
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined",  Array.from(rooms.get(currentRoom)));
            socket.leave(currentRoom);
            currentRoom=null;
            currentUser=null;
        }
    });

    socket.on("typing", ({roomId, userName})=>{
        socket.to(roomId).emit("userTyping", userName);
    });

    socket.on("languageChange", ({roomId, language}) => {
        socket.to(roomId).emit("languageUpdate", language);
    });

    socket.on("compileCode", async({code, roomId, language, version}) => {
        console.log("compileCode event received:", { roomId, language, version, codeLength: code.length });
        if(rooms.has(roomId)){
            const room = rooms.get(roomId);
            const fileExtensions = {
                gcc: 'cpp',
                python: 'py',
                node: 'js',
                java: 'java'
            };
            const fileName = `main.${fileExtensions[language] || 'txt'}`;
            try {
                console.log("Sending to Piston API...", { url: PISTON_API_URL, tokenConfigured: Boolean(PISTON_API_TOKEN) });
                const config = {
                    headers: {}
                };

                if (PISTON_API_TOKEN) {
                    config.headers.Authorization = `Bearer ${PISTON_API_TOKEN}`;
                }

                const response = await axios.post(PISTON_API_URL, {
                    language,
                    version,
                    files: [
                        {
                            name: fileName,
                            content: code
                        }
                    ]
                }, config);

                console.log("Piston API response:", response.data);
                room.output = response.data.run.output;
                io.to(roomId).emit("codeResponse", response.data);
            } catch (error) {
                console.error("Piston API error:", error.response?.status, error.response?.data || error.message);
                const errorMessage = error.response?.status === 401
                    ? "Piston API authorization failed. Set PISTON_API_TOKEN or run a local Piston instance."
                    : error.response?.data?.message || error.message;
                io.to(roomId).emit("codeResponse", { run: { output: "Error: " + errorMessage } });
            }
        } else {
            console.log("Room not found:", roomId);
        }
    });

    socket.on("disconnect", ()=>{
        if(currentRoom && currentUser){
            rooms.get(currentRoom).delete(currentUser);
            io.to(currentRoom).emit("userJoined",  Array.from(rooms.get(currentRoom)));
        }
        console.log("User disconnected");
    })
});
server.listen(PORT, ()=>{
    console.log("server is working on port", PORT);
});


