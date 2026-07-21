import { cp, mkdir, rm, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function copyIfExists(source, destination) {
  if (!(await exists(source))) return;
  await cp(source, destination, {
    recursive: true,
    filter: (current) => path.basename(current) !== ".DS_Store"
  });
}

async function sha256(target) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(target)) hash.update(chunk);
  return hash.digest("hex");
}

async function verifyExactAsset(relativePath, expectedSize, expectedHash) {
  for (const baseDir of [root, publicDir]) {
    const target = path.join(baseDir, relativePath);
    const metadata = await stat(target);
    const actualHash = await sha256(target);

    if (metadata.size !== expectedSize || actualHash !== expectedHash) {
      throw new Error(
        `Protected asset changed: ${target} (${metadata.size} bytes, ${actualHash}). ` +
          `Expected ${expectedSize} bytes and ${expectedHash}.`
      );
    }
  }
}

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });

for (const file of ["index.html", "styles.css", "script.js", ".nojekyll"]) {
  await copyIfExists(path.join(root, file), path.join(publicDir, file));
}

for (const dir of ["assets", "uploads"]) {
  await copyIfExists(path.join(root, dir), path.join(publicDir, dir));
}

await verifyExactAsset(
  "assets/videos/hero-brain-core-alpha.webm",
  1255608,
  "1112b8587e43bddfb36e3862d4e45c07dac2e80c93bf5efb958a18f67add6e09"
);

await mkdir(path.join(publicDir, "admin"), { recursive: true });
await cp(path.join(root, "admin", "dist"), path.join(publicDir, "admin"), { recursive: true });
