import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createChromeFetch } from "../components/px_items/chromeFetch.ts";

type FetchCall = {
  url: string;
  init: RequestInit;
};

function mockFetch(
  handler: (call: FetchCall, index: number) => Response | Promise<Response>,
) {
  const originalFetch = globalThis.fetch;
  const calls: FetchCall[] = [];

  globalThis.fetch = async (input, init = {}) => {
    const call = { url: input.toString(), init };
    calls.push(call);
    return handler(call, calls.length - 1);
  };

  return {
    calls,
    restore() {
      globalThis.fetch = originalFetch;
    },
  };
}

test("discard cancels an unread response body", async () => {
  let cancelled = false;
  const body = new ReadableStream({
    cancel() {
      cancelled = true;
    },
  });
  const client = createChromeFetch();

  await client.discard(new Response(body));

  assert.equal(cancelled, true);
});

test("ignoring a get()/post() result does not accumulate sockets", async () => {
  const openSockets = new Set<object>();
  let peakOpenSockets = 0;
  const payload = "x".repeat(256 * 1024);
  const server = createServer((_request, response) => {
    response.writeHead(200, {
      "Content-Type": "text/html",
      "Content-Length": String(payload.length),
    });
    response.end(payload);
  });
  server.on("connection", (socket) => {
    openSockets.add(socket);
    peakOpenSockets = Math.max(peakOpenSockets, openSockets.size);
    socket.on("close", () => openSockets.delete(socket));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  try {
    if (!address || typeof address === "string") return;
    for (let request = 0; request < 12; request += 1) {
      const client = createChromeFetch();
      // Deliberately ignore the result: this is the shape that used to leak a
      // socket per call, and must now be safe without any caller discipline.
      await client.get(`http://127.0.0.1:${address.port}/`);
    }

    assert.ok(
      peakOpenSockets <= 2,
      `expected at most 2 concurrent sockets, saw ${peakOpenSockets}`,
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST supplies Origin and a 302 downgrade clears body headers", async () => {
  const mocked = mockFetch((_call, index) =>
    index === 0
      ? new Response("redirect", {
          status: 302,
          headers: { Location: "/result" },
        })
      : new Response("done"),
  );

  try {
    const response = await createChromeFetch().post(
      "https://portal.school.edu.tw/login",
      {
        data: "username=howard",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Language": "zh-TW",
        },
      },
    );
    await response.text();

    const firstHeaders = new Headers(mocked.calls[0]?.init.headers);
    const redirectedHeaders = new Headers(mocked.calls[1]?.init.headers);
    assert.equal(firstHeaders.get("origin"), "https://portal.school.edu.tw");
    assert.equal(mocked.calls[1]?.init.method, "GET");
    assert.equal(mocked.calls[1]?.init.body, undefined);
    assert.equal(redirectedHeaders.has("content-type"), false);
    assert.equal(redirectedHeaders.has("content-language"), false);
  } finally {
    mocked.restore();
  }
});

test("cross-origin redirects do not forward sensitive caller headers", async () => {
  const mocked = mockFetch((_call, index) =>
    index === 0
      ? new Response("redirect", {
          status: 302,
          headers: { Location: "https://other.example/result" },
        })
      : new Response("done"),
  );

  try {
    const response = await createChromeFetch().get(
      "https://portal.school.edu.tw/start",
      {
        headers: {
          Authorization: "Bearer secret",
          Referer: "https://private.example/path?token=secret",
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );
    await response.text();

    const redirectedHeaders = new Headers(mocked.calls[1]?.init.headers);
    assert.equal(redirectedHeaders.has("authorization"), false);
    assert.equal(redirectedHeaders.has("x-requested-with"), false);
    assert.equal(
      redirectedHeaders.get("referer"),
      "https://portal.school.edu.tw/",
    );
  } finally {
    mocked.restore();
  }
});

test("injected dot-less cookie domains remain host-only", () => {
  const client = createChromeFetch([
    {
      name: "session",
      value: "secret",
      domain: "school.edu.tw",
      path: "/",
    },
  ]);

  assert.equal(client.cookies("https://school.edu.tw/").length, 1);
  assert.equal(client.cookies("https://sub.school.edu.tw/").length, 0);
});

test("Set-Cookie rejects unrelated domains and public suffixes", async () => {
  const headers = new Headers();
  headers.append("Set-Cookie", "unrelated=1; Domain=example.com");
  headers.append("Set-Cookie", "public=2; Domain=edu.tw");
  headers.append("Set-Cookie", "valid=3; Domain=school.edu.tw");
  const mocked = mockFetch(
    () =>
      new Response("done", {
        headers,
      }),
  );

  try {
    const client = createChromeFetch();
    const response = await client.get("https://portal.school.edu.tw/path");
    await response.text();

    assert.deepEqual(
      client.cookies().map(({ name }) => name),
      ["valid"],
    );
  } finally {
    mocked.restore();
  }
});

test("cookies() retains default-path cookies for browser handoff", async () => {
  const mocked = mockFetch(
    () =>
      new Response("done", {
        headers: { "Set-Cookie": "session=1" },
      }),
  );

  try {
    const client = createChromeFetch();
    const response = await client.get(
      "https://portal.school.edu.tw/B2KPortal/Login.aspx",
    );
    await response.text();

    assert.equal(client.cookies()[0]?.path, "/B2KPortal");
  } finally {
    mocked.restore();
  }
});

test("requests abort after the configured timeout", async () => {
  const mocked = mockFetch(
    ({ init }) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          reject(init.signal?.reason);
        });
      }),
  );

  try {
    const client = createChromeFetch([], { requestTimeoutMs: 10 });
    await assert.rejects(client.get("https://school.edu.tw/hangs"), {
      name: "TimeoutError",
    });
  } finally {
    mocked.restore();
  }
});

test("stream() hands back a raw body the caller can pipe", async () => {
  const mocked = mockFetch(() => new Response("%PDF-1.7 payload"));

  try {
    const response = await createChromeFetch().stream(
      "https://portal.school.edu.tw/YMR_Stu/YMR/DownLoad",
      { method: "POST", data: "FileId=abc" },
    );

    // Unlike get()/post(), the body is still unread and streamable.
    assert.equal(response instanceof Response, true);
    assert.equal(response.bodyUsed, false);
    assert.notEqual(response.body, null);
    assert.equal(mocked.calls[0]?.init.method, "POST");
    assert.equal(await response.text(), "%PDF-1.7 payload");
  } finally {
    mocked.restore();
  }
});

test("get() exposes a buffered body that can be read more than once", async () => {
  const mocked = mockFetch(() => new Response('{"IsOK":true}'));

  try {
    const response = await createChromeFetch().get(
      "https://portal.school.edu.tw/api",
    );

    assert.equal(await response.text(), '{"IsOK":true}');
    assert.deepEqual(await response.json(), { IsOK: true });
    assert.equal((await response.arrayBuffer()).byteLength, 13);
  } finally {
    mocked.restore();
  }
});
