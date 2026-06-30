import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Send,
  MessageSquare,
  ArrowLeft,
  Briefcase,
  Loader2,
  ImagePlus,
  ImageIcon,
  X,
  CheckCircle2,
  Wallet,
  ChevronDown,
} from "lucide-react";
import {
  chatsApi,
  authApi,
  kworksApi,
  extractError,
  chatSocketUrl,
} from "../lib/api";
import { Avatar, PageLoader, EmptyState, Button, Alert } from "../components/ui";
import { formatTime, timeAgo, formatPrice } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import TopUpModal from "../components/TopUpModal";

function KworkThumb({ photo, size = 20 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800"
      style={{ width: size, height: size }}
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <ImageIcon className="size-1/2 text-ink-300" />
      )}
    </span>
  );
}

function pluralListings(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "е";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "я";
  return "й";
}

export default function MessagesPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [chats, setChats] = useState([]);
  const [usersCache, setUsersCache] = useState({});
  const [loadingChats, setLoadingChats] = useState(true);

  const loadUser = useCallback(
    async (uid) => {
      if (!uid || usersCache[uid]) return;
      try {
        const u = await authApi.getUser(uid);
        setUsersCache((c) => ({ ...c, [uid]: u }));
      } catch {
        setUsersCache((c) => ({ ...c, [uid]: { id: uid, name: "Пользователь" } }));
      }
    },
    [usersCache]
  );

  useEffect(() => {
    let active = true;
    chatsApi
      .my()
      .then((data) => {
        if (!active) return;
        setChats(data);
        data.forEach((c) => {
          const otherId =
            c.initiator_id === user?.id ? c.receiver_id : c.initiator_id;
          loadUser(otherId);
        });
      })
      .catch(() => {})
      .finally(() => active && setLoadingChats(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function otherIdOf(chat) {
    return chat.initiator_id === user?.id
      ? chat.receiver_id
      : chat.initiator_id;
  }

  const groups = useMemo(() => {
    const map = new Map();
    for (const chat of chats) {
      const oid =
        chat.initiator_id === user?.id ? chat.receiver_id : chat.initiator_id;
      if (!map.has(oid)) map.set(oid, []);
      map.get(oid).push(chat);
    }
    return Array.from(map.entries()).map(([otherId, items]) => ({
      otherId,
      chats: items,
      latest: items[0],
    }));
  }, [chats, user?.id]);

  const [expanded, setExpanded] = useState({});

  function toggleGroup(otherId) {
    setExpanded((e) => ({ ...e, [otherId]: !e[otherId] }));
  }

  const activeChat = chats.find((c) => String(c.id) === String(chatId));

  useEffect(() => {
    if (!activeChat) return;
    const oid =
      activeChat.initiator_id === user?.id
        ? activeChat.receiver_id
        : activeChat.initiator_id;
    setExpanded((e) => (e[oid] ? e : { ...e, [oid]: true }));
  }, [activeChat, user?.id]);

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-0 py-0 sm:px-6 sm:py-6 lg:px-8">
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden border border-slate-200 bg-white sm:h-[calc(100vh-7rem)] sm:rounded-2xl sm:shadow-sm dark:bg-slate-900">
        <aside
          className={`w-full flex-col border-r border-slate-200 sm:w-80 lg:w-96 ${
            chatId ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="border-b border-slate-200 px-5 py-4">
            <h1 className="font-display text-xl font-extrabold text-ink-900">
              Сообщения
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto scroll-thin">
            {loadingChats ? (
              <div className="p-8">
                <PageLoader label="Загрузка чатов..." />
              </div>
            ) : chats.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={MessageSquare}
                  title="Чатов пока нет"
                  description="Откликнитесь на объявление — и здесь появится диалог с автором."
                />
              </div>
            ) : (
              groups.map((group) => {
                const other = usersCache[group.otherId];

                if (group.chats.length === 1) {
                  const chat = group.chats[0];
                  const isActive = String(chat.id) === String(chatId);
                  return (
                    <button
                      key={chat.id}
                      onClick={() => navigate(`/messages/${chat.id}`)}
                      className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50 ${
                        isActive ? "bg-brand-50/60 dark:bg-brand-500/15" : ""
                      }`}
                    >
                      <Avatar user={other} name={other?.name} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold text-ink-900">
                            {other?.name || "Загрузка..."}
                          </span>
                          <span className="shrink-0 text-xs text-ink-300">
                            {timeAgo(chat.created_at)}
                          </span>
                        </div>
                        {chat.kwork_title && (
                          <div className="flex items-center gap-1.5">
                            <KworkThumb photo={chat.kwork_photo} />
                            <span className="truncate text-xs text-ink-400">
                              {chat.kwork_title}
                            </span>
                          </div>
                        )}
                        <p className="truncate text-sm text-ink-500">
                          {chat.last_message || "Нет сообщений"}
                        </p>
                      </div>
                    </button>
                  );
                }

                const isOpen = expanded[group.otherId];
                const hasActive = group.chats.some(
                  (c) => String(c.id) === String(chatId)
                );
                return (
                  <div
                    key={`group-${group.otherId}`}
                    className="border-b border-slate-100"
                  >
                    <button
                      onClick={() => toggleGroup(group.otherId)}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 ${
                        hasActive && !isOpen
                          ? "bg-brand-50/60 dark:bg-brand-500/15"
                          : ""
                      }`}
                    >
                      <Avatar user={other} name={other?.name} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold text-ink-900">
                            {other?.name || "Загрузка..."}
                          </span>
                          <span className="shrink-0 text-xs text-ink-300">
                            {timeAgo(group.latest.created_at)}
                          </span>
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-ink-400">
                          <Briefcase className="size-3 shrink-0" />
                          {group.chats.length} объявлени
                          {pluralListings(group.chats.length)}
                        </p>
                        <p className="truncate text-sm text-ink-500">
                          {group.latest.last_message || "Нет сообщений"}
                        </p>
                      </div>
                      <ChevronDown
                        className={`size-4 shrink-0 text-ink-300 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="bg-slate-50/60 dark:bg-slate-800/40">
                        {group.chats.map((chat) => {
                          const isActive =
                            String(chat.id) === String(chatId);
                          return (
                            <button
                              key={chat.id}
                              onClick={() =>
                                navigate(`/messages/${chat.id}`)
                              }
                              className={`flex w-full items-center gap-2.5 border-t border-slate-100 py-2.5 pl-6 pr-4 text-left transition hover:bg-slate-100/70 ${
                                isActive
                                  ? "bg-brand-50 dark:bg-brand-500/15"
                                  : ""
                              }`}
                            >
                              <KworkThumb photo={chat.kwork_photo} size={36} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate text-sm font-medium text-ink-800">
                                    {chat.kwork_title || "Объявление"}
                                  </span>
                                  <span className="shrink-0 text-xs text-ink-300">
                                    {timeAgo(chat.created_at)}
                                  </span>
                                </div>
                                <p className="truncate text-xs text-ink-500">
                                  {chat.last_message || "Нет сообщений"}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <section
          className={`flex-1 flex-col ${
            chatId ? "flex" : "hidden sm:flex"
          }`}
        >
          {chatId ? (
            <Conversation
              key={chatId}
              chatId={chatId}
              currentUser={user}
              other={activeChat ? usersCache[otherIdOf(activeChat)] : null}
              chatMeta={activeChat}
              onBack={() => navigate("/messages")}
              onSent={(text) =>
                setChats((prev) =>
                  prev.map((c) =>
                    String(c.id) === String(chatId)
                      ? { ...c, last_message: text }
                      : c
                  )
                )
              }
            />
          ) : (
            <div className="hidden flex-1 flex-col items-center justify-center text-center sm:flex">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-400 dark:bg-brand-500/15 dark:text-brand-300">
                <MessageSquare className="size-8" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-ink-900">
                Выберите диалог
              </h2>
              <p className="mt-1 max-w-xs text-sm text-ink-500">
                Слева список ваших чатов. Выберите один, чтобы начать общение.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Conversation({ chatId, currentUser, other, chatMeta, onBack, onSent }) {
  const { refreshUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [kwork, setKwork] = useState(null);
  const [connected, setConnected] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachPreview, setAttachPreview] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [needTopUp, setNeedTopUp] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  const isOwner = kwork && currentUser?.id === kwork.user_id;
  const isCompleted = kwork?.status === "completed";
  const canComplete =
    isOwner && kwork.client_id && kwork.status !== "completed";
  const shortfall =
    kwork && currentUser
      ? Math.max(0, kwork.price - (currentUser.balance ?? 0))
      : 0;

  async function handleComplete() {
    if (!kwork) return;
    setActing(true);
    setActionError("");
    setNeedTopUp(false);
    try {
      const updated = await kworksApi.complete(kwork.id);
      setKwork((k) => ({ ...k, ...updated }));
      await refreshUser();
    } catch (err) {
      if (err?.response?.status === 402) {
        setNeedTopUp(true);
      }
      setActionError(extractError(err));
    } finally {
      setActing(false);
    }
  }

  function handlePickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Можно прикрепить только изображение");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Размер файла должен быть меньше 10 МБ");
      return;
    }
    setError("");
    setAttachment(file);
    setAttachPreview(URL.createObjectURL(file));
  }

  function clearAttachment() {
    if (attachPreview) URL.revokeObjectURL(attachPreview);
    setAttachment(null);
    setAttachPreview("");
  }

  const upsertMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    chatsApi
      .messages(chatId, 100)
      .then((data) => {
        if (!active) return;
        setMessages([...data].reverse());
        setError("");
      })
      .catch((err) => active && setError(extractError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [chatId]);

  useEffect(() => {
    const ws = new WebSocket(chatSocketUrl(chatId));
    socketRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        upsertMessage(msg);
        onSent?.(msg.text || "Фото");
      } catch {
        return;
      }
    };

    return () => {
      socketRef.current = null;
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    if (chatMeta?.kwork_id) {
      kworksApi
        .get(chatMeta.kwork_id)
        .then(setKwork)
        .catch(() => setKwork(null));
    } else {
      setKwork(null);
    }
  }, [chatMeta?.kwork_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => e.key === "Escape" && setLightbox(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  async function handleSend(e) {
    e.preventDefault();
    const value = text.trim();
    if ((!value && !attachment) || sending) return;
    setSending(true);
    setText("");
    const pendingFile = attachment;
    clearAttachment();
    try {
      let imageId = null;
      if (pendingFile) {
        const uploaded = await chatsApi.uploadImage(chatId, pendingFile);
        imageId = uploaded.image_id;
      }

      const payload = { text: value || null, image_id: imageId };
      const ws = socketRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      } else {
        const msg = await chatsApi.send(chatId, payload);
        setMessages((prev) => [...prev, msg]);
        onSent?.(value || "Фото");
      }
    } catch (err) {
      setError(extractError(err, "Не удалось отправить"));
      setText(value);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <button
          onClick={onBack}
          className="flex size-9 items-center justify-center rounded-lg text-ink-500 hover:bg-slate-100 sm:hidden"
        >
          <ArrowLeft className="size-5" />
        </button>
        {other && (
          <Link to={`/users/${other.id}`} className="flex items-center gap-3">
            <Avatar user={other} name={other?.name} size={42} />
            <div>
              <div className="font-semibold text-ink-900">
                {other?.name || "Пользователь"}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-ink-500">
                <span
                  className={`inline-block size-2 rounded-full ${
                    connected ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
                {connected
                  ? "На связи"
                  : other?.specialization || "Подключение..."}
              </div>
            </div>
          </Link>
        )}
      </div>

      {kwork && (
        <Link
          to={`/tasks/${kwork.id}`}
          className="flex items-center gap-3 border-b border-slate-100 bg-brand-50/50 px-4 py-2.5 text-sm transition hover:bg-brand-50 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
        >
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200 dark:bg-slate-800">
            {kwork.photos?.[0] ? (
              <img
                src={kwork.photos[0]}
                alt={kwork.title}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <ImageIcon className="size-5 text-ink-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-ink-400">
              <Briefcase className="size-3.5 shrink-0 text-brand-500" />
              <span>Обсуждение объявления</span>
            </div>
            <p className="truncate font-semibold text-ink-900">{kwork.title}</p>
          </div>
          <span className="ml-auto shrink-0 font-bold text-ink-900">
            {new Intl.NumberFormat("ru-RU").format(kwork.price)} ₽
          </span>
        </Link>
      )}

      {canComplete && (
        <div className="border-b border-slate-100 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-ink-400">
              К списанию: {formatPrice(kwork.price)}
            </span>
            {needTopUp ? (
              <Button
                variant="accent"
                size="sm"
                onClick={() => setTopUpOpen(true)}
              >
                <Wallet className="size-4" /> Пополнить
                {shortfall > 0 ? ` (${formatPrice(shortfall)})` : ""}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleComplete}
                loading={acting}
              >
                <CheckCircle2 className="size-4" /> Подтвердить выполнение
              </Button>
            )}
          </div>
          {actionError && (
            <div className="mt-2">
              <Alert tone="red">{actionError}</Alert>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 px-4 py-5 scroll-thin">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-brand-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-ink-400">
            <MessageSquare className="size-10 text-brand-200" />
            <p className="mt-3 text-sm">
              Сообщений пока нет. Напишите первым!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUser?.id;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] overflow-hidden rounded-2xl text-sm shadow-sm ${
                    mine
                      ? "rounded-br-md bg-brand-500 text-white"
                      : "rounded-bl-md bg-white text-ink-900 dark:bg-slate-800"
                  }`}
                >
                  {m.image_url && (
                    <button
                      type="button"
                      onClick={() => setLightbox(m.image_url)}
                      className="block w-full cursor-zoom-in"
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL}${m.image_url}`}
                        alt="Вложение"
                        className="max-h-72 w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  )}
                  <div className="px-4 py-2.5">
                    {m.text && (
                      <p className="whitespace-pre-line break-words">{m.text}</p>
                    )}
                    <div
                      className={`mt-1 text-right text-[10px] ${
                        mine ? "text-brand-100" : "text-ink-300"
                      }`}
                    >
                      {formatTime(m.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {isCompleted ? (
        <div className="border-t border-slate-200 px-4 py-5">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="size-4 shrink-0" />
            Задание завершено — больше нельзя писать в этот чат.
          </div>
        </div>
      ) : (
      <div className="border-t border-slate-200">
        {attachPreview && (
          <div className="flex items-center gap-3 px-3 pt-3">
            <div className="relative">
              <img
                src={attachPreview}
                alt="Предпросмотр"
                className="size-16 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={clearAttachment}
                className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-brand-600 text-white shadow"
              >
                <X className="size-3" />
              </button>
            </div>
            <span className="truncate text-xs text-ink-500">
              {attachment?.name}
            </span>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-center gap-2 p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePickFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-500 transition hover:bg-slate-100 hover:text-brand-500"
            title="Прикрепить фото"
          >
            <ImagePlus className="size-5" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:bg-slate-900"
          />
          <button
            type="submit"
            disabled={(!text.trim() && !attachment) || sending}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </button>
        </form>
      </div>
      )}
      {error && (
        <div className="px-4 pb-2 text-xs text-red-500">{error}</div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            title="Закрыть"
          >
            <X className="size-6" />
          </button>
          <img
            src={lightbox}
            alt="Просмотр изображения"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <TopUpModal
        open={topUpOpen}
        suggestedAmount={shortfall}
        onClose={(success) => {
          setTopUpOpen(false);
          if (success) {
            setNeedTopUp(false);
            setActionError("");
          }
        }}
      />
    </>
  );
}
