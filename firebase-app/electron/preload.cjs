const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("jdwrightDesktop", {
  platform: "windows-desktop",
});
