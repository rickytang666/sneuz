import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

// a thenable stand-in for drizzle's query builder: every chained call returns itself and is recorded
export function createDbMock() {
  const state = {
    result: [] as unknown[],
    calls: [] as { method: string; args: unknown[] }[],
  };

  const builder: Record<string, unknown> = new Proxy(
    {},
    {
      get(_, method: string) {
        if (method === "then") {
          return (resolve: (value: unknown) => void) => resolve(state.result);
        }
        return (...args: unknown[]) => {
          state.calls.push({ method, args });
          return builder;
        };
      },
    },
  );

  const dialect = new PgDialect();

  return {
    db: builder,
    state,
    reset() {
      state.result = [];
      state.calls = [];
    },
    calls(method: string) {
      return state.calls.filter((c) => c.method === method).map((c) => c.args);
    },
    // bound parameters of every where clause, so a test can assert the user id is filtered on
    whereParams() {
      return this.calls("where").map(
        ([condition]) => dialect.sqlToQuery(condition as SQL).params,
      );
    },
  };
}
