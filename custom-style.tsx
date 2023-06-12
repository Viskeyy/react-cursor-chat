import { useState } from "react";
import { createRoot } from "react-dom/client";
import { createPresence } from "@yomo/presence";
import CursorChat from "./index";
import { faker } from "@faker-js/faker";
import "./entry.css";

const domContainer = document.querySelector("#app");
if (!domContainer) throw new Error("no dom container");
const root = createRoot(domContainer);

const id = Math.random().toString();
let url =
  (import.meta as any).env.VITE_PRESENCE_URL || "https://lo.yomo.dev:8443/v1";
const presence = createPresence(url, {
  publicKey: (import.meta as any).env.VITE_PRESENCE_PUBLIC_KEY,
  id,
  autoDowngrade: true,
});

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  return (
    <div
      style={{
        background: darkMode ? "black" : "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        height: "100vh",
        width: "100vw",
      }}
    >
      <button
        style={{
          color: darkMode ? "black" : "white",
          background: "pink",
          borderRadius: "4px",
          padding: "16px",
          cursor: "none",
        }}
        onClick={() => {
          setDarkMode(!darkMode);
        }}
      >
        {darkMode ? "close dark mode" : "open dark mode"}
      </button>
      <CursorChat
        presence={presence}
        id={id}
        name={faker.name.fullName()}
        avatar={faker.image.avatar()}
        color={'#4d6ef8'}
        cursorSize={'16'}
        bubbleBorderRadius={'2px'}
        inputBorderRadius={'2px'}
        avatarBorderRadius={'2px'}
      />
    </div>
  );
};

root.render(<App />);
