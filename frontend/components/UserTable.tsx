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

interface UserTableActionsProps {
  id: string;
  firstname: string;
  lastname: string;
  middle?: string;
  email: string;
  role: string;
  status: string;
  isDisable?: (id: string) => void;
  DeleteUser: (id: string) => void;
}

export function UserTableActions({
  id,
  firstname,
  lastname,
  middle,
  email,
  role,
  status,
  isDisable,
  DeleteUser,
}: UserTableActionsProps) {

  // guard against undefined id
  function shortId(id: string) {
    if (!id) return '—'
    return id.slice(0, 8) + "…";
  }

  // guard against undefined/empty name parts
  function initials(first: string, last: string) {
    if (!first && !last) return '?'
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
  }

  // colored badge per registration status
  function statusStyles(status: string) {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'registered':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'disabled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  const fullName = [firstname, middle, lastname].filter(Boolean).join(' ');

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

      <TableCell className="text-left">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[9px] font-medium text-blue-700">
            {initials(firstname, lastname)}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-30" title={fullName}>
            {fullName || '—'}
          </span>
        </span>
      </TableCell>

      <TableCell className="max-w-40 truncate text-xs text-muted-foreground" title={email}>
        {email}
      </TableCell>

      <TableCell className="text-left">
        <span className="inline-block rounded-full truncate max-w-30 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          {role}
        </span>
      </TableCell>

      <TableCell className="text-left">
        <span className={`inline-block rounded-full truncate max-w-25 px-2 py-0.5 text-xs font-medium ${statusStyles(status)}`}>
          {status || 'Unknown'}
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
              onClick={() => isDisable?.(id)}
            >
              {status?.toLowerCase() === 'disabled' ? 'Active' : 'Disable'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="cursor-pointer py-2"
              onClick={() => DeleteUser(id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}