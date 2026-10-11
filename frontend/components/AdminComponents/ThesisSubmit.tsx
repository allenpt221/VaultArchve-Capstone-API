import { repoStores } from '@/Stores/repoStores'
import React, { useState, useRef } from 'react'

import { format } from 'date-fns'
import {
  CalendarIcon,
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// "YYYY-MM-DD" -> local Date (avoids the UTC off-by-one from new Date("YYYY-MM-DD"))
const parseLocalDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function ThesisSubmit() {
  const { submitThesis, extractThesisInfo, loading } = repoStores()

  const [course, setCourse] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [abstract, setAbstract] = useState('')
  const [keywords, setKeywords] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [extracting, setExtracting] = useState(false)
  const [extractWarning, setExtractWarning] = useState('')
  const [extractSource, setExtractSource] = useState<'abstract' | 'introduction' | null>(null)
  const [keywordsSource, setKeywordsSource] = useState<'printed' | 'generated' | null>(null)

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Remembers what was auto-filled, so picking a different PDF replaces
  // auto-filled values but never overwrites something the user typed.
  const autoFilled = useRef<Record<string, string>>({})
  const extractRunId = useRef(0)

  const mergeDetected = (key: string, prev: string, detected: string | null) => {
    const wasAutoFilled = !!prev && prev === autoFilled.current[key]
    if (!prev || wasAutoFilled) {
      autoFilled.current[key] = detected ?? ''
      return detected ?? ''
    }
    return prev
  }

  // Keywords are optional, so they are not part of this required-field check
  const isFieldRequired = (field: string) => {
    if (field === 'file') return touched['file'] && !file

    const values: Record<string, string> = { title, author, course, issueDate, abstract }
    return touched[field] && !values[field]
  }

  const resetForm = () => {
    setCourse('')
    setTitle('')
    setAuthor('')
    setIssueDate('')
    setAbstract('')
    setKeywords('')
    setFile(null)

    setExtractWarning('')
    setExtractSource(null)
    setKeywordsSource(null)
    autoFilled.current = {}
    extractRunId.current += 1

    setTouched({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null

    setFile(selected)
    setTouched((prev) => ({ ...prev, file: false }))
    setExtractWarning('')
    setExtractSource(null)
    setKeywordsSource(null)
    setError('')

    const runId = ++extractRunId.current

    if (!selected) {
      setExtracting(false)
      return
    }

    const isPdf =
      selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      setExtracting(false)
      setExtractWarning(
        'Details can only be detected from PDF files. Please fill them in manually.'
      )
      return
    }

    setExtracting(true)

    try {
      const info = await extractThesisInfo(selected)

      // A newer file was picked while this one was still being read
      if (runId !== extractRunId.current) return

      setTitle((prev) => mergeDetected('title', prev, info.title))
      setAuthor((prev) => mergeDetected('author', prev, info.author))
      setCourse((prev) => mergeDetected('course', prev, info.course))
      setIssueDate((prev) => mergeDetected('issueDate', prev, info.issue_date))
      setAbstract((prev) => mergeDetected('abstract', prev, info.abstract))
      setKeywords((prev) => mergeDetected('keywords', prev, info.keywords))
      setExtractSource(info.source)
      setKeywordsSource(info.keywords ? info.keywords_source : null)

      const missing: string[] = []
      if (!info.title) missing.push('title')
      if (!info.author) missing.push('author')
      if (!info.course) missing.push('course')
      if (!info.issue_date) missing.push('submission date')
      if (!info.abstract) missing.push('abstract')
      if (!info.keywords) missing.push('keywords')

      if (missing.length > 0) {
        setExtractWarning(
          `Couldn't detect the ${missing.join(', ')}. Please fill in ${missing.length > 1 ? 'those' : 'that'} manually.`
        )
      }
    } catch (err: any) {
      if (runId !== extractRunId.current) return
      setExtractWarning(
        err?.response?.data?.message ||
          "Couldn't read details from this PDF. Please fill them in manually."
      )
    } finally {
      if (runId === extractRunId.current) setExtracting(false)
    }
  }

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const allFields = { title, author, course, issueDate, abstract }

    const newTouched = Object.keys(allFields).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, boolean>)
    newTouched['file'] = true
    setTouched(newTouched)

    if (!file) {
      setError('Please upload your thesis file (PDF or DOCX).')
      return
    }

    const hasMissingField = Object.values(allFields).some((v) => !v)
    if (hasMissingField) {
      setError('Please fill in all required fields.')
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const isValidType =
      allowedTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.docx')

    if (!isValidType) {
      setError('Only PDF and DOCX files are allowed. Please convert your file and try again.')
      return
    }

    try {
      await submitThesis({
        course,
        title,
        author,
        issueDate,
        thesis_abstract: abstract,
        keywords: keywords.trim(),
        file,
      })

      setSuccess(true)
      resetForm()

      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Failed to submit thesis. Please check your connection and try again.'
      )
    }
  }

  const handleFieldBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-6 md:py-4">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 text-center md:text-left">
          <Badge variant="outline" className="mb-3 bg-white/50 backdrop-blur-sm border-amber-200 text-amber-700">
            Graduate Studies
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold ">
            Submit Thesis
          </h1>
          <p className="text-amber-700/70 mt-3 text-lg">
            Upload your PDF and we'll fill in the details for you
          </p>
        </div>

        {/* ALERTS */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              ✓ Thesis submitted successfully! You'll receive a confirmation email shortly.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* MAIN FORM */}
        <Card className="shadow border-0 overflow-hidden px-3 py-4">
          <CardHeader className="bg-white border-b pb-6">
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-amber-600" />
              Thesis Submission Form
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              All fields marked with <span className="text-red-500">*</span> are required
            </p>
          </CardHeader>

          <CardContent className="pt-8 space-y-8">
            {/* FILE UPLOAD SECTION (first, because it fills in the rest) */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-amber-500 rounded-full" />
                Document Upload
              </h3>

              <div
                onClick={() => !extracting && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 bg-white
                  ${extracting ? 'cursor-wait' : 'cursor-pointer'}
                  ${file
                    ? 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                    : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50/50'
                  }`}
              >
                {extracting ? (
                  <Loader2 className="mx-auto h-12 w-12 mb-3 text-amber-600 animate-spin" />
                ) : (
                  <UploadCloud className={`mx-auto h-12 w-12 mb-3 ${file ? 'text-amber-600' : 'text-gray-400'}`} />
                )}

                <p className="text-base font-medium text-gray-700">
                  {extracting
                    ? 'Reading your thesis...'
                    : file
                      ? 'File selected'
                      : 'Click to upload your thesis document'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {extracting
                    ? 'Detecting the title, author, course, date, abstract and keywords'
                    : file
                      ? file.name
                      : 'PDF or DOCX format, max 50MB'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Your file will be securely stored and archived
                </p>

                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {file && !extracting && (
                  <Badge variant="secondary" className="mt-4 bg-amber-100 text-amber-700 max-w-full truncate">
                    ✓ {file.name}
                  </Badge>
                )}
              </div>

              {isFieldRequired('file') && (
                <p className="text-xs text-red-500 mt-2">Please upload your thesis file</p>
              )}

              {extractWarning && (
                <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{extractWarning}</AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {/* BASIC INFORMATION SECTION */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-amber-500 rounded-full" />
                Thesis Information
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                  Auto-detected, please review
                </Badge>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Thesis Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Machine Learning Approaches to Climate Prediction"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => handleFieldBlur('title')}
                    disabled={extracting}
                    className={`focus-visible:ring-amber-500 h-[2.4rem] ${isFieldRequired('title') ? 'border-red-300 focus:border-red-500' : ''}`}
                  />
                  {isFieldRequired('title') && (
                    <p className="text-xs text-red-500 mt-1">Title is required</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className='w-full'>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Author Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Full name as it appears on your thesis"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      onBlur={() => handleFieldBlur('author')}
                      disabled={extracting}
                      className={`focus-visible:ring-amber-500 h-[2.4rem] ${isFieldRequired('author') ? 'border-red-300' : ''}`}
                    />
                    {isFieldRequired('author') && (
                      <p className="text-xs text-red-500 mt-1">Author name is required</p>
                    )}
                  </div>

                  <div className='sm:w-240'>
                    <label className="text-sm w-full font-medium text-gray-700 block mb-2">
                      Course/Department <span className="text-red-500">*</span>
                    </label>
                    <Select value={course} onValueChange={setCourse} disabled={extracting}>
                      <SelectTrigger className={`focus:ring-amber-500 ${isFieldRequired('course') ? 'border-red-300' : ''}`}>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Accountancy">Bachelor of Science in Accountancy</SelectItem>
                        <SelectItem value="Accounting Information System">Bachelor of Science in Accounting Information System</SelectItem>
                        <SelectItem value="Public Administration">Bachelor of Science in Public Administration</SelectItem>
                        <SelectItem value="Entrepreneurship">Bachelor of Science in Entrepreneurship</SelectItem>
                      </SelectContent>
                    </Select>
                    {isFieldRequired('course') && (
                      <p className="text-xs text-red-500 mt-1">Please select a course</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Submission Date <span className="text-red-500">*</span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={extracting}
                        className={`w-full justify-start focus:ring-amber-500 h-[2.4rem] ${isFieldRequired('issueDate') ? 'border-red-300' : ''}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {issueDate
                          ? format(parseLocalDate(issueDate), 'PPP')
                          : 'Select submission date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={issueDate ? parseLocalDate(issueDate) : undefined}
                        onSelect={(date) =>
                          setIssueDate(
                            date
                              ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                              : ''
                          )
                        }
                        className='w-full'
                        captionLayout='dropdown'
                      />
                    </PopoverContent>
                  </Popover>
                  {isFieldRequired('issueDate') && (
                    <p className="text-xs text-red-500 mt-1">Submission date is required</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Abstract <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Summarize your research objectives, methods, and key findings"
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    onBlur={() => handleFieldBlur('abstract')}
                    disabled={extracting}
                    rows={8}
                    className={`focus-visible:ring-amber-500 ${isFieldRequired('abstract') ? 'border-red-300' : ''}`}
                  />
                  {extractSource === 'introduction' && abstract && (
                    <p className="text-xs text-amber-700 mt-1">
                      No abstract section was found in your PDF, so the Introduction was used instead. Please check it.
                    </p>
                  )}
                  {isFieldRequired('abstract') && (
                    <p className="text-xs text-red-500 mt-1">Abstract is required</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Keywords
                  </label>
                  <Input
                    placeholder="e.g., cost accounting, small businesses, inventory management"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    disabled={extracting}
                    className="focus-visible:ring-amber-500 h-[2.4rem]"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate each keyword with a comma</p>
                  {keywordsSource && keywords && (
                    <p className="text-xs text-amber-700 mt-1">
                      These keywords were picked from your paper. Please check them.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={loading || extracting}
                size="lg"
                className="w-full cursor-pointer bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-5"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Submitting Thesis...
                  </>
                ) : extracting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Reading your thesis...
                  </>
                ) : (
                  <>
                    Submit Thesis
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500 mt-4">
                By submitting, you confirm that this work is original and complies with academic integrity standards
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ThesisSubmit