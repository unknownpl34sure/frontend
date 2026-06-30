import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Briefcase, Star } from "lucide-react";
import {
  authApi,
  skillsApi,
  portfolioApi,
  kworksApi,
  reviewsApi,
  extractError,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Card, Button, Avatar, PageLoader, Alert } from "../components/ui";
import {
  SkillsBlock,
  PortfolioBlock,
  ReviewsBlock,
  UserKworksBlock,
  MemberSince,
} from "../components/ProfileSections";

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [kworks, setKworks] = useState([]);
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const u = await authApi.getUser(id);
        if (!active) return;
        setProfile(u);

        const [sk, pf, all, rt] = await Promise.allSettled([
          skillsApi.forUser(id),
          portfolioApi.forUser(id),
          kworksApi.list({ limit: 100 }),
          reviewsApi.rating(id),
        ]);
        if (!active) return;
        if (sk.status === "fulfilled") setSkills(sk.value);
        if (pf.status === "fulfilled") setPortfolio(pf.value);
        if (all.status === "fulfilled")
          setKworks(all.value.filter((k) => k.user_id === Number(id)));
        if (rt.status === "fulfilled") setRating(rt.value);
      } catch (err) {
        if (active) setError(extractError(err, "Пользователь не найден"));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  if (me && String(me.id) === String(id)) {
    return <Navigate to="/profile" replace />;
  }

  if (loading) return <PageLoader />;

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Alert tone="red">{error || "Пользователь не найден"}</Alert>
        <Button as={Link} to="/tasks" variant="primary" className="mt-6">
          К объявлениям
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/tasks"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-brand-600"
      >
        <ArrowLeft className="size-4" /> К объявлениям
      </Link>

      <Card className="overflow-hidden">
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt="Шапка профиля"
            className="h-40 w-full object-cover sm:h-48"
          />
        ) : (
          <div className="h-40 bg-gradient-to-r from-brand-500 to-brand-700 sm:h-48" />
        )}
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <Avatar user={profile} size={96} className="ring-4 ring-white" />
            {rating && rating.total_reviews > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2">
                <Star className="size-4 fill-current text-accent-500" />
                <span className="font-bold text-ink-900">
                  {rating.rating_percent}%
                </span>
                <span className="text-sm text-ink-500">
                  ({rating.total_reviews})
                </span>
              </div>
            )}
          </div>
          <div className="mt-4">
            <h1 className="font-display text-2xl font-extrabold text-ink-900">
              {profile.name}
            </h1>
            <p className="text-ink-500">@{profile.username}</p>
          </div>

          <div className="mt-5 space-y-3">
            {profile.specialization && (
              <div className="flex items-center gap-2 text-ink-700">
                <Briefcase className="size-4 text-ink-400" />
                {profile.specialization}
              </div>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
              {profile.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="size-4" /> {profile.email}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-4" /> {profile.phone}
                </span>
              )}
            </div>
            {profile.description && (
              <p className="max-w-2xl whitespace-pre-line text-ink-700">
                {profile.description}
              </p>
            )}
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-start sm:justify-between">
              <MemberSince date={profile.created_at} />
              <SkillsBlock skills={skills} editable={false} inline />
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 space-y-6">
        <PortfolioBlock items={portfolio} editable={false} />
        <UserKworksBlock
          kworks={kworks}
          title="Объявления исполнителя"
          emptyText="У пользователя пока нет объявлений"
        />
        <ReviewsBlock userId={Number(id)} allowReview={!!me} />
      </div>
    </div>
  );
}
