/* =========================================================
   Ponte entre código fora do React (ex.: interceptors do
   axios) e o ToastProvider. O provider registra o handler
   ao montar; quem não é componente usa emitToast().
========================================================= */

let toastHandler = null;
let confirmHandler = null;

export function registerToastHandler(fn) {
  toastHandler = fn;
}

export function registerConfirmHandler(fn) {
  confirmHandler = fn;
}

export function emitToast(payload) {
  if (toastHandler) {
    toastHandler(payload);
    return;
  }
  // fallback se o provider ainda não montou
  if (payload?.message) {
    console.warn("[toast]", payload.message);
  }
}

export function emitConfirm(options) {
  if (confirmHandler) return confirmHandler(options);
  // fallback: mantém o comportamento antigo
  return Promise.resolve(window.confirm(options?.message || "Confirmar?"));
}
