export function findMDCodeContent(
  tag: string,
  response: string,
): string | undefined {
  const blockStart = response.indexOf("```" + tag + "\n");
  const blockEnd = response.lastIndexOf("\n```");
  if (blockStart === -1 || blockEnd === -1) {
    return undefined;
  }
  const content = response
    .slice(blockStart, blockEnd)
    .replace("```" + tag, "")
    .replace("```", "")
    .trim();
  return content;
}
