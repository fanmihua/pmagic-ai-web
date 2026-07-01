import { cp, mkdir, rm, stat } from "node:fs/promises";
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

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });

for (const file of ["index.html", "styles.css", "script.js", ".nojekyll"]) {
  await copyIfExists(path.join(root, file), path.join(publicDir, file));
}

for (const dir of ["assets", "uploads"]) {
  await copyIfExists(path.join(root, dir), path.join(publicDir, dir));
}

await mkdir(path.join(publicDir, "admin"), { recursive: true });
await cp(path.join(root, "admin", "dist"), path.join(publicDir, "admin"), { recursive: true });
