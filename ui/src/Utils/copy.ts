export function copy(text: string) {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement("textArea") as HTMLTextAreaElement;
    textArea.value = text;
    document.body.appendChild(textArea);
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.select();
    }
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return Promise.resolve();
  }
}
