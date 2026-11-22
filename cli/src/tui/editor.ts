import type { LocalDate } from "../core/dates";
import { formatClock, nightTimes, parseTime } from "../core/time";

export type Field = "bed" | "wake";

export type EditorState = {
  wakeDate: LocalDate;
  // null when adding a new night
  sessionId: string | null;
  values: Record<Field, number>;
  field: Field;
  // digits typed since the field was focused; empty means the stored value is shown selected
  buffer: string;
  error: string | null;
};

export function openEditor(
  wakeDate: LocalDate,
  sessionId: string | null,
  values: Record<Field, number>,
): EditorState {
  return { wakeDate, sessionId, values, field: "bed", buffer: "", error: null };
}

const other = (field: Field): Field => (field === "bed" ? "wake" : "bed");

// folds a partly typed value into the field; false when it isn't a time
function commitBuffer(state: EditorState): EditorState | null {
  if (state.buffer === "") return { ...state, error: null };
  const minutes = parseTime(state.buffer);
  if (minutes === null) return null;
  return {
    ...state,
    values: { ...state.values, [state.field]: minutes },
    buffer: "",
    error: null,
  };
}

export function typeDigit(state: EditorState, digit: string): EditorState {
  const buffer = state.buffer + digit;
  if (buffer.length < 4) return { ...state, buffer, error: null };

  const committed = commitBuffer({ ...state, buffer });
  if (committed === null) {
    return { ...state, buffer: "", error: `${buffer} isn't a time` };
  }
  // a full time on bed moves straight on to wake
  return state.field === "bed" ? { ...committed, field: "wake" } : committed;
}

export function backspace(state: EditorState): EditorState {
  return { ...state, buffer: state.buffer.slice(0, -1), error: null };
}

export function switchField(state: EditorState): EditorState {
  const committed = commitBuffer(state);
  if (committed === null) {
    return { ...state, buffer: "", error: `${state.buffer} isn't a time` };
  }
  return { ...committed, field: other(state.field) };
}

export type Submit =
  | { ok: true; state: EditorState; bedtime: Date; wake: Date }
  | { ok: false; state: EditorState };

export function submit(state: EditorState): Submit {
  const committed = commitBuffer(state);
  if (committed === null) {
    return {
      ok: false,
      state: { ...state, buffer: "", error: `${state.buffer} isn't a time` },
    };
  }
  const night = nightTimes(
    committed.wakeDate,
    committed.values.bed,
    committed.values.wake,
  );
  if (night === null) {
    return {
      ok: false,
      state: { ...committed, error: "wake has to be after bed" },
    };
  }
  return { ok: true, state: committed, ...night };
}

// "23:30", or the typed digits filling HH:MM left to right, like "23:3_"
export function displayValue(state: EditorState, field: Field): string {
  if (field !== state.field || state.buffer === "") {
    return formatClock(state.values[field]);
  }
  const slots = state.buffer.padEnd(4, "_");
  return `${slots.slice(0, 2)}:${slots.slice(2)}`;
}
