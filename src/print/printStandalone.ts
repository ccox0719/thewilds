export function getPrintParam(): string | null {
  return new URLSearchParams(window.location.search).get('print');
}
