import babel from "@rollup/plugin-babel";
import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import jsx from "acorn-jsx";

// Shared configuration
const sharedConfig = {
  acornInjectPlugins: [jsx()],
  external: ["react"],
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      preventAssignment: true,
    }),
    typescript({
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          noEmit: false,
        },
      },
    }),
    babel({
      babelHelpers: "bundled",
      presets: [
        ["@babel/preset-react", { runtime: "automatic" }],
        "@babel/preset-typescript",
      ],
      extensions: [".ts", ".tsx"],
    }),
  ],
};

module.exports = [
  {
    ...sharedConfig,
    input: "./index.tsx",
    output: {
      file: "./dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
  },
  {
    ...sharedConfig,
    input: "./index.tsx",
    output: {
      name: "group-hug",
      file: "./dist/index.umd.js",
      format: "umd",
      sourcemap: true,
    },
  },
];
