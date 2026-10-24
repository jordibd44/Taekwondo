import { defineConfig } from "vite";

// Rutas relativas: funciona en GitHub Pages (/Taekwondo/) y en Docker (/)
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: { main: "index.html", spinner: "spinner.html" },
    },
  },
});
