import { createInterface } from "node:readline";

function ask(question: string, hidden: boolean): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  let muted = false;
  // readline redraws the line on each keystroke; muting after the prompt hides what's typed
  const internal = rl as unknown as { _writeToOutput: (text: string) => void };
  internal._writeToOutput = (text) => {
    if (!muted) process.stdout.write(text);
  };
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = hidden;
  });
}

export const askHidden = (question: string) => ask(question, true);

export async function confirm(question: string): Promise<boolean> {
  return (await ask(`${question} [y/N] `, false)).toLowerCase() === "y";
}

export async function readStdin(): Promise<string> {
  let text = "";
  for await (const chunk of process.stdin) text += chunk;
  return text.trim();
}
