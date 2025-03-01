export function extractString(input: string, target: string): string {
  const regex = new RegExp(`${target}: (.*?)($|\\s)`, 'i');
  const match = input.match(regex);
  if (!match) {
    throw new Error(`**failed to find ${target}.`);
  }
  return match[0];
}

export function extractArray(input: string, target: string): string[] {
  const regex = new RegExp(`${target}: (.*?)($|\\s)`, 'i');
  const match = input.match(regex);
  if (!match) {
    throw new Error(`**failed to find ${target}.`);
  }
  return match[0].split(',');
}
