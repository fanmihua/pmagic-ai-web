import { getApp } from "../server/dist/src/app.js";

let appPromise;

export default async function handler(request, response) {
  appPromise ||= getApp();
  const app = await appPromise;
  app.server.emit("request", request, response);
}

export const config = {
  api: {
    bodyParser: false
  }
};
