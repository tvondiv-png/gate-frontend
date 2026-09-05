import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  registerToastHandler,
  registerConfirmHandler
} from "../lib/toastBus";
import "../styles/toast.css";

const ToastContext = createContext(null);

let idSeq = 0;

const ICONES = {
  success: "✓",
  error: "✕",
  info: "i",
  warning: "!"
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((lista) => lista.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (payload) => {
      const id = ++idSeq;
      const toast = {
        id,
        type: payload?.type || "info",
        message: payload?.message || "",
        duration: payload?.duration ?? 4500
      };

      if (!toast.message) return id;

      setToasts((lista) => [...lista, toast]);

      if (toast.duration > 0) {
        const timer = setTimeout(() => remove(id), toast.duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [remove]
  );

  const toast = useMemo(
    () => ({
      success: (message, opts) => push({ ...opts, type: "success", message }),
      error: (message, opts) => push({ ...opts, type: "error", message }),
      info: (message, opts) => push({ ...opts, type: "info", message }),
      warning: (message, opts) => push({ ...opts, type: "warning", message }),
      show: push
    }),
    [push]
  );

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        title: options?.title || "Confirmar ação",
        message: options?.message || "Tem certeza?",
        confirmText: options?.confirmText || "Confirmar",
        cancelText: options?.cancelText || "Cancelar",
        tone: options?.tone || "default", // default | danger
        resolve
      });
    });
  }, []);

  const fecharConfirm = useCallback(
    (resultado) => {
      setConfirmState((atual) => {
        atual?.resolve(resultado);
        return null;
      });
    },
    []
  );

  // registra as pontes para código fora do React
  useEffect(() => {
    registerToastHandler(push);
    registerConfirmHandler(confirm);
  }, [push, confirm]);

  // ESC / Enter no diálogo de confirmação
  useEffect(() => {
    if (!confirmState) return;
    const onKey = (e) => {
      if (e.key === "Escape") fecharConfirm(false);
      if (e.key === "Enter") fecharConfirm(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmState, fecharConfirm]);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="gate-toast-viewport" role="region" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`gate-toast gate-toast-${t.type}`}
            role="status"
          >
            <span className="gate-toast-icon">{ICONES[t.type]}</span>
            <p className="gate-toast-msg">{t.message}</p>
            <button
              className="gate-toast-close"
              onClick={() => remove(t.id)}
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {confirmState && (
        <div
          className="gate-confirm-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) fecharConfirm(false);
          }}
        >
          <div
            className="gate-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="gate-confirm-title"
          >
            <h3 id="gate-confirm-title" className="gate-confirm-title">
              {confirmState.title}
            </h3>
            <p className="gate-confirm-msg">{confirmState.message}</p>
            <div className="gate-confirm-actions">
              <button
                className="gate-confirm-btn gate-confirm-cancel"
                onClick={() => fecharConfirm(false)}
              >
                {confirmState.cancelText}
              </button>
              <button
                className={`gate-confirm-btn gate-confirm-ok ${
                  confirmState.tone === "danger" ? "danger" : ""
                }`}
                onClick={() => fecharConfirm(true)}
                autoFocus
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast precisa estar dentro de <ToastProvider>");
  }
  return ctx.toast;
}

export function useConfirm() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useConfirm precisa estar dentro de <ToastProvider>");
  }
  return ctx.confirm;
}
