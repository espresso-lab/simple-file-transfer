export function copy(text: string) {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    return new Promise<void>((resolve, reject) => {
      const element = document.createElement("textarea");
      const previouslyFocusedElement = document.activeElement as HTMLElement;
      element.value = text;
      element.setAttribute("readonly", "");
      element.style.contain = "strict";
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.fontSize = "12pt"; // Prevent zooming on iOS
      const selection = document.getSelection();
      const originalRange =
        selection && selection.rangeCount > 0 && selection?.getRangeAt(0);
      document.body.append(element);
      element.select();
      element.selectionStart = 0;
      element.selectionEnd = text.length;
      let isSuccess = false;
      try {
        isSuccess = document.execCommand("copy");
      } catch {}
      element.remove();
      if (originalRange) {
        selection.removeAllRanges();
        selection.addRange(originalRange);
      }
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
      if (isSuccess) {
        return resolve();
      } else {
        reject("Failed to copy to clipboard.");
      }
    });
  }
}
