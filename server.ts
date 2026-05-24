import express, { Request, Response } from "express";
import path from "path";
import https from "https";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Helper to execute HTTPS requests ignoring self-signed certificate errors (rejectUnauthorized: false)
function unifiRequest(
  urlStr: string,
  method: string,
  headers: Record<string, string>,
  body?: string
): Promise<{ body: string; headers: Record<string, string | string[] | undefined> }> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(urlStr);
      const isHttps = parsedUrl.protocol === "https:";

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: headers,
        rejectUnauthorized: false, // Essential for self-signed UniFi Controllers
      };

      const req = https.request(options, (res) => {
        let responseData = "";
        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          resolve({
            body: responseData,
            headers: res.headers,
          });
        });
      });

      req.on("error", (err) => {
        reject(err);
      });

      if (body) {
        req.write(body);
      }
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Ensure controller URL is clean and absolute
function cleanControllerUrl(url: string): string {
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = "https://" + cleanUrl;
  }
  // Trim trailing slash
  if (cleanUrl.endsWith("/")) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  return cleanUrl;
}

// --- UniFi Controller Proxy Endpoints ---

app.post("/api/unifi/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, username, password } = req.body;
    if (!url || !username || !password) {
      res.status(400).json({ error: "Missing required login fields (url, username, password)" });
      return;
    }

    const unifiUrl = cleanControllerUrl(url) + "/api/auth/login";
    const payload = JSON.stringify({ username, password });

    const result = await unifiRequest(
      unifiUrl,
      "POST",
      {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      payload
    );

    // Extract set-cookie
    const setCookie = result.headers["set-cookie"];
    let cookieStr = "";
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        cookieStr = setCookie.join("; ");
      } else {
        cookieStr = setCookie;
      }
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(result.body);
    } catch {
      parsedBody = { raw: result.body };
    }

    if (cookieStr) {
      res.json({
        success: true,
        cookie: cookieStr,
        details: parsedBody,
      });
    } else {
      // Sometimes UI logs in successfully but doesn't set typical headers in proxy, check status code
      res.status(400).json({
        error: "Failed to retrieve authentication cookie from your UniFi Controller. Please check username/password and make sure correct URL is reachable.",
        details: parsedBody,
      });
    }
  } catch (error: any) {
    console.error("UniFi login proxy error:", error);
    res.status(500).json({
      error: `Connection error: ${error.message || error}. Ensure your UniFi controller is reachable from our server or paste files manually.`,
    });
  }
});

app.post("/api/unifi/networks", async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, cookie, siteName } = req.body;
    if (!url || !cookie) {
      res.status(400).json({ error: "Missing URL or cookie for API request" });
      return;
    }

    const site = (siteName || "default").trim();
    const cleanUrl = cleanControllerUrl(url);

    // Try standard UniFi OS path: /proxy/network/api/s/.../rest/networkconf
    // Alternative legacy path: /api/s/.../rest/networkconf
    let networkUrl = `${cleanUrl}/proxy/network/api/s/${site}/rest/networkconf`;
    let result = await unifiRequest(networkUrl, "GET", {
      "Cookie": cookie,
      "Accept": "application/json",
    });

    // If we get an error or html response (redirects/404s), try the alternative legacy path
    if (result.body.trim().startsWith("<!DOCTYPE") || result.body.includes("LoginPage")) {
      const altUrl = `${cleanUrl}/api/s/${site}/rest/networkconf`;
      const altResult = await unifiRequest(altUrl, "GET", {
        "Cookie": cookie,
        "Accept": "application/json",
      });
      if (!altResult.body.trim().startsWith("<!DOCTYPE")) {
        result = altResult;
      }
    }

    try {
      const parsed = JSON.parse(result.body);
      res.json(parsed);
    } catch {
      res.status(400).json({
        error: "Controller returned an invalid JSON response structure. Please verify authentication.",
        raw: result.body,
      });
    }
  } catch (error: any) {
    console.error("Networks fetch proxy error:", error);
    res.status(500).json({ error: error.message || error });
  }
});

app.post("/api/unifi/clients", async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, cookie, siteName } = req.body;
    if (!url || !cookie) {
      res.status(400).json({ error: "Missing URL or cookie for API request" });
      return;
    }

    const site = (siteName || "default").trim();
    const cleanUrl = cleanControllerUrl(url);

    // Try standard: /proxy/network/api/s/.../stat/sta
    let clientUrl = `${cleanUrl}/proxy/network/api/s/${site}/stat/sta`;
    let result = await unifiRequest(clientUrl, "GET", {
      "Cookie": cookie,
      "Accept": "application/json",
    });

    if (result.body.trim().startsWith("<!DOCTYPE") || result.body.includes("LoginPage")) {
      const altUrl = `${cleanUrl}/api/s/${site}/stat/sta`;
      const altResult = await unifiRequest(altUrl, "GET", {
        "Cookie": cookie,
        "Accept": "application/json",
      });
      if (!altResult.body.trim().startsWith("<!DOCTYPE")) {
        result = altResult;
      }
    }

    try {
      const parsed = JSON.parse(result.body);
      res.json(parsed);
    } catch {
      res.status(400).json({
        error: "Controller returned an invalid JSON response structure. Please verify authentication.",
        raw: result.body,
      });
    }
  } catch (error: any) {
    console.error("Clients fetch proxy error:", error);
    res.status(500).json({ error: error.message || error });
  }
});

app.post("/api/unifi/portforward", async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, cookie, siteName } = req.body;
    if (!url || !cookie) {
      res.status(400).json({ error: "Missing URL or cookie for API request" });
      return;
    }

    const site = (siteName || "default").trim();
    const cleanUrl = cleanControllerUrl(url);

    let pfUrl = `${cleanUrl}/proxy/network/api/s/${site}/rest/portforward`;
    let result = await unifiRequest(pfUrl, "GET", {
      "Cookie": cookie,
      "Accept": "application/json",
    });

    if (result.body.trim().startsWith("<!DOCTYPE") || result.body.includes("LoginPage")) {
      const altUrl = `${cleanUrl}/api/s/${site}/rest/portforward`;
      const altResult = await unifiRequest(altUrl, "GET", {
        "Cookie": cookie,
        "Accept": "application/json",
      });
      if (!altResult.body.trim().startsWith("<!DOCTYPE")) {
        result = altResult;
      }
    }

    try {
      const parsed = JSON.parse(result.body);
      res.json(parsed);
    } catch {
      res.status(400).json({
        error: "Controller returned an invalid JSON response structure for Port Forwards.",
        raw: result.body,
      });
    }
  } catch (error: any) {
    console.error("Port Forward fetch proxy error:", error);
    res.status(500).json({ error: error.message || error });
  }
});

// --- GitHub Repository Sync Integration ---

// Zero-dependency HTTPS client for GitHub REST API
function githubRequest(
  pathStr: string,
  method: string,
  token: string,
  body?: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com${pathStr}`;
    const parsedUrl = new URL(url);
    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        "User-Agent": "unifi-terraform-exporter",
        "Accept": "application/vnd.github+json",
        "Authorization": `token ${token.trim()}`,
        "Content-Type": "application/json"
      }
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(responseData ? JSON.parse(responseData) : {});
          } catch {
            resolve({ raw: responseData });
          }
        } else {
          try {
            const parsedErr = JSON.parse(responseData);
            reject(new Error(parsedErr.message || `HTTP Status ${res.statusCode}`));
          } catch {
            reject(new Error(responseData || `HTTP Status ${res.statusCode}`));
          }
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

app.post("/api/github/sync", async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, owner, repo, branch, commitMessage, files } = req.body;
    if (!token || !owner || !repo || !files) {
      res.status(400).json({ error: "Missing required parameters (token, owner, repo, files)" });
      return;
    }

    const refBranch = (branch || "main").trim();
    const message = (commitMessage || "chore: sync UniFi definitions to Terraform").trim();

    // Step 1: Get the SHA of the latest commit on the branch
    let headRef;
    try {
      headRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${refBranch}`, "GET", token);
    } catch (err: any) {
      res.status(400).json({
        error: `Could not reach branch '${refBranch}' in repository '${owner}/${repo}'. Please ensure the repo has been initialized with at least one commit (e.g. standard README) and your Personal Access Token (PAT) has 'repo' scopes permissions. Detail: ${err.message}`
      });
      return;
    }

    const latestCommitSha = headRef.object.sha;

    // Step 2: Get the tree of the latest commit
    const latestCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, "GET", token);
    const baseTreeSha = latestCommit.tree.sha;

    // Step 3: Create a new tree with our multiple files
    const treeItems = Object.entries(files).map(([filePath, content]) => ({
      path: filePath,
      mode: "100644",
      type: "blob",
      content: content as string
    }));

    const newTree = await githubRequest(`/repos/${owner}/${repo}/git/trees`, "POST", token, {
      base_tree: baseTreeSha,
      tree: treeItems
    });

    // Step 4: Create a new commit pointing to the new tree and parent commit
    const newCommit = await githubRequest(`/repos/${owner}/${repo}/git/commits`, "POST", token, {
      message: message,
      tree: newTree.sha,
      parents: [latestCommitSha]
    });

    // Step 5: Update the reference to point to the new commit
    const updatedRef = await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${refBranch}`, "PATCH", token, {
      sha: newCommit.sha,
      force: false
    });

    res.json({
      success: true,
      commitSha: newCommit.sha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
      ref: updatedRef.ref
    });

  } catch (error: any) {
    console.error("GitHub Sync error:", error);
    res.status(500).json({
      error: error.message || "Failed to commit files to GitHub repository due to server connection issues."
    });
  }
});

// --- Server-Side Gemini Optimizer Endpoint ---

app.post("/api/gemini/optimize", async (req: Request, res: Response): Promise<void> => {
  try {
    const { files, prompt } = req.body;
    if (!files || !prompt) {
      res.status(400).json({ error: "Missing files or prompt parameters" });
      return;
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
      res.status(500).json({
        error: "Gemini API key is not configured in this workspace yet. Please add it in Settings > Secrets.",
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const fileContentStr = `
Providers.tf:
\`\`\`hcl
${files["providers.tf"]}
\`\`\`

Variables.tf:
\`\`\`hcl
${files["variables.tf"]}
\`\`\`

Networks.tf:
\`\`\`hcl
${files["networks.tf"]}
\`\`\`

Clients.tf:
\`\`\`hcl
${files["clients.tf"]}
\`\`\`
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        "Please refactor and optimize the following Terraform files according to this request: " + prompt,
        fileContentStr,
      ],
      config: {
        systemInstruction: `You are a professional Site Reliability Engineer and UniFi Network Systems Architect.
    
Your task is to review and refactor the provided unifi terraform infrastructure files based on the user's prompt (for example: renaming resource blocks, adding comments, parameterizing subnets into variables, grouping clients beautifully, extracting shared variables, etc.).

Return ONLY a valid JSON object matching this schema:
{
  "providers.tf": "string containing updated configuration",
  "variables.tf": "string containing updated variables",
  "networks.tf": "string containing updated networks config",
  "clients.tf": "string containing updated client devices config"
}

Ensure the output is strictly valid JSON with no markdown syntax wrapping, and containing exactly those 4 keys, where the files compile beautifully together.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            "providers.tf": { type: Type.STRING },
            "variables.tf": { type: Type.STRING },
            "networks.tf": { type: Type.STRING },
            "clients.tf": { type: Type.STRING },
          },
          required: ["providers.tf", "variables.tf", "networks.tf", "clients.tf"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response string from Gemini model");
    }

    const optimizedFiles = JSON.parse(responseText.trim());
    res.json({ success: true, files: optimizedFiles });
  } catch (error: any) {
    console.error("Gemini optimization error:", error);
    res.status(500).json({
      error: `Gemini failed to optimize configuration: ${error.message || error}`,
    });
  }
});

// --- Dynamic Dev/Production Asset pipeline integration ---

async function buildApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production files from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

buildApp();
