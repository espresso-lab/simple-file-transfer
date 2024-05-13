export function copy(text: string) {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject("The Clipboard API is not available.");
}
