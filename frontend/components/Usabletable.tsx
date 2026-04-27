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
          className="inline-block max-w-[80px] truncate rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
          title={id}
        >
          {shortId(id)}
        </span>
      </TableCell>

      <TableCell className="max-w-[210px] truncate font-medium" title={title}>
        {title}
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
        {issue_date}
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
              className="inline-block max-w-[100px] truncate text-xs text-muted-foreground"
              title={val}
            >
              {val}
            </span>
          )}
        </TableCell>
      ))}

      <TableCell className="text-left">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontalIcon />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}