import { createClient } from "redis";

function createRedisClient(url: string) {
  return createClient({
    url,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 1_000,
      reconnectStrategy: false,
    },
  });
}

export type RedisClient = ReturnType<typeof createRedisClient>;

/**
 * A small lazy Redis connection with bounded failure behavior. Each Redis
 * workload owns one instance so a content-cache failure cannot disturb the
 * rate limiter connection.
 */
export class RedisConnection {
  private clientPromise: Promise<RedisClient> | undefined;
  private activeClient: RedisClient | undefined;
  private readonly urlEnvironmentVariable: string;
  private readonly label: string;
  private readonly retryCooldownMs: number;
  private retryAfter = 0;

  constructor(
    urlEnvironmentVariable: string,
    label: string,
    retryCooldownMs = 0,
  ) {
    this.urlEnvironmentVariable = urlEnvironmentVariable;
    this.label = label;
    this.retryCooldownMs = retryCooldownMs;
  }

  getClient(): Promise<RedisClient> {
    if (this.clientPromise) return this.clientPromise;
    if (Date.now() < this.retryAfter) {
      return Promise.reject(new Error(`${this.label} Redis is cooling down`));
    }

    const url = process.env[this.urlEnvironmentVariable];
    if (!url) {
      return Promise.reject(
        new Error(`${this.urlEnvironmentVariable} is required`),
      );
    }

    const client = createRedisClient(url);
    this.activeClient = client;
    client.on("error", (error) => {
      console.error(`${this.label} Redis error`, error);
    });
    client.on("end", () => this.discard(client, true));

    const connecting = client.connect().catch((error: unknown) => {
      this.discard(client, true);
      throw error;
    });
    this.clientPromise = connecting;
    return connecting;
  }

  discard(client: RedisClient, unavailable = false) {
    if (this.activeClient !== client) return;

    this.activeClient = undefined;
    this.clientPromise = undefined;
    if (unavailable) this.retryAfter = Date.now() + this.retryCooldownMs;
    if (client.isOpen) client.destroy();
  }
}
