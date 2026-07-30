import { execFile } from "node:child_process";
import { EventEmitter } from "node:events";
import { request as httpRequest } from "node:http";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PassThrough } from "node:stream";
import { promisify } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assembleDeviceClosure,
  createDeviceAuditServer,
  digestDirectory,
  finalizeDeviceAuditSession,
  findEntryModulePath,
  mimeTypeForPath,
  runDeviceAuditCli,
  sourceIdentity,
} from "../scripts/device-audit-server.mjs";

const execFileAsync = promisify(execFile);
const temporaryPaths = new Set();
const runningAudits = new Set();

async function temporaryDirectory(prefix) {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  temporaryPaths.add(directory);
  return directory;
}

async function writeFixtureFile(root, filename, source) {
  const absolute = resolve(root, filename);
  await mkdir(resolve(absolute, ".."), { recursive: true });
  await writeFile(absolute, source);
}

async function createRepositoryFixture() {
  const root = await temporaryDirectory("branchstone-device-repo-");
  const temporaryParent = await temporaryDirectory("branchstone-device-parent-");
  const files = new Map([
    [".stage/index.html", '<script type="module" src="/assets/home.js"></script>'],
    [".stage/gallery.html", '<script src="/assets/gallery.js" crossorigin type="module"></script>'],
    [".stage/contact.html", '<script type="module" crossorigin src="/assets/contact.js"></script>'],
    [".stage/uk/gallery.html", '<html lang="uk">Роботи</html>'],
    [".stage/assets/home.js", "export const page = 'home';"],
    [".stage/assets/gallery.js", "export const page = 'gallery';"],
    [".stage/assets/contact.js", "export const page = 'contact';"],
    [".stage/assets/site.css", "body{color:#15110e}"],
    ["docs/img/work.jpg", Buffer.from([0xff, 0xd8, 0xff, 0xd9])],
    ["docs/img/packing/packing.MP4", Buffer.from([0x00, 0x00, 0x00, 0x18])],
    ["docs/json_data/artworks.json", '{"artworks":[]}'],
    ["docs/.nojekyll", ""],
    ["docs/CNAME", "branchstone.art\n"],
    ["docs/favicon.svg", "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>"],
    ["docs/site.webmanifest", '{"name":"Branchstone"}'],
    ["docs/robots.txt", "User-agent: *\nAllow: /\n"],
    ["docs/sitemap.xml", "<urlset></urlset>"],
  ]);
  for (const [filename, source] of files) await writeFixtureFile(root, filename, source);
  return { root, temporaryParent };
}

async function initializeGitFixture(root) {
  await execFileAsync("git", ["init", "-q"], { cwd: root });
  await execFileAsync("git", ["add", "-A"], { cwd: root });
  await execFileAsync("git", [
    "-c",
    "user.name=Branchstone Test",
    "-c",
    "user.email=branchstone@example.test",
    "commit",
    "-qm",
    "fixture",
  ], { cwd: root });
}

async function startAudit(closureRoot) {
  const logger = {
    error: vi.fn(),
    info: vi.fn(),
  };
  const audit = await createDeviceAuditServer({ closureRoot, logger });
  runningAudits.add(audit);
  await new Promise((resolveListen, reject) => {
    audit.server.once("error", reject);
    audit.server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = audit.server.address();
  return {
    audit,
    logger,
    origin: `http://127.0.0.1:${address.port}`,
    port: address.port,
  };
}

function rawRequest(port, path) {
  return new Promise((resolveRequest, reject) => {
    const request = httpRequest({
      host: "127.0.0.1",
      method: "GET",
      path,
      port,
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolveRequest({
        body: Buffer.concat(chunks).toString("utf8"),
        status: response.statusCode,
      }));
    });
    request.on("error", reject);
    request.end();
  });
}

afterEach(async () => {
  await Promise.all([...runningAudits].map((audit) => audit.close().catch(() => {})));
  runningAudits.clear();
  await Promise.all([...temporaryPaths].map((path) => rm(path, { recursive: true, force: true })));
  temporaryPaths.clear();
});

describe("device audit closure", () => {
  it("assembles and deterministically hashes the compiled app plus protected deployment files", async () => {
    const fixture = await createRepositoryFixture();
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);

    expect(await readFile(resolve(closure.directory, "index.html"), "utf8")).toContain("/assets/home.js");
    expect(await readFile(resolve(closure.directory, "img/work.jpg"))).toEqual(
      Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
    );
    expect(await readFile(resolve(closure.directory, "json_data/artworks.json"), "utf8")).toBe('{"artworks":[]}');
    expect(await readFile(resolve(closure.directory, "site.webmanifest"), "utf8")).toContain("Branchstone");

    const repeated = await digestDirectory(closure.directory);
    expect(repeated).toEqual(closure.identity);
    expect(repeated.files).toBe(17);
  });

  it("finds built Gallery and Contact entry modules regardless of attribute order", async () => {
    const fixture = await createRepositoryFixture();
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);

    await expect(findEntryModulePath(closure.directory, "gallery")).resolves.toBe("/assets/gallery.js");
    await expect(findEntryModulePath(closure.directory, "contact")).resolves.toBe("/assets/contact.js");
    await expect(findEntryModulePath(closure.directory, "home")).rejects.toThrow(
      "must be gallery or contact",
    );
  });

  it("rejects symbolic links instead of serving bytes outside the captured closure", async () => {
    const fixture = await createRepositoryFixture();
    await symlink(resolve(fixture.root, "docs/CNAME"), resolve(fixture.root, "docs/img/link.txt"));

    await expect(assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    })).rejects.toThrow("cannot contain a symbolic link");
  });
});

describe("device audit source identity", () => {
  it("includes tracked, untracked, dirty, and deleted source state deterministically", async () => {
    const root = await temporaryDirectory("branchstone-device-git-");
    await writeFixtureFile(root, "tracked.txt", "tracked\n");
    await initializeGitFixture(root);
    await writeFixtureFile(root, "untracked.txt", "untracked\n");

    const first = await sourceIdentity(root);
    const repeated = await sourceIdentity(root);
    expect(repeated).toEqual(first);
    expect(first.files).toBe(2);
    expect(first.statusEntries).toHaveLength(1);

    await unlink(resolve(root, "tracked.txt"));
    const deleted = await sourceIdentity(root);
    expect(deleted.digest).not.toBe(first.digest);
    expect(deleted.statusEntries.some((entry) => entry.startsWith(" D tracked.txt"))).toBe(true);
  });
});

describe("device audit static server", () => {
  it("serves exact files with correct MIME and no-store without a SPA fallback", async () => {
    const fixture = await createRepositoryFixture();
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);
    const { origin } = await startAudit(closure.directory);

    const [home, artwork, video, manifest, missing] = await Promise.all([
      fetch(`${origin}/`),
      fetch(`${origin}/img/work.jpg`),
      fetch(`${origin}/img/packing/packing.MP4`, { method: "HEAD" }),
      fetch(`${origin}/site.webmanifest`),
      fetch(`${origin}/route-that-does-not-exist`),
    ]);

    expect(home.status).toBe(200);
    expect(home.headers.get("content-type")).toContain("text/html");
    expect(home.headers.get("cache-control")).toBe("no-store");
    expect(await home.text()).toContain("/assets/home.js");
    expect(artwork.status).toBe(200);
    expect(artwork.headers.get("content-type")).toBe("image/jpeg");
    expect(Buffer.from(await artwork.arrayBuffer())).toEqual(Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
    expect(video.status).toBe(200);
    expect(video.headers.get("content-type")).toBe("video/mp4");
    expect(manifest.headers.get("content-type")).toContain("application/manifest+json");
    expect(await manifest.json()).toEqual({ name: "Branchstone" });
    expect(missing.status).toBe(404);
    expect(missing.headers.get("content-type")).toContain("text/plain");
  });

  it("rejects raw and encoded traversal, URL authority reinterpretation, and unsupported methods", async () => {
    const fixture = await createRepositoryFixture();
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);
    await writeFixtureFile(resolve(closure.directory, ".."), "outside.txt", "not served");
    const { origin, port } = await startAudit(closure.directory);

    const traversalPaths = [
      "/../CNAME",
      "/%2e%2e/CNAME",
      "/%2e%2e%2foutside.txt",
      "/foo/../CNAME",
      "/..\\CNAME",
      "//evil/CNAME",
      "///CNAME",
    ];
    const traversals = await Promise.all(
      traversalPaths.map((pathname) => rawRequest(port, pathname)),
    );
    const post = await fetch(`${origin}/index.html`, { method: "POST" });

    for (const traversal of traversals) {
      expect(traversal.status).toBe(400);
      expect(traversal.body).not.toContain("not served");
      expect(traversal.body).not.toContain("branchstone.art");
    }
    expect(post.status).toBe(405);
  });

  it("uses case-sensitive closure paths even on a case-insensitive filesystem", async () => {
    const fixture = await createRepositoryFixture();
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);
    const { port } = await startAudit(closure.directory);

    const wrongCase = await rawRequest(port, "/IMG/WORK.JPG");
    expect(wrongCase.status).toBe(404);
    expect(wrongCase.body).not.toContain("\ufffd\ufffd");
  });
});

describe("device audit faults", () => {
  it("injects an exact-path non-cacheable error without affecting neighboring files", async () => {
    const fixture = await createRepositoryFixture();
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);
    const { audit, logger, origin } = await startAudit(closure.directory);

    expect(audit.setFault("error", "/img/work.jpg")).toEqual({
      hits: 0,
      mode: "error",
      pathname: "/img/work.jpg",
    });
    expect(audit.getStatus()).toEqual({
      fault: { hits: 0, mode: "error", pathname: "/img/work.jpg" },
      heldRequests: 0,
    });
    const [failedArtwork, unaffectedHome] = await Promise.all([
      fetch(`${origin}/img/work.jpg`),
      fetch(`${origin}/`),
    ]);
    expect(failedArtwork.status).toBe(503);
    expect(failedArtwork.headers.get("cache-control")).toBe("no-store");
    expect(unaffectedHome.status).toBe(200);
    expect(audit.getStatus()).toEqual({
      fault: { hits: 1, mode: "error", pathname: "/img/work.jpg" },
      heldRequests: 0,
    });
    expect(logger.info).toHaveBeenCalledWith(
      "[device-audit] fault hit error /img/work.jpg #1",
    );

    audit.clearFault();
    const recoveredArtwork = await fetch(`${origin}/img/work.jpg`);
    expect(recoveredArtwork.status).toBe(200);
    await recoveredArtwork.arrayBuffer();
  });

  it("holds an exact path until release, then serves the original bytes", async () => {
    const fixture = await createRepositoryFixture();
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);
    const { audit, origin } = await startAudit(closure.directory);

    audit.setFault("stall", "/img/work.jpg");
    let settled = false;
    const pending = fetch(`${origin}/img/work.jpg`)
      .then(async (response) => ({
        body: Buffer.from(await response.arrayBuffer()),
        status: response.status,
      }))
      .finally(() => {
        settled = true;
      });
    await new Promise((resolveWait) => setTimeout(resolveWait, 25));

    expect(settled).toBe(false);
    expect(audit.getStatus()).toEqual({
      fault: { hits: 1, mode: "stall", pathname: "/img/work.jpg" },
      heldRequests: 1,
    });
    await expect(audit.releaseHeld()).resolves.toBe(1);
    await expect(pending).resolves.toEqual({
      body: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
      status: 200,
    });
    expect(audit.getStatus()).toEqual({ fault: null, heldRequests: 0 });
  });

  it("can fail held requests before a clean retry and rejects unsafe fault paths", async () => {
    const fixture = await createRepositoryFixture();
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);
    const { audit, origin } = await startAudit(closure.directory);

    expect(() => audit.setFault("stall", "/../outside.txt")).toThrow("normalized");
    expect(() => audit.setFault("stall", "/img/work.jpg?cache=1")).toThrow("exact");
    expect(() => audit.setFault("stall", "/img/does-not-exist.jpg")).toThrow("does not exist");
    expect(() => audit.setFault("stall", "/IMG/WORK.JPG")).toThrow("does not exist");
    expect(audit.getStatus()).toEqual({ fault: null, heldRequests: 0 });

    audit.setFault("stall", "/img/work.jpg");
    const pending = fetch(`${origin}/img/work.jpg`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 25));
    await expect(audit.releaseHeld({ asError: true })).resolves.toBe(1);
    await expect(pending).resolves.toMatchObject({ status: 503 });

    const retry = await fetch(`${origin}/img/work.jpg`);
    expect(retry.status).toBe(200);
    await retry.arrayBuffer();
  });

  it("reports a failed late release instead of claiming the original bytes were served", async () => {
    const fixture = await createRepositoryFixture();
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);
    const { audit, origin } = await startAudit(closure.directory);

    audit.setFault("stall", "/img/work.jpg");
    const pending = fetch(`${origin}/img/work.jpg`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 25));
    await unlink(resolve(closure.directory, "img/work.jpg"));

    await expect(audit.releaseHeld()).rejects.toThrow("could not be released");
    await expect(pending).resolves.toMatchObject({ status: 500 });
    expect(audit.getStatus()).toEqual({ fault: null, heldRequests: 0 });
  });
});

describe("device audit MIME map", () => {
  it.each([
    ["art.webp", "image/webp"],
    ["packing.MP4", "video/mp4"],
    ["font.woff2", "font/woff2"],
    ["site.webmanifest", "application/manifest+json; charset=utf-8"],
    ["unknown.bin", "application/octet-stream"],
  ])("maps %s to %s", (filename, expected) => {
    expect(mimeTypeForPath(filename)).toBe(expected);
  });
});

describe("device audit lifecycle", () => {
  it("removes the temporary closure even when post-run hashing detects an invalid entry", async () => {
    const fixture = await createRepositoryFixture();
    await initializeGitFixture(fixture.root);
    const sourceBefore = await sourceIdentity(fixture.root);
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);
    const audit = await createDeviceAuditServer({ closureRoot: closure.directory });
    await symlink(
      resolve(fixture.root, "docs/CNAME"),
      resolve(closure.directory, "post-run-link"),
    );
    const logger = { error: vi.fn(), log: vi.fn() };

    const report = await finalizeDeviceAuditSession({
      audit,
      closure,
      logger,
      repositoryRoot: fixture.root,
      sourceBefore,
    });

    expect(report.sourceMatches).toBe(true);
    expect(report.closureMatches).toBe(false);
    expect(report.integrityValid).toBe(false);
    expect(report.valid).toBe(false);
    expect(report.verificationError).toBeInstanceOf(Error);
    expect(report.verificationError.message).toContain("symbolic link");
    await expect(lstat(closure.directory)).rejects.toMatchObject({ code: "ENOENT" });
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining("[device-audit] cleanup removed"),
    );
  });

  it("keeps repeated signal shutdown idempotent until hashing and cleanup finish", async () => {
    const fixture = await createRepositoryFixture();
    await initializeGitFixture(fixture.root);
    const input = new PassThrough();
    const signalTarget = new EventEmitter();
    const logger = { error: vi.fn(), info: vi.fn(), log: vi.fn() };
    const markFailure = vi.fn();
    const session = await runDeviceAuditCli({
      arguments_: ["--host", "127.0.0.1", "--port", "0"],
      input,
      logger,
      markFailure,
      repositoryRoot: fixture.root,
      signalTarget,
    });
    temporaryPaths.add(session.closure.directory);
    runningAudits.add(session.audit);

    expect(signalTarget.listenerCount("SIGINT")).toBe(1);
    signalTarget.emit("SIGINT");
    expect(signalTarget.listenerCount("SIGINT")).toBe(1);
    signalTarget.emit("SIGINT");
    const report = await session.shutdown();

    expect(report.sourceMatches).toBe(true);
    expect(report.closureMatches).toBe(true);
    expect(report.integrityValid).toBe(true);
    expect(report.valid).toBe(false);
    expect(markFailure).toHaveBeenCalledTimes(1);
    expect(signalTarget.listenerCount("SIGINT")).toBe(0);
    expect(signalTarget.listenerCount("SIGTERM")).toBe(0);
    await expect(lstat(session.closure.directory)).rejects.toMatchObject({ code: "ENOENT" });
    expect(
      logger.log.mock.calls.filter(([message]) => message === "[device-audit] shutdown: SIGINT"),
    ).toHaveLength(1);
  });

  it("handles SIGINT from the startup output window before returning a session", async () => {
    const fixture = await createRepositoryFixture();
    await initializeGitFixture(fixture.root);
    const input = new PassThrough();
    const signalTarget = new EventEmitter();
    const markFailure = vi.fn();
    let signaled = false;
    const logger = {
      error: vi.fn(),
      info: vi.fn(),
      log: vi.fn((message) => {
        if (!signaled && message.startsWith("[device-audit] temporary closure ")) {
          signaled = true;
          signalTarget.emit("SIGINT");
        }
      }),
    };

    const session = await runDeviceAuditCli({
      arguments_: ["--host", "127.0.0.1", "--port", "0"],
      input,
      logger,
      markFailure,
      repositoryRoot: fixture.root,
      signalTarget,
    });
    temporaryPaths.add(session.closure.directory);
    runningAudits.add(session.audit);

    expect(signaled).toBe(true);
    expect(session.aborted).toBe(true);
    expect(markFailure).toHaveBeenCalledTimes(1);
    expect(signalTarget.listenerCount("SIGINT")).toBe(0);
    expect(signalTarget.listenerCount("SIGTERM")).toBe(0);
    await expect(lstat(session.closure.directory)).rejects.toMatchObject({ code: "ENOENT" });
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringMatching(/source post .+ \(MATCH\)$/),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringMatching(/closure post .+ \(MATCH\)$/),
    );
  });

  it("invalidates a session when shutdown verification errors even if both digests match", async () => {
    const fixture = await createRepositoryFixture();
    await initializeGitFixture(fixture.root);
    const sourceBefore = await sourceIdentity(fixture.root);
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);
    let closeAttempts = 0;
    const audit = {
      close: vi.fn(async () => {
        closeAttempts += 1;
        if (closeAttempts === 1) throw new Error("transient close failure");
      }),
    };
    const logger = { error: vi.fn(), log: vi.fn() };

    const report = await finalizeDeviceAuditSession({
      audit,
      closure,
      logger,
      repositoryRoot: fixture.root,
      sourceBefore,
    });

    expect(audit.close).toHaveBeenCalledTimes(2);
    expect(report.sourceMatches).toBe(true);
    expect(report.closureMatches).toBe(true);
    expect(report.verificationError.message).toBe("transient close failure");
    expect(report.integrityValid).toBe(false);
    expect(report.valid).toBe(false);
    await expect(lstat(closure.directory)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("logs an explicit invalid session before propagating a bounded cleanup failure", async () => {
    const fixture = await createRepositoryFixture();
    await initializeGitFixture(fixture.root);
    const sourceBefore = await sourceIdentity(fixture.root);
    const closure = await assembleDeviceClosure({
      repositoryRoot: fixture.root,
      temporaryParent: fixture.temporaryParent,
    });
    temporaryPaths.add(closure.directory);
    const audit = await createDeviceAuditServer({ closureRoot: closure.directory });
    const logger = { error: vi.fn(), log: vi.fn() };
    closure.temporaryParent = resolve(fixture.temporaryParent, "unexpected-parent");

    await expect(finalizeDeviceAuditSession({
      audit,
      closure,
      logger,
      reason: "quit",
      repositoryRoot: fixture.root,
      sourceBefore,
    })).rejects.toThrow("Refusing to clean unexpected closure path");

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("[device-audit] cleanup failed:"),
    );
    expect(logger.log).toHaveBeenCalledWith("[device-audit] session INVALID (quit)");
    await expect(lstat(closure.directory)).resolves.toBeDefined();
  });

  it("accepts an intact CLI session only when it ends with explicit quit", async () => {
    const fixture = await createRepositoryFixture();
    await initializeGitFixture(fixture.root);
    const input = new PassThrough();
    const signalTarget = new EventEmitter();
    const logger = { error: vi.fn(), info: vi.fn(), log: vi.fn() };
    const markFailure = vi.fn();
    const session = await runDeviceAuditCli({
      arguments_: ["--host", "127.0.0.1", "--port", "0"],
      input,
      logger,
      markFailure,
      repositoryRoot: fixture.root,
      signalTarget,
    });
    temporaryPaths.add(session.closure.directory);
    runningAudits.add(session.audit);

    const report = await session.shutdown("quit");

    expect(report.integrityValid).toBe(true);
    expect(report.valid).toBe(true);
    expect(markFailure).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("[device-audit] session VALID (quit)");
    await expect(lstat(session.closure.directory)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("cleans but invalidates a session when standard input closes", async () => {
    const fixture = await createRepositoryFixture();
    await initializeGitFixture(fixture.root);
    const input = new PassThrough();
    const signalTarget = new EventEmitter();
    const markFailure = vi.fn();
    let resolveShutdown;
    const shutdownLogged = new Promise((resolveLog) => {
      resolveShutdown = resolveLog;
    });
    const logger = {
      error: vi.fn(),
      info: vi.fn(),
      log: vi.fn((message) => {
        if (message === "[device-audit] session INVALID (stdin closed)") {
          resolveShutdown();
        }
      }),
    };
    const session = await runDeviceAuditCli({
      arguments_: ["--host", "127.0.0.1", "--port", "0"],
      input,
      logger,
      markFailure,
      repositoryRoot: fixture.root,
      signalTarget,
    });
    temporaryPaths.add(session.closure.directory);
    runningAudits.add(session.audit);

    input.end();
    await shutdownLogged;
    const report = await session.shutdown();

    expect(report.integrityValid).toBe(true);
    expect(report.valid).toBe(false);
    expect(markFailure).toHaveBeenCalledTimes(1);
    await expect(lstat(session.closure.directory)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
