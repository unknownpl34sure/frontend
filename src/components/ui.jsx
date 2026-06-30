import { Loader2 } from "lucide-react";
import { initials, colorFromString } from "../lib/format";

export function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none";
  const variants = {
    primary:
      "bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/30 active:scale-[.98]",
    accent:
      "bg-accent-500 text-white hover:bg-accent-600 shadow-sm shadow-accent-500/40 active:scale-[.98]",
    dark: "bg-slate-900 text-white hover:bg-slate-800 active:scale-[.98] dark:bg-slate-700 dark:hover:bg-slate-600",
    outline:
      "border border-slate-300 bg-white text-ink-700 hover:bg-slate-50 hover:border-slate-400 dark:bg-slate-900",
    ghost: "text-ink-700 hover:bg-slate-100",
    danger:
      "bg-red-500 text-white hover:bg-red-600 active:scale-[.98] shadow-sm shadow-red-500/30",
    subtle:
      "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25",
  };
  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-6 py-3",
  };
  return (
    <Comp
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Comp>
  );
}

export function Input({ label, error, className = "", id, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
        </span>
      )}
      <input
        id={id}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition focus:outline-none focus:ring-2 dark:bg-slate-900 ${
          error
            ? "border-red-400 focus:ring-red-200"
            : "border-slate-300 focus:border-brand-400 focus:ring-brand-100"
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function Textarea({ label, error, className = "", ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
        </span>
      )}
      <textarea
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition focus:outline-none focus:ring-2 dark:bg-slate-900 ${
          error
            ? "border-red-400 focus:ring-red-200"
            : "border-slate-300 focus:border-brand-400 focus:ring-brand-100"
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50 dark:bg-slate-900 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

const TONES = {
  mint: "bg-mint-500/10 text-mint-500 ring-1 ring-mint-500/20",
  amber: "bg-accent-500/10 text-accent-500 ring-1 ring-accent-500/20",
  gray: "bg-slate-100 text-ink-500 ring-1 ring-slate-200",
  brand:
    "bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/30",
  red: "bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30",
};

export function Badge({ tone = "gray", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Spinner({ className = "" }) {
  return <Loader2 className={`size-5 animate-spin text-brand-500 ${className}`} />;
}

export function PageLoader({ label = "Загрузка..." }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-500">
      <Spinner className="size-8" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Avatar({ user, name, src, size = 40, className = "" }) {
  const displayName = name || user?.name || user?.username || "?";
  const imgSrc = src || user?.avatar_url;
  const style = { width: size, height: size };
  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={displayName}
        style={style}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 ${className}`}
      />
    );
  }
  return (
    <div
      style={{ ...style, backgroundColor: colorFromString(displayName) }}
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ring-2 ring-white dark:ring-slate-900 ${className}`}
    >
      <span style={{ fontSize: size * 0.4 }}>{initials(displayName)}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center dark:bg-slate-900/60">
      {Icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300">
          <Icon className="size-7" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "red", children, className = "" }) {
  const tones = {
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
    green: "bg-mint-500/10 text-mint-500 border-mint-500/20",
    brand:
      "bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30",
  };
  if (!children) return null;
  return (
    <div
      className={`rounded-xl border px-3.5 py-2.5 text-sm ${tones[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
