export function shouldPreventCapturePan({
  isInput,
  scrollTop = 0,
  scrollHeight = 0,
  clientHeight = 0,
  deltaY = 0,
}) {
  if (!isInput) return true;

  const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
  if (maxScrollTop <= 0) return true;

  const epsilon = 0.5;
  if (deltaY < 0) return scrollTop >= maxScrollTop - epsilon;
  if (deltaY > 0) return scrollTop <= epsilon;
  return true;
}
