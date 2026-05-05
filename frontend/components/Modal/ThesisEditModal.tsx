'use client';

import { useRef, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Paperclip, X, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';

interface ThesisEditModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  id?: string;
  title?: string;
  author?: string;
  issue_date?: string;
  course?: string;
  abstract?: string;
  introduction?: string;
  discussion?: string;
  conclusion?: string;
  references?: string;
  file_url?: string;
}

function ThesisEditModal({
  isOpen,
  onClose,
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
  file_url,
}: ThesisEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    issue_date ? new Date(issue_date) : undefined
  );

  if (!isOpen) return null;

  return (
    <div className="fixed bg-black/50 inset-0 flex justify-center items-center backdrop-blur-sm z-50">
      <Card className="w-full max-w-5xl h-160 flex flex-col gap-0 rounded-xl shadow-xl p-0">

        {/* Header */}
        <CardHeader className="px-6 py-4 shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Edit Thesis</CardTitle>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </CardHeader>

        {/* Fields */}
        <CardContent className="flex flex-col gap-3 overflow-y-auto flex-1 px-6 py-4">

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" defaultValue={title} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="author">Author</Label>
            <Input id="author" defaultValue={author} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course">Course</Label>
              <Select defaultValue={course}>
                <SelectTrigger id="course" className="w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accountancy">Bachelor of Science in Accountancy</SelectItem>
                  <SelectItem value="Accounting of Information System">Bachelor of Science in Accounting of Information System</SelectItem>
                  <SelectItem value="Public Administration">Bachelor of Science in Public Administration</SelectItem>
                  <SelectItem value="Entrepreneurship">Bachelor of Science in Entrepreneurship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              className="resize-none overflow-hidden"
              style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
              defaultValue={abstract}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="introduction">Introduction</Label>
            <Textarea
              id="introduction"
              className="resize-none overflow-hidden"
              style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
              defaultValue={introduction === 'N/A' ? '' : introduction}
              placeholder={introduction === 'N/A' ? 'N/A' : ''}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="discussion">Discussion</Label>
            <Textarea
              id="discussion"
              className="resize-none overflow-hidden"
              style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
              defaultValue={discussion === 'N/A' ? '' : discussion}
              placeholder={discussion === 'N/A' ? 'N/A' : ''}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conclusion">Conclusion</Label>
            <Textarea
              id="conclusion"
              className="resize-none overflow-hidden"
              style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
              defaultValue={conclusion === 'N/A' ? '' : conclusion}
              placeholder={conclusion === 'N/A' ? 'N/A' : ''}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="references">References</Label>
            <Textarea
              id="references"
              className="resize-none overflow-hidden"
              style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
              defaultValue={references === 'N/A' ? '' : references}
              placeholder={references === 'N/A' ? 'N/A' : ''}
            />
          </div>

          {/* PDF Upload */}
          <div className="flex flex-col gap-1.5">
            <Label>Thesis PDF</Label>

            {/* Current file */}
            {file_url && !selectedFile && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/40 text-sm">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate flex-1 text-muted-foreground">
                  {file_url.split('/').pop()}
                </span>
              </div>
            )}

            {/* New file selected */}
            {selectedFile && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-blue-50 text-sm">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate flex-1 text-blue-700">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border hover:border-blue-400 hover:bg-blue-50 text-sm text-muted-foreground hover:text-blue-600 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              {selectedFile ? 'Replace PDF' : file_url ? 'Replace PDF' : 'Upload PDF'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setSelectedFile(file)
              }}
            />
          </div>

        </CardContent>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md text-sm bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>

      </Card>
    </div>
  );
}

export default ThesisEditModal;