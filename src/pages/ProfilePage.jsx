import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Pencil,
  Mail,
  Phone,
  Briefcase,
  Plus,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import {
  skillsApi,
  portfolioApi,
  kworksApi,
  authApi,
  extractError,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { isValidPhone } from "../lib/format";
import { Card, Button, Avatar, Input, Textarea, Alert } from "../components/ui";
import {
  SkillsBlock,
  PortfolioBlock,
  ReviewsBlock,
  UserKworksBlock,
  MemberSince,
} from "../components/ProfileSections";


export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileRef = useRef(null);
  const bannerRef = useRef(null);

  const [skills, setSkills] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [myKworks, setMyKworks] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [error, setError] = useState("");

  const loadSkills = useCallback(async () => {
    try {
      setSkills(await skillsApi.my());
    } catch {
      setSkills([]);
    }
  }, []);

  const loadPortfolio = useCallback(async () => {
    try {
      setPortfolio(await portfolioApi.my());
    } catch {
      setPortfolio([]);
    }
  }, []);

  useEffect(() => {
    loadSkills();
    loadPortfolio();
    if (user?.id) {
      kworksApi
        .list({ limit: 100 })
        .then((all) => setMyKworks(all.filter((k) => k.user_id === user.id)))
        .catch(() => setMyKworks([]));
    }
  }, [loadSkills, loadPortfolio, user?.id]);

  function startEdit() {
    setForm({
      name: user.name || "",
      phone: user.phone || "",
      specialization: user.specialization || "",
      description: user.description || "",
    });
    setEditing(true);
  }

  async function saveProfile(e) {
    e.preventDefault();
    const phone = form.phone.trim();
    if (!isValidPhone(phone)) {
      setError("Введите корректный номер телефона (10–15 цифр, например +7 999 123-45-67)");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await authApi.updateMe({
        name: form.name.trim(),
        phone: phone || null,
        specialization: form.specialization.trim() || null,
        description: form.description.trim() || null,
      });
      await refreshUser();
      setEditing(false);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError("");
    try {
      await authApi.uploadAvatar(file);
      await refreshUser();
    } catch (err) {
      setError(extractError(err, "Не удалось загрузить аватар"));
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleBanner(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setError("");
    try {
      await authApi.uploadBanner(file);
      await refreshUser();
    } catch (err) {
      setError(extractError(err, "Не удалось загрузить шапку"));
    } finally {
      setUploadingBanner(false);
      if (bannerRef.current) bannerRef.current.value = "";
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {error && <Alert tone="red" className="mb-4">{error}</Alert>}

      <Card className="overflow-hidden">
        <div className="group relative h-40 sm:h-48">
          {user.banner_url ? (
            <img
              src={user.banner_url}
              alt="Шапка профиля"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-r from-brand-500 to-brand-700">
              <ImageIcon className="size-10 text-white/40" />
            </div>
          )}
          <button
            onClick={() => bannerRef.current?.click()}
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-black/55"
            title="Сменить шапку"
          >
            {uploadingBanner ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            Шапка
          </button>
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBanner}
          />
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <div className="relative">
              <Avatar user={user} size={96} className="ring-4 ring-white" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-brand-500 text-white ring-2 ring-white transition hover:bg-brand-600"
                title="Сменить аватар"
              >
                {uploadingAvatar ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatar}
              />
            </div>
            {!editing && (
              <Button variant="outline" onClick={startEdit}>
                <Pencil className="size-4" /> Редактировать
              </Button>
            )}
          </div>
          <div className="mt-4">
            <h1 className="font-display text-2xl font-extrabold text-ink-900">
              {user.name}
            </h1>
            <p className="text-ink-500">@{user.username}</p>
          </div>

          {editing ? (
            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Имя"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Телефон"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="+7..."
                />
              </div>
              <Input
                label="Специализация"
                value={form.specialization}
                onChange={(e) =>
                  setForm((f) => ({ ...f, specialization: e.target.value }))
                }
                placeholder="Веб-разработчик"
              />
              <Textarea
                label="О себе"
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Расскажите о своём опыте и услугах..."
              />
              <div className="flex gap-2">
                <Button type="submit" loading={saving}>
                  <Check className="size-4" /> Сохранить
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                >
                  <X className="size-4" /> Отмена
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-5 space-y-3">
              {user.specialization && (
                <div className="flex items-center gap-2 text-ink-700">
                  <Briefcase className="size-4 text-ink-400" />
                  {user.specialization}
                </div>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-4" /> {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-4" /> {user.phone}
                  </span>
                )}
              </div>
              {user.description && (
                <p className="max-w-2xl whitespace-pre-line text-ink-700">
                  {user.description}
                </p>
              )}
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-start sm:justify-between">
                <MemberSince date={user.created_at} />
                <SkillsBlock
                  skills={skills}
                  editable
                  onChanged={loadSkills}
                  inline
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6 space-y-6">
        <PortfolioBlock
          items={portfolio}
          editable
          onChanged={loadPortfolio}
        />
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink-900">Мои объявления</h2>
            <Button as={Link} to="/tasks/new" variant="subtle" size="sm">
              <Plus className="size-4" /> Создать
            </Button>
          </div>
          <UserKworksBlock
            kworks={myKworks}
            title=""
            emptyText="Вы ещё не размещали объявлений. Создайте первое!"
          />
        </div>
        <ReviewsBlock userId={user.id} allowReview={false} />
      </div>
    </div>
  );
}
