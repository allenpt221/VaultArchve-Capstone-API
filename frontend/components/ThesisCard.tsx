import { authUserStore } from '@/Stores/authStores';
import { Bookmark, Calendar, Eye, MoveRight, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ThesisProps {
  id: string;
  course: string;
  title: string;
  author: string;
  issue_date: string;
  abstract: string;
  views: number;
  saves?: number;
  onView?: () => void;
  onAuthFail?: () => void;
  isClickable?: boolean;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

function formatText(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ThesisCard({
  id,
  course,
  title,
  author,
  issue_date,
  abstract,
  views,
  saves = 0,
  onView,
  onAuthFail,
  isClickable,
  isSaved,
  onToggleSave,
}: ThesisProps) {
  const router = useRouter();
  const { user } = authUserStore();

  const handleClick = () => {
    if (!isClickable) return;

    if (!user) {
      onAuthFail?.();
      return;
    }

    onView?.();
    router.push(`/browse/${id}`);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      onAuthFail?.();
      return;
    }

    onToggleSave?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`group border hover:shadow-lg hover:border-amber-400 p-4 rounded-lg shadow 
      flex flex-col gap-2
      ${isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-70 pointer-events-none"}`}
    >
      <div className="flex justify-between">
        <span className="bg-amber-300/40 px-3 py-0.5 rounded-full">
          <p className="text-xs text-black/90">{formatText(course)}</p>
        </span>

        <div className="flex items-center gap-3">
          <span className="flex gap-1 text-xs items-center text-black/60">
            <Eye size={14} />
            {views}
          </span>

          <button
            onClick={handleSaveClick}
            className="flex items-center gap-1 text-xs text-black/60 hover:text-amber-400 transition-colors"
            aria-label={isSaved ? "Unsave thesis" : "Save thesis"}
          >
            <Bookmark
              size={14}
              className={isSaved ? "fill-amber-400 text-amber-400" : ""}
            />
            {saves}
          </button>
        </div>
      </div>

      <p className="font-semibold text-base group-hover:text-amber-400">{title}</p>

      <div className="flex gap-2">
        <span className="flex gap-2 items-center text-black/70">
          <Users size={14} />
          <p className="text-xs">{author ? formatText(author) : 'N/a'}</p>
        </span>
        <span className="flex gap-2 items-center text-black/70">
          <Calendar size={14} />
          <p className="text-xs">{new Date(issue_date).getFullYear()}</p>
        </span>
      </div>

      <div className="text-sm text-black/60 line-clamp-4">
        {abstract}
      </div>

      <span className="text-amber-400 font-semibold text-sm flex items-center gap-2 mt-auto pt-1">
        Read More <MoveRight size={14} />
      </span>
    </div>
  );
}

export default ThesisCard;