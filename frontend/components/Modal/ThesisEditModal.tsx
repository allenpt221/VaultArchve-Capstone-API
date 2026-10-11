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
import { repoStores } from '@/Stores/repoStores';

interface ThesisEditModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  id?: string;
  title?: string;
  author?: string;
  issue_date?: string;
  course?: string;
  abstract?: string;
  keywords?: string;
  file_url?: string;

  // No longer used by this modal. Kept optional so existing parents that still
  // pass them keep compiling; you can stop passing them and delete these lines.
  introduction?: string;
  scope_and_limitation?: string;
  conclusion?: string;
  recommendation?: string;
  entrep_intro?: string;
  entrep_action_plan?: string;
  entrep_market_product_description?: string;
  entrep_survey_result?: string;
  entrep_target_market?: string;
  entrep_product?: string;
  entrep_production?: string;
}

const normalize = (val?: string) => (val === 'N/A' ? '' : (val ?? ''));

function ThesisEditModal({
  isOpen,
  onClose,
  id,
  title,
  author,
  issue_date,
  course,
  abstract,
  keywords,
  file_url,
}: ThesisEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateThesis, loading } = repoStores();

  const [formData, setFormData] = useState({
    title: title ?? '',
    author: author ?? '',
    course: course ?? '',
    thesis_abstract: normalize(abstract),
    keywords: normalize(keywords),
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    issue_date ? new Date(issue_date) : undefined
  );

  if (!isOpen) return null;

  const handleChange = (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!id) return;

    const issueDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : (issue_date ?? '');

    await updateThesis({
      id,
      title: formData.title,
      author: formData.author,
      course: formData.course,
      issueDate,
      thesis_abstract: formData.thesis_abstract,
      keywords: formData.keywords.trim(),
      file: selectedFile ?? undefined,
    });

    onClose?.();
  };

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
            <Input id="title" value={formData.title} onChange={handleChange('title')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="author">Author</Label>
            <Input id="author" value={formData.author} onChange={handleChange('author')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course">Course</Label>
              <Select
                value={formData.course}
                onValueChange={(val) => setFormData(prev => ({ ...prev, course: val }))}
              >
                <SelectTrigger id="course" className="w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accountancy">Bachelor of Science in Accountancy</SelectItem>
                  <SelectItem value="Accounting Information System">Bachelor of Science in Accounting Information System</SelectItem>
                  <SelectItem value="Public Administration">Bachelor of Science in Public Administration</SelectItem>
                  <SelectItem value="Entrepreneurship">Bachelor of Science in Entrepreneurship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
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
              value={formData.thesis_abstract}
              onChange={handleChange('thesis_abstract')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="keywords">
              Keywords
            </Label>
            <Input
              id="keywords"
              placeholder="e.g., cost accounting, small businesses, inventory management"
              value={formData.keywords}
              onChange={handleChange('keywords')}
            />
            <p className="text-xs text-muted-foreground">Separate each keyword with a comma</p>
          </div>

          {/* PDF Upload */}
          <div className="flex flex-col gap-1.5">
            <Label>Thesis PDF</Label>

            {file_url && !selectedFile && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/40 text-sm">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate flex-1 text-muted-foreground">
                  {file_url.split('/').pop()}
                </span>
              </div>
            )}

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

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border hover:border-blue-400 hover:bg-blue-50 text-sm text-muted-foreground hover:text-blue-600 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              {selectedFile || file_url ? 'Replace PDF' : 'Upload PDF'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
            />
          </div>

        </CardContent>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </Card>
    </div>
  );
}

export default ThesisEditModal;