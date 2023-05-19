# @yomo/react-cursor-chat

![version](https://badgen.net/npm/v/@yomo/react-cursor-chat)
![license](https://badgen.net/npm/license/@yomo/presencejs)

<p align="center">
    <img src="https://github.com/yomorun/react-cursor-chat/raw/main/show.gif" alt="yomo react-cursor-chat" width="100%"></img><br/>
    <a href="https://www.producthunt.com/posts/cursor-chat-anywhere?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-cursor-chat-anywhere" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=333289&theme=dark" alt="Cursor Chat Anywhere - Add Figma like cursor chat to your own products | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## 🧬 Introduction

A react component helps bring Figma's Cursor Chat to your web applications in less than 3 minutes, making real-time collaboration anywhere based on [Presencejs](https://presence.js.org).

- Press `/` to bring up the input box

## 🤹🏻‍♀️ Quick Start

### Installation

by `npm`:

```shell
$ npm i --save @yomo/react-cursor-chat @yomo/presence
```

by `pnpm`:

```shell
$ pnpm add @yomo/react-cursor-chat @yomo/presence
```

### Integrate to your project

```javascript
import { createPresence } from "@yomo/presence";
import CursorChat from "@yomo/react-cursor-chat";
import "@yomo/react-cursor-chat/dist/style.css";

const user = {
  ID: "spiderman",
  Name: "Peter Parker",
  avatar: "https://i.pravatar.cc/150?img=3",
};

let url = env.NEXT_PUBLIC_PRESENCE_URL || "https://lo.yomo.dev:8443/v1";
const presence = createPresence(url, {
  publicKey: env.NEXT_PUBLIC_PRESENCE_PUBLIC_KEY,
  id: user.ID,
  autoDowngrade: true, // downgrade to websocket automatically if webTransport not work
});

const App = () => {
  return (
    <div className="main">
      <img className="logo" src={logo} alt="logo" />
      <p className="tips">
        Press <span>/</span> to bring up the input box <br /> Press{" "}
        <span>ESC</span> to close the input box
      </p>
      <CursorChat
        presence={presence}
        id={user.ID}
        name={user.Name}
        avatar={user.avatar}
      />
    </div>
  );
};
```

Before running the frontend project, you need start the Presence Server: [prscd](https://github.com/yomorun/presencejs) service.
The `prscd` can be download from the [release page](https://github.com/yomorun/presencejs/releases).
Or, you can `gh repo clone yomorun/presencejs` to get the source code, and run `cd prscd && make dev` to start in development mode.

## 📚 Documentation

- More about how to implement your real-time application by [Presencejs](https://github.com/yomorun/presencejs)
- Docs: https://presence.js.org

## 🤝 Free Hosting for Developers

For the convenience of developers, we provide a free hosting service for Presence Server for concurrent connections less than 1000, request for your own on [Allegro Cloud](https://allegrocloud.io).
