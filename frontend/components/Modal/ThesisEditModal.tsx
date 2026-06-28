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
  introduction?: string;
  discussion?: string;
  conclusion?: string;
  references?: string;
  file_url?: string;
  // Entrepreneurship fields
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
  introduction,
  discussion,
  conclusion,
  references,
  file_url,
  entrep_intro,
  entrep_action_plan,
  entrep_market_product_description,
  entrep_survey_result,
  entrep_target_market,
  entrep_product,
  entrep_production,
}: ThesisEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateThesis, loading } = repoStores();

  const [formData, setFormData] = useState({
    title: title ?? '',
    author: author ?? '',
    course: course ?? '',
    thesis_abstract: normalize(abstract),
    thesis_introduction: normalize(introduction),
    thesis_discussion: normalize(discussion),
    thesis_conclusion: normalize(conclusion),
    thesis_references: normalize(references),
    entrep_intro: normalize(entrep_intro),
    entrep_action_plan: normalize(entrep_action_plan),
    entrep_market_product_description: normalize(entrep_market_product_description),
    entrep_survey_result: normalize(entrep_survey_result),
    entrep_target_market: normalize(entrep_target_market),
    entrep_product: normalize(entrep_product),
    entrep_production: normalize(entrep_production),
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    issue_date ? new Date(issue_date) : undefined
  );

  if (!isOpen) return null;

  const handleChange = (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const isEntrepreneurship = formData.course === 'Entrepreneurship';

  const handleSave = async () => {
    if (!id) return;

    const issueDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : (issue_date ?? '');

    const base = {
      id,
      title: formData.title,
      author: formData.author,
      course: formData.course,
      issueDate,
      file: selectedFile ?? undefined,
    };

    if (isEntrepreneurship) {
      await updateThesis({
        ...base,
        type: 'entrepreneurship',
        entrep_intro: formData.entrep_intro,
        entrep_action_plan: formData.entrep_action_plan,
        entrep_market_product_description: formData.entrep_market_product_description,
        entrep_survey_result: formData.entrep_survey_result,
        entrep_target_market: formData.entrep_target_market,
        entrep_product: formData.entrep_product,
        entrep_production: formData.entrep_production,
      });
    } else {
      await updateThesis({
        ...base,
        type: 'standard',
        thesis_abstract: formData.thesis_abstract,
        thesis_introduction: formData.thesis_introduction,
        thesis_discussion: formData.thesis_discussion,
        thesis_conclusion: formData.thesis_conclusion,
        thesis_references: formData.thesis_references,
      });
    }

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

          {isEntrepreneurship ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="entrep_intro">Introduction</Label>
                <Textarea
                  id="entrep_intro"
                  className="resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
                  value={formData.entrep_intro}
                  onChange={handleChange('entrep_intro')}
                  placeholder={entrep_intro === 'N/A' ? 'N/A' : ''}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="entrep_action_plan">Action Plan</Label>
                <Textarea
                  id="entrep_action_plan"
                  className="resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
                  value={formData.entrep_action_plan}
                  onChange={handleChange('entrep_action_plan')}
                  placeholder={entrep_action_plan === 'N/A' ? 'N/A' : ''}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="entrep_market_product_description">Market / Product Description</Label>
                <Textarea
                  id="entrep_market_product_description"
                  className="resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
                  value={formData.entrep_market_product_description}
                  onChange={handleChange('entrep_market_product_description')}
                  placeholder={entrep_market_product_description === 'N/A' ? 'N/A' : ''}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="entrep_survey_result">Survey Result</Label>
                <Textarea
                  id="entrep_survey_result"
                  className="resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
                  value={formData.entrep_survey_result}
                  onChange={handleChange('entrep_survey_result')}
                  placeholder={entrep_survey_result === 'N/A' ? 'N/A' : ''}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="entrep_target_market">Target Market</Label>
                <Textarea
                  id="entrep_target_market"
                  className="resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
                  value={formData.entrep_target_market}
                  onChange={handleChange('entrep_target_market')}
                  placeholder={entrep_target_market === 'N/A' ? 'N/A' : ''}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="entrep_product">Product</Label>
                <Textarea
                  id="entrep_product"
                  className="resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
                  value={formData.entrep_product}
                  onChange={handleChange('entrep_product')}
                  placeholder={entrep_product === 'N/A' ? 'N/A' : ''}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="entrep_production">Production</Label>
                <Textarea
                  id="entrep_production"
                  className="resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
                  value={formData.entrep_production}
                  onChange={handleChange('entrep_production')}
                  placeholder={entrep_production === 'N/A' ? 'N/A' : ''}
                />
              </div>
            </>
          ) : (
            <>
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
                <Label htmlFor="introduction">Introduction</Label>
                <Textarea
                  id="introduction"
                  className="resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
                  value={formData.thesis_introduction}
                  onChange={handleChange('thesis_introduction')}
                  placeholder={introduction === 'N/A' ? 'N/A' : ''}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="discussion">Discussion</Label>
                <Textarea
                  id="discussion"
                  className="resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
                  value={formData.thesis_discussion}
                  onChange={handleChange('thesis_discussion')}
                  placeholder={discussion === 'N/A' ? 'N/A' : ''}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="conclusion">Conclusion</Label>
                <Textarea
                  id="conclusion"
                  className="resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
                  value={formData.thesis_conclusion}
                  onChange={handleChange('thesis_conclusion')}
                  placeholder={conclusion === 'N/A' ? 'N/A' : ''}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="references">References</Label>
                <Textarea
                  id="references"
                  className="resize-none overflow-hidden"
                  style={{ height: 'auto', minHeight: '2.5rem', fieldSizing: 'content' } as React.CSSProperties}
                  value={formData.thesis_references}
                  onChange={handleChange('thesis_references')}
                  placeholder={references === 'N/A' ? 'N/A' : ''}
                />
              </div>
            </>
          )}

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