import { Command } from "commander";

// expected failures print one line; anything else keeps its stack for debugging
async function run(task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch (error) {
    const { UsageError } = await import("./commands");
    const { ApiError } = await import("./http-api");
    if (error instanceof UsageError || error instanceof ApiError) {
      console.error(`sneuz: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

const program = new Command()
  .name("sneuz")
  .description("backfill and fix sleep sessions from the terminal")
  .option("--demo", "run the calendar on fake data, nothing is saved")
  .action((options: { demo?: boolean }) =>
    run(async () => {
      const { UsageError } = await import("./commands");
      if (!process.stdin.isTTY) {
        throw new UsageError("the calendar needs an interactive terminal");
      }
      // loaded lazily so one-liner commands never pay for ink and react
      const { runTui } = await import("./tui/app");
      const { settingsDefaults, applyTimezone } = await import("./core/format");
      const api = options.demo
        ? (await import("./demo-api")).createDemoApi()
        : await (await import("./commands")).connect();
      const settings = await api.getSettings();
      applyTimezone(settings);
      await runTui(api, {
        demo: Boolean(options.demo),
        defaults: settingsDefaults(settings),
      });
    }),
  );

program
  .command("add")
  .description(
    "add the night you woke up on a date, e.g. `sneuz add 11-14 2330 0710`",
  )
  .argument("<times...>", "[date] <bed> <wake>")
  .action((times: string[]) =>
    run(async () => (await import("./commands")).add(times)),
  );

program
  .command("ls")
  .description("print the nights in a date range, the last 14 days by default")
  .option("--from <date>", "first day, e.g. 09-01 or 2026-09-01")
  .option("--to <date>", "last day, default today")
  .option("-d, --days <n>", "days back from --to, instead of --from")
  .option("--json", "print the sessions as json, for scripts and agents")
  .action(
    (options: { from?: string; to?: string; days?: string; json?: boolean }) =>
      run(async () =>
        (await import("./commands")).ls({
          ...options,
          json: Boolean(options.json),
        }),
      ),
  );

program
  .command("login")
  .description("save an api key from Settings > API Keys")
  .action(() => run(async () => (await import("./commands")).login()));

await program.parseAsync();
