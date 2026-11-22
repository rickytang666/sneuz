import { Box, type Key, render, Text, useApp, useInput } from "ink";
import { Fragment, useEffect, useRef, useState } from "react";
import type { Session, SneuzApi } from "../api";
import {
  formatDay,
  type LocalDate,
  monthDividers,
  todayLocalDate,
} from "../core/dates";
import { type Defaults, describeSession, describeTimes } from "../core/format";
import {
  findOverlaps,
  formatDuration,
  groupByWakeDate,
  mainSession,
  sevenDayMedian,
} from "../core/nights";
import { clockOf } from "../core/time";
import {
  backspace,
  displayValue,
  type EditorState,
  type Field,
  openEditor,
  submit,
  switchField,
  typeDigit,
} from "./editor";
import {
  initialNav,
  moveTo,
  type NavAction,
  type NavState,
  nearestEmpty,
  reduceNav,
  visibleRows,
} from "./nav";
import {
  blockedReason,
  commitSave,
  createWriteQueue,
  isPending,
  pendingId,
  type WriteQueue,
  withConfirmed,
  withSaved,
} from "./writes";

// three letters so each column has a true middle character for the glyph to sit under
const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const KEY_HELP = [
  "←↑↓→ or h j k l  move       t  today",
  "shift+←/→ or [ ]  previous or next empty day",
  "{ }  a month back or forward",
  "enter  add or edit          backspace  delete",
  "in the editor: type digits, tab next field, enter save, esc cancel",
  "q  quit                     ?  hide keys",
];

type Mode =
  | { kind: "browse" }
  | { kind: "edit"; editor: EditorState }
  | { kind: "confirmDelete"; session: Session }
  | {
      kind: "confirmReplace";
      editor: EditorState;
      bedtime: Date;
      wake: Date;
      overlaps: Session[];
    };

type Ui = {
  nav: NavState;
  mode: Mode;
  help: boolean;
  error: string | null;
};

function editorFor(
  day: LocalDate,
  session: Session | null,
  defaults: Defaults,
): EditorState {
  if (session === null) return openEditor(day, null, defaults);
  return openEditor(day, session.id, {
    bed: clockOf(new Date(session.bedtime)),
    wake: session.wake_time
      ? clockOf(new Date(session.wake_time))
      : defaults.wake,
  });
}

function App({
  api,
  demo,
  visibleWeeks,
  defaults,
  failures,
}: {
  api: SneuzApi;
  demo: boolean;
  visibleWeeks: number;
  defaults: Defaults;
  // writes that fail after q are collected here and printed once the screen closes
  failures: string[];
}) {
  const { exit } = useApp();
  const today = todayLocalDate();

  const [ui, setUi] = useState<Ui>(() => ({
    nav: initialNav(today),
    mode: { kind: "browse" },
    help: false,
    error: null,
  }));
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // a terminal can deliver several keys in one chunk, all handled before react re-renders.
  // handlers read and write these refs so a fast burst never acts on stale state
  const uiRef = useRef(ui);
  const sessionsRef = useRef(sessions);
  const tempIds = useRef(0);
  const writes = useRef<WriteQueue | null>(null);
  writes.current ??= createWriteQueue(() => exit());
  const [quitting, setQuitting] = useState(false);

  function putUi(next: Ui) {
    uiRef.current = next;
    setUi(next);
  }

  function putSessions(next: Session[]) {
    sessionsRef.current = next;
    setSessions(next);
  }

  function patchUi(patch: Partial<Ui>) {
    putUi({ ...uiRef.current, ...patch });
  }

  useEffect(() => {
    let active = true;
    api
      .listSessions()
      .then((loaded) => {
        if (!active) return;
        sessionsRef.current = loaded;
        setSessions(loaded);
      })
      .catch((cause: Error) => {
        if (active) setLoadError(`couldn't load: ${cause.message}`);
      });
    return () => {
      active = false;
    };
  }, [api]);

  const byDay = groupByWakeDate(sessions ?? []);
  const rows = visibleRows(today, ui.nav, visibleWeeks);
  const dividers = monthDividers(rows);
  const median = sevenDayMedian(byDay, today);

  // after a failed write, the server's copy wins over whatever was shown
  async function resync(cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    if (writes.current?.quitting) {
      failures.push(`save failed: ${message}`);
      return;
    }
    patchUi({ error: `save failed: ${message}` });
    const fresh = await api.listSessions().catch(() => null);
    if (fresh) putSessions(fresh);
  }

  // written to the grid first so it never lags a keypress, then sent
  function save(
    editor: EditorState,
    bedtime: Date,
    wake: Date,
    replace: Session[],
  ) {
    const id = editor.sessionId ?? pendingId(tempIds.current++);
    putSessions(
      withSaved(sessionsRef.current ?? [], id, bedtime, wake, replace),
    );
    putUi({ ...uiRef.current, mode: { kind: "browse" }, error: null });
    void writes.current?.run(async () => {
      try {
        const saved = await commitSave(
          api,
          editor.sessionId,
          bedtime,
          wake,
          replace,
        );
        putSessions(withConfirmed(sessionsRef.current ?? [], id, saved));
      } catch (cause) {
        await resync(cause);
      }
    });
  }

  function remove(session: Session) {
    putSessions((sessionsRef.current ?? []).filter((s) => s.id !== session.id));
    putUi({ ...uiRef.current, mode: { kind: "browse" }, error: null });
    void writes.current?.run(async () => {
      try {
        await api.deleteSession(session.id);
      } catch (cause) {
        await resync(cause);
      }
    });
  }

  function trySubmit(editor: EditorState) {
    const result = submit(editor);
    if (!result.ok) {
      patchUi({ mode: { kind: "edit", editor: result.state } });
      return;
    }
    const overlaps = findOverlaps(
      result.bedtime,
      result.wake,
      sessionsRef.current ?? [],
      editor.sessionId,
    );
    if (overlaps.some(isPending)) {
      patchUi({ error: "still saving an overlapping night" });
      return;
    }
    if (overlaps.length > 0) {
      patchUi({
        mode: {
          kind: "confirmReplace",
          editor: result.state,
          bedtime: result.bedtime,
          wake: result.wake,
          overlaps,
        },
      });
      return;
    }
    save(result.state, result.bedtime, result.wake, []);
  }

  // one night per day: a rare second session stays visible as "+1 more" but only the longest is edited
  function openDay(intent: "edit" | "delete") {
    const day = uiRef.current.nav.cursorDate;
    const loaded = sessionsRef.current;
    const night = mainSession(groupByWakeDate(loaded ?? []).get(day) ?? []);
    const blocked = blockedReason(
      loaded,
      loadError !== null,
      night ? [night] : [],
    );
    if (blocked) {
      patchUi({ error: blocked });
      return;
    }
    if (intent === "delete") {
      if (night) patchUi({ mode: { kind: "confirmDelete", session: night } });
      return;
    }
    patchUi({
      mode: { kind: "edit", editor: editorFor(day, night ?? null, defaults) },
    });
  }

  function moveCursor(action: NavAction) {
    const live = uiRef.current;
    patchUi({
      nav: reduceNav(live.nav, action, { today, visibleWeeks }),
      error: null,
    });
  }

  function jumpToEmpty(direction: 1 | -1) {
    const live = uiRef.current;
    const loaded = sessionsRef.current ?? [];
    const byDate = groupByWakeDate(loaded);
    const ctx = { today, visibleWeeks };
    const target = nearestEmpty(
      live.nav.cursorDate,
      direction,
      new Set(byDate.keys()),
      ctx,
    );
    if (target) patchUi({ nav: moveTo(live.nav, target, ctx), error: null });
  }

  function handleKey(input: string, key: Key) {
    const live = uiRef.current;
    const mode = live.mode;
    const isBackspace = key.backspace || key.delete;
    if (writes.current?.quitting) return;

    if (mode.kind === "edit") {
      const { editor } = mode;
      if (key.escape) patchUi({ mode: { kind: "browse" } });
      else if (key.return) trySubmit(editor);
      else if (key.tab || key.leftArrow || key.rightArrow)
        patchUi({ mode: { kind: "edit", editor: switchField(editor) } });
      else if (isBackspace)
        patchUi({ mode: { kind: "edit", editor: backspace(editor) } });
      else if (/^[0-9]$/.test(input))
        patchUi({ mode: { kind: "edit", editor: typeDigit(editor, input) } });
      return;
    }

    if (mode.kind === "confirmDelete") {
      if (input === "y") remove(mode.session);
      else patchUi({ mode: { kind: "browse" } });
      return;
    }

    if (mode.kind === "confirmReplace") {
      if (input === "y") {
        save(mode.editor, mode.bedtime, mode.wake, mode.overlaps);
      } else {
        // back to the editor so the times can be adjusted instead
        patchUi({ mode: { kind: "edit", editor: mode.editor } });
      }
      return;
    }

    if (input === "q") {
      if (!writes.current?.quit()) setQuitting(true);
    } else if (key.escape) patchUi({ help: false, error: null });
    else if ((key.shift && key.leftArrow) || input === "[") jumpToEmpty(-1);
    else if ((key.shift && key.rightArrow) || input === "]") jumpToEmpty(1);
    // shift+up/down is left alone: some terminals use it to select text
    else if (input === "{") moveCursor("monthBack");
    else if (input === "}") moveCursor("monthForward");
    else if (key.leftArrow || input === "h") moveCursor("left");
    else if (key.rightArrow || input === "l") moveCursor("right");
    else if (key.upArrow || input === "k") moveCursor("up");
    else if (key.downArrow || input === "j") moveCursor("down");
    else if (input === "t") moveCursor("today");
    else if (key.return) openDay("edit");
    else if (isBackspace) openDay("delete");
    else if (input === "?") patchUi({ help: !live.help });
  }

  // fast typing arrives as one chunk like "233007\r"; replay it a key at a time
  useInput((input, key) => {
    if (input.length <= 1 || key.ctrl || key.meta) {
      handleKey(input, key);
      return;
    }
    for (const char of input) {
      if (char === "\r") handleKey("", { ...key, return: true });
      else if (char === "\t") handleKey("", { ...key, tab: true });
      else if (char === "\x7f") handleKey("", { ...key, backspace: true });
      else handleKey(char, key);
    }
  });

  const cursorDay = byDay.get(ui.nav.cursorDate) ?? [];

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text bold>sneuz</Text>
        <Text dimColor>
          {"  "}
          {median === null
            ? "no nights this week"
            : `7-day median ${formatDuration(median)}`}
          {demo ? "  demo data, nothing is saved" : ""}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>{"     "}</Text>
        {WEEKDAYS.map((day) => (
          <Text key={day} dimColor>
            {day}{" "}
          </Text>
        ))}
      </Box>

      {rows.map((row, rowIndex) => (
        <Box key={row.days[0].date}>
          <Text dimColor>{(dividers[rowIndex] ?? "").padEnd(5)}</Text>
          {row.days.map((cell) => {
            const main = mainSession(byDay.get(cell.date) ?? []);
            const isCursor = cell.date === ui.nav.cursorDate;
            return (
              // every cell is 4 wide with the glyph at index 1, so the brackets never shift it
              <Fragment key={cell.date}>
                <Text>{isCursor ? "[" : " "}</Text>
                <Text
                  // bold keeps logged days bright in any theme; gray plus faint sinks empty ones
                  bold={Boolean(main)}
                  color={main ? undefined : "gray"}
                  dimColor={!main}
                >
                  {cell.isFuture ? " " : "■"}
                </Text>
                <Text>{isCursor ? "] " : "  "}</Text>
              </Fragment>
            );
          })}
          {rowIndex === 0 && sessions === null ? (
            <Text dimColor>{"  loading"}</Text>
          ) : null}
        </Box>
      ))}

      <Box marginTop={1} flexDirection="column">
        <StatusLine ui={ui} cursorDay={cursorDay} />
        {loadError ? <Text color="red">{loadError}</Text> : null}
        {ui.error ? <Text color="red">{ui.error}</Text> : null}
        {quitting ? <Text dimColor>saving, then quitting</Text> : null}
        {ui.help
          ? KEY_HELP.map((line) => (
              <Text key={line} dimColor>
                {line}
              </Text>
            ))
          : null}
      </Box>
    </Box>
  );
}

function StatusLine({ ui, cursorDay }: { ui: Ui; cursorDay: Session[] }) {
  const day = formatDay(ui.nav.cursorDate, todayLocalDate());
  const mode = ui.mode;

  if (mode.kind === "edit") {
    const { editor } = mode;
    const field = (name: Field, label: string) => {
      const focused = editor.field === name;
      return (
        <>
          <Text dimColor>{`  ${label} `}</Text>
          <Text inverse={focused}>{displayValue(editor, name)}</Text>
        </>
      );
    };
    return (
      <Box flexDirection="column">
        <Box>
          <Text>{formatDay(editor.wakeDate, todayLocalDate())}</Text>
          {field("bed", "bed")}
          {field("wake", "wake")}
          {editor.error ? (
            <Text color="red">{`   ${editor.error}`}</Text>
          ) : null}
        </Box>
        <Text dimColor>
          type digits · tab next field · enter save · esc cancel
        </Text>
      </Box>
    );
  }

  if (mode.kind === "confirmDelete") {
    return (
      <Text>
        {`delete ${describeSession(mode.session)}? `}
        <Text bold>y</Text>
        <Text dimColor> to confirm, any key to cancel</Text>
      </Text>
    );
  }

  if (mode.kind === "confirmReplace") {
    const first = mode.overlaps[0];
    const more =
      mode.overlaps.length > 1 ? ` and ${mode.overlaps.length - 1} more` : "";
    return (
      <Text>
        {`${describeTimes(mode.bedtime, mode.wake)} overlaps ${describeSession(first)}${more}. replace it? `}
        <Text bold>y</Text>
        <Text dimColor> to replace, any key to go back</Text>
      </Text>
    );
  }

  const main = mainSession(cursorDay);
  const extra = cursorDay.length > 1 ? `  +${cursorDay.length - 1} more` : "";
  return (
    <Box>
      <Text>
        {main
          ? `${day} · ${describeSession(main)}${extra}`
          : `${day} · no night logged`}
      </Text>
      {ui.help ? null : <Text dimColor>{"    ? for keys"}</Text>}
    </Box>
  );
}

export async function runTui(
  api: SneuzApi,
  { demo, defaults }: { demo: boolean; defaults: Defaults },
): Promise<void> {
  // header, weekday row and status lines take about 8 rows
  const visibleWeeks = Math.max(
    4,
    Math.min(12, (process.stdout.rows ?? 24) - 8),
  );
  const failures: string[] = [];
  // the calendar gets its own screen, so quitting restores the terminal as it was
  const { waitUntilExit } = render(
    <App
      api={api}
      demo={demo}
      visibleWeeks={visibleWeeks}
      defaults={defaults}
      failures={failures}
    />,
    { alternateScreen: true },
  );
  await waitUntilExit();
  for (const failure of failures) console.error(`sneuz: ${failure}`);
  if (failures.length > 0) process.exitCode = 1;
}
