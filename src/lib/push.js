import api from "../api/api";

export function pushSuportado() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function statusInscricaoPush() {
  if (!pushSuportado()) return "indisponivel";
  if (Notification.permission === "denied") return "negado";

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub ? "ativo" : "inativo";
}

export async function ativarPush() {
  if (!pushSuportado()) {
    throw new Error("Este navegador não suporta notificações push.");
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") {
    throw new Error("Permissão de notificação não concedida.");
  }

  const { data } = await api.get("/api/push/vapid-public-key");
  if (!data?.publicKey) {
    throw new Error("Notificações push não configuradas no servidor.");
  }

  const reg = await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey)
    });
  }

  const json = sub.toJSON();
  await api.post("/api/push/subscribe", {
    endpoint: json.endpoint,
    keys: json.keys,
    userAgent: navigator.userAgent
  });

  return true;
}

export async function desativarPush() {
  if (!pushSuportado()) return;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  await sub.unsubscribe();

  await api.post("/api/push/unsubscribe", { endpoint }).catch(() => {});
}
