import OpenAI from "openai";
import app from "./express.ts";
const keyEnvName = "OPENROUTER_API_KEY";

async function auth() {
  if (keyEnvName in process.env) return process.env[keyEnvName];

  let authorized = false;
  const eventuallyKey = new Promise<string>((resolve, reject) => {
    const callback = encodeURIComponent("http://localhost:3000/");
    console.log("Visit: https://openrouter.ai/auth?callback_url=" + callback);
    app.use(async (req, res, next) => {
      if (authorized) return next();
      if (!req.query.code) {
        const url = new URL(
          req.url,
          `http://${req.headers.host ?? "localhost:3000"}`,
        );
        return res.redirect(
          "https://openrouter.ai/auth?callback_url=" +
            encodeURIComponent(url.toString()),
        );
      }
      const code = req.query.code;

      const key = await fetch("https://openrouter.ai/api/v1/auth/keys", {
        method: "POST",
        body: JSON.stringify({
          code,
        }),
      }).then((res) => {
        if (res.ok) return res.json();
        reject("Failed to get key");
      });

      res.redirect("/");
      resolve(key.key);
    });
  });
  const key = await eventuallyKey;
  authorized = true;
  return key;
}

export const openrouter = new OpenAI({
  timeout: 20_000,
  maxRetries: 2,
  apiKey: await auth(),
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000", // To identify your app. Can be set to e.g. http://localhost:3000 for testing
    //"X-Title": '', // Optional. Shows on openrouter.ai
  },
});
