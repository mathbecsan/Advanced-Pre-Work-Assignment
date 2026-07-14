import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        films: resolve(__dirname, "films.html"),
        people: resolve(__dirname, "people.html"),
      },
    },
  },
});
