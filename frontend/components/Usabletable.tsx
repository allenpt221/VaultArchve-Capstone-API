'use client';
import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";

interface TableActionsProps {
  id: string;
  title: string;
  author: string;
  issue_date: string;
  course: string;
  abstract: string;
  introduction: string;
  discussion: string;
  conclusion: string;
  references: string;
  filename: string;
  isOpen?: () => void; // ← callback from parent
}

export function TableActions({
  id,
  title,
  author,
  issue_date,
  course,
  abstract,
  introduction,
  discussion,
  conclusion,
  references,
  filename,
  isOpen, // ← no local useState
}: TableActionsProps) {

  function shortId(id: string) {
    return id.slice(0, 8) + "…";
  }

  function initials(name: string) {
    return name
      .split(/[\s,]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  }

  const contentFields = [introduction, discussion, conclusion, references];

  return (
    <TableRow>
      <TableCell>
        <span
          className="inline-block max-w-20 truncate rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
          title={id}
        >
          {shortId(id)}
        </span>
      </TableCell>

      <TableCell className="max-w-30 truncate font-medium" title={title}>
        {title}
      </TableCell>

      <TableCell className="max-w-30 truncate font-medium">
        {abstract}
      </TableCell>

      <TableCell className="text-left">
        <span className="inline-flex items-center justify-end gap-1.5">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[9px] font-medium text-blue-700">
            {initials(author)}
          </span>
          <span className="text-xs text-muted-foreground">{author}</span>
        </span>
      </TableCell>

      <TableCell className="text-left text-xs text-muted-foreground">
        {new Date(issue_date).getFullYear()}
      </TableCell>

      <TableCell className="text-left">
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          {course}
        </span>
      </TableCell>

      {contentFields.map((val, i) => (
        <TableCell key={i} className="text-left">
          {val === "N/A" ? (
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              N/A
            </span>
          ) : (
            <span
              className="inline-block max-w-25 truncate text-xs text-muted-foreground"
              title={val}
            >
              {val}
            </span>
          )}
        </TableCell>
      ))}

      <TableCell className="text-left">
        <span className="inline-block rounded-full truncate max-w-15 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          {filename}
        </span>
      </TableCell>

      <TableCell className="text-left">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontalIcon />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="cursor-pointer py-2"
              onClick={isOpen} // ← calls parent's setSelectedThesis(item)
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2">Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="cursor-pointer py-2">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}