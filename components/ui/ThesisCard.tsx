import { Calendar, Eye, MoveRight, Users } from 'lucide-react';

interface ThesisProps{
  course: string;
  title: string;
  author: string;
  issue_date: string;
  abstract: string;
  views: number;
}

function formatText(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ThesisCard({ course, title, author, issue_date, abstract, views } : ThesisProps ) {
  return (
            <div className="group border hover:shadow-lg hover:border-amber-400 p-4 rounded-lg shadow space-y-2 cursor-pointer">
              <div className="flex justify-between">
                <span className="bg-amber-300/40 px-3 py-0.5 rounded-full">
                    <p className="text-xs  text-black/90">{formatText(course)}</p>
                </span>
                <span className="flex gap-1 text-xs items-center text-black/60">
                  <Eye size={14} />
                  {views}
                </span>

              </div>
              <p className="font-semibold text-base group-hover:text-amber-400">{title}</p>
              <div className="flex gap-2">
                <span className="flex gap-2 items-center text-black/70">
                  <Users size={14}/>
                  <p className="text-xs">{formatText(author)}</p>
                </span>
                <span className="flex gap-2 items-center text-black/70">
                  <Calendar  size={14}/>
                  <p className="text-xs">{new Date(issue_date).getFullYear()}</p>
                </span>

              </div>
              <div className="text-sm text-black/60 line-clamp-4">
                {abstract}
              </div>

              <span className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                Read More <MoveRight size={14}/>
              </span>
            </div>
  )
}

export default ThesisCard