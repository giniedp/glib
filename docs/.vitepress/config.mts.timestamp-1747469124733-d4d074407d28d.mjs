// docs/.vitepress/config.mts
import { defineConfig } from "file:///E:/glib/node_modules/.pnpm/vitepress@1.6.3_@algolia+client-search@5.24.0_@types+node@20.14.2_lightningcss@1.29.2_postcss_2qnpa4clh6po3cmb4xd6d46q7u/node_modules/vitepress/dist/node/index.js";
import { generateSidebar } from "file:///E:/glib/node_modules/.pnpm/vitepress-sidebar@1.31.1/node_modules/vitepress-sidebar/dist/index.js";
import { fileURLToPath } from "node:url";
var __vite_injected_original_import_meta_url = "file:///E:/glib/docs/.vitepress/config.mts";
var config_default = defineConfig({
  title: "GGlib",
  description: "A VitePress Site",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "/markdown-examples" }
    ],
    // https://vitepress-sidebar.cdget.com/guide/getting-started
    sidebar: generateSidebar({
      documentRootPath: "/docs",
      useTitleFromFileHeading: true,
      collapsed: true,
      collapseDepth: 2,
      debugPrint: false,
      // includeRootIndexFile: true,
      // includeFolderIndexFile: true,
      includeEmptyFolder: false,
      useFolderLinkFromIndexFile: true,
      useFolderTitleFromIndexFile: true,
      useTitleFromFrontmatter: true,
      frontmatterTitleFieldName: "title",
      excludePattern: []
    }),
    socialLinks: [{ icon: "github", link: "https://github.com/vuejs/vitepress" }]
  },
  vite: {
    resolve: {
      alias: {
        "@components": fileURLToPath(new URL("./theme/components", __vite_injected_original_import_meta_url))
      }
    }
  }
});
export {
  config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZG9jcy8udml0ZXByZXNzL2NvbmZpZy5tdHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxnbGliXFxcXGRvY3NcXFxcLnZpdGVwcmVzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcZ2xpYlxcXFxkb2NzXFxcXC52aXRlcHJlc3NcXFxcY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovZ2xpYi9kb2NzLy52aXRlcHJlc3MvY29uZmlnLm10c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGVwcmVzcydcbmltcG9ydCB7IGdlbmVyYXRlU2lkZWJhciB9IGZyb20gJ3ZpdGVwcmVzcy1zaWRlYmFyJ1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ25vZGU6dXJsJ1xuLy8gaHR0cHM6Ly92aXRlcHJlc3MuZGV2L3JlZmVyZW5jZS9zaXRlLWNvbmZpZ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICB0aXRsZTogJ0dHbGliJyxcbiAgZGVzY3JpcHRpb246ICdBIFZpdGVQcmVzcyBTaXRlJyxcblxuICB0aGVtZUNvbmZpZzoge1xuICAgIC8vIGh0dHBzOi8vdml0ZXByZXNzLmRldi9yZWZlcmVuY2UvZGVmYXVsdC10aGVtZS1jb25maWdcbiAgICBuYXY6IFtcbiAgICAgIHsgdGV4dDogJ0hvbWUnLCBsaW5rOiAnLycgfSxcbiAgICAgIHsgdGV4dDogJ0V4YW1wbGVzJywgbGluazogJy9tYXJrZG93bi1leGFtcGxlcycgfSxcbiAgICBdLFxuXG4gICAgLy8gaHR0cHM6Ly92aXRlcHJlc3Mtc2lkZWJhci5jZGdldC5jb20vZ3VpZGUvZ2V0dGluZy1zdGFydGVkXG4gICAgc2lkZWJhcjogZ2VuZXJhdGVTaWRlYmFyKHtcbiAgICAgIGRvY3VtZW50Um9vdFBhdGg6ICcvZG9jcycsXG4gICAgICB1c2VUaXRsZUZyb21GaWxlSGVhZGluZzogdHJ1ZSxcbiAgICAgIGNvbGxhcHNlZDogdHJ1ZSxcbiAgICAgIGNvbGxhcHNlRGVwdGg6IDIsXG4gICAgICBkZWJ1Z1ByaW50OiBmYWxzZSxcblxuICAgICAgLy8gaW5jbHVkZVJvb3RJbmRleEZpbGU6IHRydWUsXG4gICAgICAvLyBpbmNsdWRlRm9sZGVySW5kZXhGaWxlOiB0cnVlLFxuICAgICAgaW5jbHVkZUVtcHR5Rm9sZGVyOiBmYWxzZSxcbiAgICAgIHVzZUZvbGRlckxpbmtGcm9tSW5kZXhGaWxlOiB0cnVlLFxuICAgICAgdXNlRm9sZGVyVGl0bGVGcm9tSW5kZXhGaWxlOiB0cnVlLFxuICAgICAgdXNlVGl0bGVGcm9tRnJvbnRtYXR0ZXI6IHRydWUsXG4gICAgICBmcm9udG1hdHRlclRpdGxlRmllbGROYW1lOiAndGl0bGUnLFxuICAgICAgZXhjbHVkZVBhdHRlcm46IFtdLFxuICAgIH0pLFxuXG4gICAgc29jaWFsTGlua3M6IFt7IGljb246ICdnaXRodWInLCBsaW5rOiAnaHR0cHM6Ly9naXRodWIuY29tL3Z1ZWpzL3ZpdGVwcmVzcycgfV0sXG4gIH0sXG4gIHZpdGU6IHtcblxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgICdAY29tcG9uZW50cyc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi90aGVtZS9jb21wb25lbnRzJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1UCxTQUFTLG9CQUFvQjtBQUNwUixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLHFCQUFxQjtBQUYySCxJQUFNLDJDQUEyQztBQUsxTSxJQUFPLGlCQUFRLGFBQWE7QUFBQSxFQUMxQixPQUFPO0FBQUEsRUFDUCxhQUFhO0FBQUEsRUFFYixhQUFhO0FBQUE7QUFBQSxJQUVYLEtBQUs7QUFBQSxNQUNILEVBQUUsTUFBTSxRQUFRLE1BQU0sSUFBSTtBQUFBLE1BQzFCLEVBQUUsTUFBTSxZQUFZLE1BQU0scUJBQXFCO0FBQUEsSUFDakQ7QUFBQTtBQUFBLElBR0EsU0FBUyxnQkFBZ0I7QUFBQSxNQUN2QixrQkFBa0I7QUFBQSxNQUNsQix5QkFBeUI7QUFBQSxNQUN6QixXQUFXO0FBQUEsTUFDWCxlQUFlO0FBQUEsTUFDZixZQUFZO0FBQUE7QUFBQTtBQUFBLE1BSVosb0JBQW9CO0FBQUEsTUFDcEIsNEJBQTRCO0FBQUEsTUFDNUIsNkJBQTZCO0FBQUEsTUFDN0IseUJBQXlCO0FBQUEsTUFDekIsMkJBQTJCO0FBQUEsTUFDM0IsZ0JBQWdCLENBQUM7QUFBQSxJQUNuQixDQUFDO0FBQUEsSUFFRCxhQUFhLENBQUMsRUFBRSxNQUFNLFVBQVUsTUFBTSxxQ0FBcUMsQ0FBQztBQUFBLEVBQzlFO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFFSixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxlQUFlLGNBQWMsSUFBSSxJQUFJLHNCQUFzQix3Q0FBZSxDQUFDO0FBQUEsTUFDN0U7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
