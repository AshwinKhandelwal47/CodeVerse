import { useEffect, useState } from "react";
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const socket = io("http://localhost:5000");

const RoomManager = () => {
  const { user, loading } = useAuth();
  
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  // userName is managed by auth now, so we can optionally auto-fill it but make it uneditable or auto-set.
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("gcc")
  const [code, setCode] = useState("// start coding....")
  const [copySuccess, setCopySuccess] = useState("")
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [output, setOutput] = useState("");
  const [version, setVersion] = useState("10.2.0");

  // Version map for languages
  const languageVersions = {
    gcc: "10.2.0",
    python: "3.10.0",
    node: "18.15.0",
    java: "15.0.2"
  };

  useEffect(() => {
    if (user && !userName) {
      setUserName(user.name);
    }
  }, [user, userName]);

  useEffect(() => {
    setVersion(languageVersions[language]);
  }, [language]);

  useEffect(()=>{
    socket.on("userJoined", (users)=>{
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode)=>{
      setCode(newCode);
    });

    socket.on("userTyping", (userId)=>{
      setTyping(`${userId} is typing...`);
      setTimeout(()=>{
        setTyping("");
      }, 5000);
    });

    socket.on("languageUpdate", (newlanguage)=>{
      setLanguage(newlanguage);
    });

    socket.on("codeResponse", (response)=>{
      setOutput(response.run.output);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("codeResponse");
    }
  }, []);

  useEffect(()=>{
    const handleBeforeUnload = ()=>{
      socket.emit("leaveRoom");
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return ()=>{
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, []);

  const joinRoom = () => {
    if(roomId && user?.name){
      socket.emit("join", {roomId, userName: user.name})
      setJoined(true);
    }
  }

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setCode("// start coding....");
    setLanguage("cpp");
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    setCopySuccess("Copied");
    setTimeout(() => {
      setCopySuccess("");
    }, 2000);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", {roomId, code: newCode});
    socket.emit("typing", ({roomId, userName: user?.name}));
  };

  const handleLanguageChange = (e)=>{
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setVersion(languageVersions[newLanguage]);
    socket.emit("languageChange", {roomId, language: newLanguage});
  }

  const runCode = () => {
    socket.emit("compileCode", {code, roomId, language, version});
  }

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if(!joined){
    return (
    <div className="join-container">
      <div className="join-form" style={{ marginTop: '2rem' }}>
        <h1>Join Code Room</h1>
        <input type="text" placeholder="Enter Room Id" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
        <input type="text" placeholder="Your name (from Google)" value={user.name} disabled className="disabled-input" />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
    )
  }
  
  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Code Room: {roomId}</h2>
          <button onClick={copyRoomId} className="copy-button">Copy Room Id</button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        <h3>Users in room:</h3>
        <ul>
          {
            users.map((u, index) => (
              <li key={index}>{u}</li>
            ))
          }
        </ul>
        <p className="typing-indicator">{typing}</p>
        <select className="language-selector" value={language} onChange={handleLanguageChange}>
          <option value="gcc">C++</option>
          <option value="python">Python</option>
          <option value="node">JavaScript</option>
          <option value="java">Java</option>
        </select>
        <button className="leave-button" onClick={leaveRoom}>Leave Room</button>
      </div>

      <div className="editor-wrapper">
        <Editor
          height={"60%"}
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={
            {
              minimap: {enabled:false},
              fontSize:14,
            }
          }
        />
        <div className="console-container">
          <div className="console-header">
            <button className="run-btn" onClick={runCode}>Execute</button>
          </div>
          <textarea className="output-console" value={output} readOnly placeholder="Output will appear here...." />
        </div>
      </div>
    </div>
  )
}

export default RoomManager;
