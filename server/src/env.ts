import path from "node:path";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().default("admin@pmagic.local"),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8).default("ChangeMe123!"),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:5173"),
  UPLOAD_DIR: z.string().default("./server/uploads"),
  PORT: z.coerce.number().int().positive().default(5173)
});

export const env = schema.parse(process.env);

const cwd = process.cwd();
const projectRoot = path.basename(cwd) === "server" ? path.resolve(cwd, "..") : cwd;

export const paths = {
  projectRoot,
  uploadDir: path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.resolve(projectRoot, env.UPLOAD_DIR)
};
