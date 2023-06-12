import { createContext, useContext, useEffect, useState } from "react";
import { IChannel } from "@yomo/presence";
import { CursorChatProps, Cursor as ICursor, State } from "./types";

const colors = [
  "#FF38D1",
  "#8263FF",
  "#0095FF",
  "#00B874",
  "#FF3168",
  "#FFAB03",
];

// Function to get a random color from the array
function getRandomColor() {
  const idx = Math.floor(Math.random() * colors.length);
  const color = colors[idx];
  return color;
}

// CursorChat context
const CursorChatCtx = createContext<{
  others: ICursor[];
  self: ICursor;
  props: any;
} | null>(null);

export default function CursorChat({
  id,
  color = getRandomColor(),
  name = "visitor",
  avatar,
  latency,
  region,
  presence,
  ...props
}: CursorChatProps) {
  // #region define the cursor state
  // initialize the cursor state
  const [myState, setMyState] = useState<ICursor>({
    id,
    state: "online",
    color,
    x: 0,
    y: 0,
    message: "",
    name,
    avatar,
    latency,
    region,
  });

  // initialize other cursors state
  const [otherCursors, setOtherCursors] = useState<ICursor[]>([]);
  // initialize the connection state
  const [connected, setConnected] = useState(false);
  const [channel, setChannel] = useState<IChannel | null>(null);
  // #endregion

  // #region initialize the presence connection
  useEffect(() => {
    let channel: IChannel | null = null;

    presence.then((yomo) => {
      channel = yomo.joinChannel("live-cursor", myState);
      setConnected(true);
      setChannel(channel);
      // hidden user cursor only connected to prscd
      document.body.style.cursor = "none";
    });

    return () => {
      // unsubscribe from the channel
      channel?.leave();
    };
  }, []);
  // #endregion

  // #region initialize the cursor state
  useEffect(() => {
    if (!channel) {
      return;
    }
    // listen to other cursors join
    const unsubscribePeers = channel.subscribePeers((peers) => {
      setOtherCursors([...(peers as ICursor[])]);
    });

    return () => {
      unsubscribePeers();
    };
  }, [channel]);
  // #endregion

  // #region add event listeners to update the cursor state
  useEffect(() => {
    if (!channel) {
      return;
    }

    // listen to other cursors state change
    const updateStateHandler = ({ payload }: { payload: ICursor }) => {
      const others = otherCursors.filter((c) => c.id !== payload.id);
      setOtherCursors([...others, payload]);
    };

    const unsubscribe = channel.subscribe("update-state", updateStateHandler);
    return () => {
      unsubscribe?.();
    };
  }, [channel, otherCursors]);
  // #endregion

  // #region add event listeners to update the cursor visibility
  useEffect(() => {
    if (!channel) {
      return;
    }
    // update the cursor state
    const visibilitychangeHandler = () => {
      const newState: ICursor = {
        ...myState,
        state: document.hidden ? "away" : "online",
      };

      channel?.broadcast("update-state", newState);
      setMyState(newState);
    };
    document.addEventListener("visibilitychange", visibilitychangeHandler);

    return () => {
      // remove listeners
      document.removeEventListener("visibilitychange", visibilitychangeHandler);
    };
  }, [channel, otherCursors, myState]);
  // #endregion

  // #region add event listeners to update the cursor message
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    // use requestAnimationFrame to throttle the mousemove event
    let needForRAF = true;
    // update the cursor position
    const mousemoveHandler = (e: MouseEvent) => {
      if (needForRAF) {
        needForRAF = false;
        requestAnimationFrame(updateMouseState(e.clientX, e.clientY));
      }
    };

    const updateMouseState = (x: number, y: number) => {
      needForRAF = true;
      return () => {
        // if the cursor is not connected, do nothing
        if (!channel) {
          return;
        }
        const newState: ICursor = {
          ...myState,
          x,
          y,
        };
        channel.broadcast("update-state", newState);
        setMyState(newState);
      };
    };

    document.addEventListener("mousemove", mousemoveHandler);
    return () => {
      document.removeEventListener("mousemove", mousemoveHandler);
    };
  }, [myState, channel]);
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === "/" || e.key === "Slash") {
        e.preventDefault();
        setTyping(true);
      }
    };
    const keyupHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        setTyping(false);
      }
    };
    document.addEventListener("keydown", keydownHandler);
    document.addEventListener("keyup", keyupHandler);
    return () => {
      document.removeEventListener("keydown", keydownHandler);
      document.removeEventListener("keyup", keyupHandler);
    };
  }, []);

  const onMessageChange = (message: string) => {
    const newState: ICursor = { ...myState, message };
    channel?.broadcast("update-state", newState);
    setMyState(newState);
  };
  // #endregion

  // #region sync the cursor state to peers
  useEffect(() => {
    if (!channel) {
      return;
    }
    // sync the cursor state to peers
    const unsubscribePeers = channel.subscribePeers(() => {
      channel.broadcast("update-state", myState);
    });

    return () => {
      unsubscribePeers();
    };
  }, [channel, myState]);
  // #endregion

  // #region hide the cursor default style
  useEffect(() => {
    if (!channel) {
      return;
    }
    document.body.style.cursor = "none";

    return () => {
      document.body.style.cursor = "auto";
    };
  }, [channel]);
  // #endregion

  // if in SSR, do nothing
  if (typeof window === "undefined") {
    return null;
  }

  if (!connected) {
    return null;
  }

  return (
    <CursorChatCtx.Provider
      value={{
        others: otherCursors,
        self: myState,
        props,
      }}
    >
      <Cursor
        x={myState.x}
        y={myState.y}
        color={myState.color}
        message={myState.message}
        typing={typing}
        name={myState.name}
        avatar={myState.avatar}
        latency={myState.latency}
        region={myState.region}
        onMessageChange={onMessageChange}
        {...props}
      />
      <OtherCursors />
    </CursorChatCtx.Provider>
  );
}

function OtherCursors() {
  const ctx = useContext(CursorChatCtx);
  if (!ctx) {
    return null;
  }
  const { others: cursors, props } = ctx;
  return (
    <>
      {cursors.map((c) => (
        <Cursor
          key={c.id}
          x={c.x}
          y={c.y}
          color={c.color}
          name={c.name}
          avatar={c.avatar}
          latency={c.latency}
          region={c.region}
          message={c.message}
          state={c.state}
          {...props}
        />
      ))}
    </>
  );
}

function Cursor({
  x,
  y,
  color,
  name,
  avatar,
  latency,
  region,
  message,
  state,
  typing = false,
  onMessageChange,
  cursorSize = "20",
  cursorImage,
  bubbleBorderRadius = "18px",
  bubbleBorderTopLeftRadius = "",
  bubbleBorderTopRightRadius = "",
  bubbleBorderBottomLeftRadius = "",
  bubbleBorderBottomRightRadius = "",
  avatarBorderRadius = "12px",
  avatarBorderTopLeftRadius,
  avatarBorderTopRightRadius,
  avatarBorderBottomLeftRadius,
  avatarBorderBottomRightRadius,
  bubbleBackgroundColor,
  bubbleFontColor,
  inputTextStyle,
  inputBorderRadius = "",
  inputBorderTopLeftRadius = "2px",
  inputBorderTopRightRadius = "20px",
  inputBorderBottomLeftRadius = "31px",
  inputBorderBottomRightRadius = "20px",
  children,
}: {
  x: number;
  y: number;
  color: string;
  name?: string;
  avatar?: string;
  latency?: number;
  region?: string;
  message?: string;
  state?: State;
  typing?: boolean;
  onMessageChange?: (message: string) => void;
  cursorSize?: string;
  cursorImage?: string;
  bubbleBorderRadius?: string;
  bubbleBorderTopLeftRadius?: string;
  bubbleBorderTopRightRadius?: string;
  bubbleBorderBottomLeftRadius?: string;
  bubbleBorderBottomRightRadius?: string;
  avatarBorderRadius?: string;
  avatarBorderTopLeftRadius?: string;
  avatarBorderTopRightRadius?: string;
  avatarBorderBottomLeftRadius?: string;
  avatarBorderBottomRightRadius?: string;
  bubbleBackgroundColor?: string;
  bubbleFontColor?: string;
  inputTextStyle?: React.CSSProperties;
  inputBorderRadius?: string;
  inputBorderTopLeftRadius?: string;
  inputBorderTopRightRadius?: string;
  inputBorderBottomLeftRadius?: string;
  inputBorderBottomRightRadius?: string;
  children?: ({
    x, y
  }:{
    x: number;
    y: number;
  }) => JSX.Element;
}) {
  if(children) {
    return children({x, y});
  }
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 999999,
        pointerEvents: "none",
        maxWidth: "424px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        opacity: state === "away" ? 0.5 : 1,
      }}
    >
      {cursorImage || (
        <DefaultCursorImage color={color} cursorSize={cursorSize} />
      )}
      <div
        style={{
          backgroundColor: bubbleBackgroundColor || color,
          borderRadius:
            message || typing
              ? `
              ${inputBorderTopLeftRadius || inputBorderRadius || "2px"}
              ${inputBorderTopRightRadius || inputBorderRadius || "20px"}
              ${inputBorderBottomRightRadius || inputBorderRadius || "31px"}
              ${inputBorderBottomLeftRadius || inputBorderRadius || "20px"}
            `
              : `
            ${bubbleBorderTopLeftRadius || bubbleBorderRadius || "18px"}
            ${bubbleBorderTopRightRadius || bubbleBorderRadius || "18px"}
            ${bubbleBorderBottomRightRadius || bubbleBorderRadius || "18px"}
            ${bubbleBorderBottomLeftRadius || bubbleBorderRadius || "18px"}
            `,
          padding: message || typing ? "10px 20px" : "6px",
          wordWrap: "break-word",
          color: bubbleFontColor || "#fff",
        }}
        className="ml-[20px]"
      >
        <div className="text-[12px] flex gap-1">
          {(avatar || name) && (
            <div
              className="rounded-[12px] flex items-center"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
              }}
            >
              {avatar && (
                <img
                  src={avatar}
                  className="w-6 h-6"
                  style={{
                    borderRadius: `
                        ${avatarBorderTopLeftRadius ||
                      avatarBorderRadius ||
                      "12px"
                      }
                        ${avatarBorderTopRightRadius ||
                      avatarBorderRadius ||
                      "12px"
                      }
                        ${avatarBorderBottomRightRadius ||
                      avatarBorderRadius ||
                      "12px"
                      }
                        ${avatarBorderBottomLeftRadius ||
                      avatarBorderRadius ||
                      "12px"
                      }
                      `,
                  }}
                />
              )}
              {name && <div className="py-[2px] px-1.5">{name}</div>}
            </div>
          )}

          {(latency || region) && (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.1)",
              }}
              className="flex items-center gap-1 rounded-[12px] py-[2px] px-1.5"
            >
              <LatencyIcon />
              {latency && <span>{latency}ms</span>}
              {region && <span>{region}</span>}
            </div>
          )}
        </div>
        {typing ? (
          <input
            autoFocus
            className="bg-transparent border-none outline-none placeholder:text-[rgba(255,255,255,0.6)]"
            style={inputTextStyle}
            value={message}
            onInput={(e) => onMessageChange?.((e.target as any).value)}
            placeholder="Say something"
          />
        ) : (
          <span className="text-[14px]">{message}</span>
        )}
      </div>
    </div>
  );
}

function LatencyIcon() {
  return (
    <svg
      width="10"
      height="11"
      viewBox="0 0 10 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="5" cy="5.5" r="4.5" stroke="white" />
      <path
        d="M4.5 4C4.5 3.72386 4.72386 3.5 5 3.5V3.5C5.27614 3.5 5.5 3.72386 5.5 4V6.5V6.5C4.94772 6.5 4.5 6.05228 4.5 5.5V4Z"
        fill="white"
      />
      <path
        d="M5 6.5C4.72386 6.5 4.5 6.27614 4.5 6V5.5H7C7.27614 5.5 7.5 5.72386 7.5 6C7.5 6.27614 7.27614 6.5 7 6.5H5Z"
        fill="white"
      />
    </svg>
  );
}

function DefaultCursorImage({
  cursorSize,
  color,
}: {
  cursorSize: string;
  color: string;
}) {
  return (
    <svg
      width={cursorSize}
      height={cursorSize}
      viewBox="0 0 23 23"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#filter0_d_142_54)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.71004 1.98812C2.42625 1.1935 3.1935 0.426251 3.98812 0.710044L19.6524 6.30442C20.5016 6.60771 20.5472 7.7916 19.7238 8.15927L13.4448 10.9631C13.2194 11.0637 13.0393 11.2441 12.9389 11.4696L10.1582 17.7183C9.79136 18.5427 8.60637 18.4978 8.30287 17.648L2.71004 1.98812Z"
          fill={color}
        />
        <path
          d="M3.18091 1.81995C3.03902 1.42264 3.42264 1.03902 3.81995 1.18091L19.4842 6.77529C19.9088 6.92694 19.9316 7.51888 19.5199 7.70272L13.2409 10.5065C12.9029 10.6574 12.6326 10.9281 12.4821 11.2663L9.70142 17.515C9.51799 17.9272 8.92549 17.9048 8.77374 17.4799L3.18091 1.81995Z"
          stroke="white"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_142_54"
          x="0.64978"
          y="0.649767"
          width="21.6663"
          height="21.662"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_142_54"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_142_54"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}
