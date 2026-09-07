import type { AnyTRPCProcedure } from "@trpc/server";
import type { AppRouter } from "./routers/_app";

type ProcedurePaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends AnyTRPCProcedure
    ? `${Prefix}${K}`
    : T[K] extends object
      ? ProcedurePaths<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

export type AppProcedurePath = ProcedurePaths<AppRouter["_def"]["record"]>;
