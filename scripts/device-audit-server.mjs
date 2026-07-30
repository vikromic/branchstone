import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, lstatSync } from "node:fs";
import {
  cp,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
} from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { networkInterfaces, tmpdir } from "node:os";
import {
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { createInterface } from "node:readline";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const closurePrefix = "branchstone-device-";
const requiredStaticFiles = [
  ".nojekyll",
  "CNAME",
  "favicon.svg",
  "site.webmanifest",
  "robots.txt",
  "sitemap.xml",
];
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mp4", "video/mp4"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

function sha256() {
  return createHash("sha256");
}

async function hashFile(filename) {
  const hash = sha256();
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest("hex");
}

async function collectRegularFiles(directory, current = "", files = []) {
  const entries = await readdir(resolve(directory, current), { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
  for (const entry of entries) {
    const localPath = current ? join(current, entry.name) : entry.name;
    if (entry.isSymbolicLink()) {
      throw new Error(`Device audit closure cannot contain a symbolic link: ${localPath}`);
    }
    if (entry.isDirectory()) {
      await collectRegularFiles(directory, localPath, files);
    } else if (entry.isFile()) {
      files.push(localPath);
    } else {
      throw new Error(`Device audit closure contains an unsupported entry: ${localPath}`);
    }
  }
  return files;
}

function portablePath(filename) {
  return filename.split(sep).join("/");
}

export async function digestDirectory(directory) {
  const root = resolve(directory);
  const files = await collectRegularFiles(root);
  const aggregate = sha256();
  let bytes = 0;

  for (const filename of files) {
    const absolute = resolve(root, filename);
    const metadata = await stat(absolute);
    const digest = await hashFile(absolute);
    bytes += metadata.size;
    aggregate.update(portablePath(filename));
    aggregate.update("\0");
    aggregate.update(String(metadata.size));
    aggregate.update("\0");
    aggregate.update(digest);
    aggregate.update("\0");
  }

  return {
    digest: aggregate.digest("hex"),
    files: files.length,
    bytes,
  };
}

async function gitOutput(root, args) {
  const { stdout } = await execFileAsync("git", args, {
    cwd: root,
    encoding: null,
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

export async function sourceIdentity(repositoryRoot) {
  const root = resolve(repositoryRoot);
  const [headOutput, statusOutput, listedOutput] = await Promise.all([
    gitOutput(root, ["rev-parse", "HEAD"]),
    gitOutput(root, ["status", "--porcelain=v1", "-z"]),
    gitOutput(root, ["ls-files", "-co", "--exclude-standard", "-z"]),
  ]);
  const head = headOutput.toString("utf8").trim();
  const statusEntries = statusOutput.toString("utf8").split("\0").filter(Boolean);
  const filenames = [...new Set(
    listedOutput.toString("utf8").split("\0").filter(Boolean),
  )].sort((left, right) => left.localeCompare(right, "en"));
  const aggregate = sha256();
  aggregate.update(`HEAD\0${head}\0STATUS\0`);
  aggregate.update(statusOutput);
  aggregate.update("\0FILES\0");

  for (const filename of filenames) {
    const absolute = resolve(root, filename);
    const containment = relative(root, absolute);
    if (!containment || containment.startsWith("..") || isAbsolute(containment)) {
      throw new Error(`Git returned a path outside the repository: ${filename}`);
    }
    let metadata;
    try {
      metadata = await lstat(absolute);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      aggregate.update(portablePath(filename));
      aggregate.update("\0MISSING\0");
      continue;
    }
    if (metadata.isSymbolicLink() || !metadata.isFile()) {
      throw new Error(`Source identity only supports regular files: ${filename}`);
    }
    aggregate.update(portablePath(filename));
    aggregate.update("\0");
    aggregate.update(String(metadata.size));
    aggregate.update("\0");
    aggregate.update(await hashFile(absolute));
    aggregate.update("\0");
  }

  return {
    digest: aggregate.digest("hex"),
    files: filenames.length,
    head,
    statusEntries,
  };
}

async function copyDirectoryContents(source, destination) {
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    await cp(resolve(source, entry.name), resolve(destination, entry.name), {
      recursive: true,
      force: false,
      errorOnExist: true,
      dereference: false,
    });
  }
}

export async function assembleDeviceClosure({
  repositoryRoot = process.cwd(),
  temporaryParent = tmpdir(),
} = {}) {
  const root = resolve(repositoryRoot);
  const stage = resolve(root, ".stage");
  const docs = resolve(root, "docs");
  const resolvedTemporaryParent = resolve(temporaryParent);
  const destination = await mkdtemp(resolve(resolvedTemporaryParent, closurePrefix));

  try {
    await copyDirectoryContents(stage, destination);
    await cp(resolve(docs, "img"), resolve(destination, "img"), {
      recursive: true,
      force: false,
      errorOnExist: true,
      dereference: false,
    });
    await cp(resolve(docs, "json_data"), resolve(destination, "json_data"), {
      recursive: true,
      force: false,
      errorOnExist: true,
      dereference: false,
    });
    for (const filename of requiredStaticFiles) {
      await cp(resolve(docs, filename), resolve(destination, filename), {
        force: false,
        errorOnExist: true,
        dereference: false,
      });
    }
    const identity = await digestDirectory(destination);
    return {
      directory: destination,
      identity,
      temporaryParent: resolvedTemporaryParent,
    };
  } catch (error) {
    await rm(destination, { recursive: true, force: true });
    throw error;
  }
}

export function mimeTypeForPath(filename) {
  return mimeTypes.get(extname(filename).toLowerCase()) ?? "application/octet-stream";
}

function requestPathToFile(root, requestPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0") || decoded.includes("\\")) return null;
  const documentPath = decoded === "/"
    ? "/index.html"
    : decoded.endsWith("/")
      ? `${decoded}index.html`
      : decoded;
  const absolute = resolve(root, `.${documentPath}`);
  const containment = relative(root, absolute);
  if (!containment || containment.startsWith("..") || isAbsolute(containment)) return null;
  return { absolute, requestPath: `/${portablePath(containment)}` };
}

function rawRequestPathIsSafe(requestTarget) {
  if (typeof requestTarget !== "string" || !requestTarget.startsWith("/")) return false;
  const rawPath = requestTarget.split(/[?#]/, 1)[0];
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return false;
  }
  if (decoded.startsWith("//") || decoded.includes("\0") || decoded.includes("\\")) return false;
  return !decoded.split("/").some((segment) => segment === "." || segment === "..");
}

async function sendFile(request, response, filename) {
  const metadata = await lstat(filename);
  if (!metadata.isFile()) throw Object.assign(new Error("Not a regular file"), { code: "ENOENT" });
  response.statusCode = 200;
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Length", metadata.size);
  response.setHeader("Content-Type", mimeTypeForPath(filename));
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  await pipeline(createReadStream(filename), response);
}

function sendText(response, statusCode, message) {
  if (response.destroyed || response.writableEnded) return;
  const body = `${message}\n`;
  response.statusCode = statusCode;
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Length", Buffer.byteLength(body));
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(body);
}

function normalizeFaultPath(pathname) {
  if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.includes("?")) {
    throw new Error("Fault path must be one exact root-relative URL path");
  }
  const parsed = requestPathToFile("/", pathname);
  if (!parsed || parsed.requestPath !== pathname) {
    throw new Error("Fault path must be normalized and cannot traverse directories");
  }
  return pathname;
}

export async function findEntryModulePath(closureRoot, page) {
  if (!["gallery", "contact"].includes(page)) {
    throw new Error("Entry stall page must be gallery or contact");
  }
  const html = await readFile(resolve(closureRoot, `${page}.html`), "utf8");
  for (const match of html.matchAll(/<script\b([^>]*)>/gi)) {
    const attributes = match[1];
    const type = attributes.match(/\btype=["']([^"']+)["']/i)?.[1];
    const src = attributes.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (type === "module" && src?.startsWith("/")) return normalizeFaultPath(src);
  }
  throw new Error(`${page}.html has no root-relative module entry`);
}

export async function createDeviceAuditServer({
  closureRoot,
  logger = console,
} = {}) {
  const root = resolve(closureRoot);
  const exactPaths = new Set(
    (await collectRegularFiles(root)).map((filename) => `/${portablePath(filename)}`),
  );
  let fault = null;
  const held = new Set();

  async function releaseHeld({ asError = false } = {}) {
    const requests = [...held];
    held.clear();
    fault = null;
    const results = await Promise.allSettled(requests.map(async (entry) => {
      if (entry.response.destroyed || entry.response.writableEnded) return;
      if (asError) {
        sendText(entry.response, 503, "Branchstone device-audit injected failure");
        return;
      }
      try {
        await sendFile(entry.request, entry.response, entry.filename);
      } catch (error) {
        sendText(entry.response, 500, "Device-audit release failed");
        throw error;
      }
    }));
    const failures = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);
    if (failures.length) {
      throw new AggregateError(failures, "One or more held requests could not be released");
    }
    return requests.length;
  }

  function setFault(mode, pathname) {
    if (!["error", "stall"].includes(mode)) throw new Error("Fault mode must be error or stall");
    if (held.size) throw new Error("Release or clear held requests before changing the fault");
    const normalizedPath = normalizeFaultPath(pathname);
    const resolved = requestPathToFile(root, normalizedPath);
    if (!resolved || !exactPaths.has(resolved.requestPath)) {
      throw new Error(`Fault path does not exist in the served closure: ${normalizedPath}`);
    }
    let metadata;
    try {
      metadata = lstatSync(resolved.absolute);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      throw new Error(`Fault path does not exist in the served closure: ${normalizedPath}`);
    }
    if (!metadata.isFile()) {
      throw new Error(`Fault path is not a served file: ${normalizedPath}`);
    }
    fault = { hits: 0, mode, pathname: normalizedPath };
    return { ...fault };
  }

  function clearFault() {
    fault = null;
  }

  const server = createHttpServer(async (request, response) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        sendText(response, 405, "Method not allowed");
        return;
      }
      if (!rawRequestPathIsSafe(request.url)) {
        sendText(response, 400, "Invalid path");
        return;
      }
      const url = new URL(request.url ?? "/", "http://branchstone.device");
      const resolved = requestPathToFile(root, url.pathname);
      if (!resolved) {
        sendText(response, 400, "Invalid path");
        return;
      }
      if (!exactPaths.has(resolved.requestPath)) {
        sendText(response, 404, "Not found");
        return;
      }

      let metadata;
      try {
        metadata = await lstat(resolved.absolute);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        sendText(response, 404, "Not found");
        return;
      }
      if (!metadata.isFile()) {
        sendText(response, 404, "Not found");
        return;
      }

      if (fault?.pathname === resolved.requestPath) {
        fault.hits += 1;
        logger.info?.(
          `[device-audit] fault hit ${fault.mode} ${resolved.requestPath} #${fault.hits}`,
        );
        if (fault.mode === "error") {
          sendText(response, 503, "Branchstone device-audit injected failure");
          return;
        }
        const entry = {
          filename: resolved.absolute,
          request,
          response,
        };
        held.add(entry);
        const remove = () => held.delete(entry);
        request.once("aborted", remove);
        response.once("close", remove);
        logger.info?.(`[device-audit] holding ${resolved.requestPath}`);
        return;
      }

      await sendFile(request, response, resolved.absolute);
    } catch (error) {
      logger.error?.(`[device-audit] request failed: ${error.message}`);
      sendText(response, 500, "Internal server error");
    }
  });

  async function close() {
    await releaseHeld({ asError: true });
    if (!server.listening) return;
    await new Promise((resolveClose, reject) => {
      server.close((error) => error ? reject(error) : resolveClose());
      server.closeAllConnections?.();
    });
  }

  return {
    clearFault,
    close,
    getStatus: () => ({
      fault: fault ? { ...fault } : null,
      heldRequests: held.size,
    }),
    releaseHeld,
    server,
    setFault,
  };
}

function parseCliArguments(arguments_) {
  const options = { host: "0.0.0.0", port: 8082 };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--host") {
      options.host = arguments_[index += 1];
    } else if (argument === "--port") {
      options.port = Number(arguments_[index += 1]);
    } else {
      throw new Error(`Unknown device-audit option: ${argument}`);
    }
  }
  if (!options.host) throw new Error("--host requires a value");
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) {
    throw new Error("--port must be an integer from 0 to 65535");
  }
  return options;
}

function deviceOrigins(host, port) {
  if (host !== "0.0.0.0" && host !== "::") return [`http://${host}:${port}/`];
  const addresses = [];
  for (const interfaces of Object.values(networkInterfaces())) {
    for (const entry of interfaces ?? []) {
      if (entry.family === "IPv4" && !entry.internal) addresses.push(`http://${entry.address}:${port}/`);
    }
  }
  return addresses;
}

function printHelp(logger) {
  logger.log("Fault commands:");
  logger.log("  error <exact-path>          return non-cacheable HTTP 503");
  logger.log("  stall <exact-path>          hold matching requests");
  logger.log("  stall-entry gallery|contact hold the built page entry module");
  logger.log("  release                     serve every held request and clear fault");
  logger.log("  clear                       fail held requests with 503 and clear fault");
  logger.log("  status                      show active fault and held count");
  logger.log("  help                        show these commands");
  logger.log("  quit                        hash, stop, and clean the temporary closure");
}

export async function removeTemporaryClosure(
  directory,
  { temporaryParent = tmpdir() } = {},
) {
  const temporaryRoot = resolve(temporaryParent);
  const absolute = resolve(directory);
  const closureRelative = relative(temporaryRoot, absolute);
  if (
    !closureRelative.startsWith(closurePrefix)
    || closureRelative.includes(sep)
    || isAbsolute(closureRelative)
  ) {
    throw new Error(`Refusing to clean unexpected closure path: ${absolute}`);
  }
  await rm(absolute, { recursive: true, force: true });
}

export async function finalizeDeviceAuditSession({
  audit,
  closure,
  logger = console,
  reason = "requested",
  repositoryRoot = process.cwd(),
  sourceBefore,
}) {
  let sourceAfter;
  let closureAfter;
  let verificationError;
  let cleanupError;
  try {
    const verificationErrors = [];
    try {
      await audit.close();
    } catch (error) {
      verificationErrors.push(error);
      await audit.close().catch((retryError) => verificationErrors.push(retryError));
    }
    const [sourceResult, closureResult] = await Promise.allSettled([
      sourceIdentity(repositoryRoot),
      digestDirectory(closure.directory),
    ]);
    if (sourceResult.status === "fulfilled") {
      sourceAfter = sourceResult.value;
    } else {
      verificationErrors.push(sourceResult.reason);
    }
    if (closureResult.status === "fulfilled") {
      closureAfter = closureResult.value;
    } else {
      verificationErrors.push(closureResult.reason);
    }
    if (verificationErrors.length) {
      verificationError = verificationErrors.length === 1
        ? verificationErrors[0]
        : new AggregateError(
          verificationErrors,
          "Device audit post-run verification failed",
        );
      logger.error(`[device-audit] post-run verification failed: ${verificationError.message}`);
    }
  } finally {
    try {
      await removeTemporaryClosure(closure.directory, {
        temporaryParent: closure.temporaryParent,
      });
      logger.log(`[device-audit] cleanup removed ${closure.directory}`);
    } catch (error) {
      cleanupError = error;
      logger.error(`[device-audit] cleanup failed: ${error.message}`);
    }
  }

  const sourceMatches = Boolean(sourceAfter) && sourceAfter.digest === sourceBefore.digest;
  const closureMatches = Boolean(closureAfter) && closureAfter.digest === closure.identity.digest;
  logger.log(`[device-audit] shutdown: ${reason}`);
  logger.log(
    `[device-audit] source post ${sourceAfter?.digest ?? "unavailable"} (${sourceMatches ? "MATCH" : "DRIFT"})`,
  );
  logger.log(
    `[device-audit] closure post ${closureAfter?.digest ?? "unavailable"} (${closureMatches ? "MATCH" : "DRIFT"})`,
  );
  if (sourceAfter && !sourceMatches) {
    logger.log(`[device-audit] source status post ${JSON.stringify(sourceAfter.statusEntries)}`);
  }
  const report = {
    closureAfter,
    closureMatches,
    sourceAfter,
    sourceMatches,
    verificationError,
  };
  report.integrityValid = !cleanupError
    && !report.verificationError
    && report.sourceMatches
    && report.closureMatches;
  report.valid = reason === "quit" && report.integrityValid;
  logger.log(
    `[device-audit] session ${report.valid ? "VALID" : "INVALID"} (${reason})`,
  );
  if (cleanupError) throw cleanupError;
  return report;
}

export async function runDeviceAuditCli({
  arguments_ = process.argv.slice(2),
  repositoryRoot = process.cwd(),
  input = process.stdin,
  logger = console,
  markFailure = () => {
    process.exitCode = 1;
  },
  signalTarget = process,
} = {}) {
  const options = parseCliArguments(arguments_);
  let sourceBefore;
  let closure;
  let audit;
  let shuttingDown = false;
  let shutdownPromise;
  let readline;
  let signalHandlersActive = false;
  let startupComplete = false;
  let pendingSignalReason;
  const handleSigint = () => handleSignal("SIGINT");
  const handleSigterm = () => handleSignal("SIGTERM");

  function removeSignalHandlers() {
    if (!signalHandlersActive) return;
    signalHandlersActive = false;
    const removeListener = signalTarget.off?.bind(signalTarget)
      ?? signalTarget.removeListener?.bind(signalTarget);
    removeListener?.("SIGINT", handleSigint);
    removeListener?.("SIGTERM", handleSigterm);
  }

  function handleSignal(reason) {
    pendingSignalReason ??= reason;
    if (startupComplete) {
      void shutdown(pendingSignalReason).catch((error) => {
        logger.error(`[device-audit] shutdown failed: ${error.message}`);
      });
    }
  }

  function sessionResult({ aborted = false } = {}) {
    return {
      aborted,
      audit,
      closure,
      shutdown,
      sourceBefore,
    };
  }

  function shutdown(reason = "requested") {
    if (shutdownPromise) return shutdownPromise;
    shuttingDown = true;
    shutdownPromise = (async () => {
      readline?.close();
      if (!closure) {
        logger.log(`[device-audit] shutdown: ${reason} before closure assembly`);
        const report = {
          aborted: true,
          closureAfter: null,
          closureMatches: null,
          integrityValid: null,
          sourceAfter: null,
          sourceMatches: null,
          valid: false,
          verificationError: null,
        };
        logger.log(`[device-audit] session INVALID (${reason})`);
        markFailure();
        return report;
      }
      const report = await finalizeDeviceAuditSession({
        audit: audit ?? { close: async () => {} },
        closure,
        logger,
        reason,
        repositoryRoot,
        sourceBefore,
      });
      if (!report.valid) markFailure();
      return report;
    })()
      .catch((error) => {
        markFailure();
        throw error;
      })
      .finally(removeSignalHandlers);
    return shutdownPromise;
  }

  async function stopIfRequested() {
    if (!pendingSignalReason && !shutdownPromise) return null;
    await (shutdownPromise ?? shutdown(pendingSignalReason));
    return sessionResult({ aborted: true });
  }

  signalTarget.on("SIGINT", handleSigint);
  signalHandlersActive = true;
  try {
    signalTarget.on("SIGTERM", handleSigterm);
  } catch (error) {
    removeSignalHandlers();
    throw error;
  }

  try {
    sourceBefore = await sourceIdentity(repositoryRoot);
    let stoppedSession = await stopIfRequested();
    if (stoppedSession) return stoppedSession;

    closure = await assembleDeviceClosure({ repositoryRoot });
    stoppedSession = await stopIfRequested();
    if (stoppedSession) return stoppedSession;

    audit = await createDeviceAuditServer({ closureRoot: closure.directory, logger });
    stoppedSession = await stopIfRequested();
    if (stoppedSession) return stoppedSession;

    await new Promise((resolveListen, reject) => {
      audit.server.once("error", reject);
      audit.server.listen(options.port, options.host, resolveListen);
    });
    stoppedSession = await stopIfRequested();
    if (stoppedSession) return stoppedSession;

    const address = audit.server.address();
    const port = typeof address === "object" && address ? address.port : options.port;
    logger.log(`[device-audit] HEAD ${sourceBefore.head}`);
    logger.log(`[device-audit] source pre ${sourceBefore.digest} (${sourceBefore.files} files, ${sourceBefore.statusEntries.length} status entries)`);
    logger.log(`[device-audit] source status pre ${JSON.stringify(sourceBefore.statusEntries)}`);
    logger.log(`[device-audit] closure pre ${closure.identity.digest} (${closure.identity.files} files, ${closure.identity.bytes} bytes)`);
    logger.log(`[device-audit] temporary closure ${closure.directory}`);
    stoppedSession = await stopIfRequested();
    if (stoppedSession) return stoppedSession;

    for (const origin of deviceOrigins(options.host, port)) logger.log(`[device-audit] open ${origin}`);
    printHelp(logger);
    stoppedSession = await stopIfRequested();
    if (stoppedSession) return stoppedSession;

    readline = createInterface({ input, terminal: Boolean(input.isTTY) });
    let commandQueue = Promise.resolve();
    async function handleCommand(line) {
      const [command, ...values] = line.trim().split(/\s+/);
      try {
        if (!command) return;
        if (command === "error" || command === "stall") {
          logger.log(`[device-audit] fault ${JSON.stringify(audit.setFault(command, values[0]))}`);
        } else if (command === "stall-entry") {
          const pathname = await findEntryModulePath(closure.directory, values[0]);
          logger.log(`[device-audit] fault ${JSON.stringify(audit.setFault("stall", pathname))}`);
        } else if (command === "release") {
          logger.log(`[device-audit] released ${await audit.releaseHeld()} held request(s)`);
        } else if (command === "clear") {
          logger.log(`[device-audit] cleared ${await audit.releaseHeld({ asError: true })} held request(s)`);
        } else if (command === "status") {
          logger.log(`[device-audit] status ${JSON.stringify(audit.getStatus())}`);
        } else if (command === "help") {
          printHelp(logger);
        } else if (command === "quit") {
          await shutdown("quit");
        } else {
          logger.error(`[device-audit] unknown command: ${command}`);
        }
      } catch (error) {
        logger.error(`[device-audit] command failed: ${error.message}`);
      }
    }
    readline.on("line", (line) => {
      commandQueue = commandQueue.then(() => handleCommand(line));
    });
    readline.once("close", () => {
      if (!shuttingDown) {
        void commandQueue
          .then(() => shutdown("stdin closed"))
          .catch((error) => {
            logger.error(`[device-audit] shutdown failed: ${error.message}`);
          });
      }
    });
    startupComplete = true;
    stoppedSession = await stopIfRequested();
    if (stoppedSession) return stoppedSession;

    return sessionResult();
  } catch (error) {
    if (shutdownPromise) throw error;
    await audit?.close().catch(() => {});
    if (closure) {
      try {
        await removeTemporaryClosure(closure.directory, {
          temporaryParent: closure.temporaryParent,
        });
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          "Device audit startup and bounded cleanup both failed",
        );
      }
    }
    throw error;
  } finally {
    if (!startupComplete || shutdownPromise) removeSignalHandlers();
  }
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  runDeviceAuditCli().catch((error) => {
    console.error(`[device-audit] ${error.message}`);
    process.exitCode = 1;
  });
}
