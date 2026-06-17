import { readFile, stat } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";
import { badRequest, forbidden, notFound } from "../errors/apiError.mjs";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
};

export function createStaticServer(publicDir) {
  return async function serveStatic(res, pathname) {
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(pathname);
    } catch {
      throw badRequest("invalid_path", "Der angeforderte Pfad ist ungueltig.");
    }

    const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
    const filePath = resolve(publicDir, `.${requestedPath}`);

    const relativePath = relative(publicDir, filePath);
    if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`)) {
      throw forbidden("forbidden", "Dieser Pfad darf nicht ausgeliefert werden.");
    }

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        throw notFound("not_found", "Die Datei wurde nicht gefunden.");
      }

      const body = await readFile(filePath);
      res.writeHead(200, {
        "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(body);
    } catch (error) {
      if (error?.code === "ENOENT") {
        throw notFound("not_found", "Die Datei wurde nicht gefunden.");
      }
      throw error;
    }
  };
}
