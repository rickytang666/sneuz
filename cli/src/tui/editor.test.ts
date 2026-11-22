import { describe, expect, it } from "vitest";
import {
  backspace,
  displayValue,
  type EditorState,
  openEditor,
  submit,
  switchField,
  typeDigit,
} from "./editor";

const typed = (state: EditorState, digits: string) =>
  [...digits].reduce(typeDigit, state);

const fresh = () =>
  openEditor("2026-11-14", null, { bed: 23 * 60, wake: 7 * 60 });

describe("editor", () => {
  it("replaces bed with four digits and jumps to wake", () => {
    const state = typed(fresh(), "2330");
    expect(state.values.bed).toBe(23 * 60 + 30);
    expect(state.field).toBe("wake");
    expect(state.buffer).toBe("");
  });

  it("fills a whole night in eight digits", () => {
    const result = submit(typed(fresh(), "23300710"));
    expect(result.ok && result.bedtime).toEqual(new Date(2026, 10, 13, 23, 30));
    expect(result.ok && result.wake).toEqual(new Date(2026, 10, 14, 7, 10));
  });

  it("saves the defaults untouched", () => {
    const result = submit(fresh());
    expect(result.ok && result.wake).toEqual(new Date(2026, 10, 14, 7, 0));
  });

  it("commits a short entry on tab", () => {
    const state = switchField(typed(fresh(), "9"));
    expect(state.values.bed).toBe(9 * 60);
    expect(state.field).toBe("wake");
  });

  it("shows partial digits in clock slots", () => {
    const state = typed(fresh(), "23");
    expect(displayValue(state, "bed")).toBe("23:__");
    expect(displayValue(backspace(state), "bed")).toBe("2_:__");
    expect(displayValue(state, "wake")).toBe("07:00");
  });

  it("rejects an impossible time and keeps the old value", () => {
    const state = typed(fresh(), "2599");
    expect(state.error).toMatch(/isn't a time/);
    expect(state.values.bed).toBe(23 * 60);
    expect(state.field).toBe("bed");
  });

  it("refuses a wake time before bed", () => {
    // bed 13:00 and wake 12:00 can't both be on the wake day
    const result = submit(typed(fresh(), "13001200"));
    expect(result.ok).toBe(false);
    expect(result.state.error).toMatch(/after bed/);
  });
});
