import { repoStores } from '@/Stores/repoStores'
import React, { useState, useRef } from 'react'

import { format } from 'date-fns'
import { CalendarIcon, UploadCloud, FileText, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'

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

function ThesisSubmit() {
  const { submitThesis, loading } = repoStores()

  const [course, setCourse] = useState('')
  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [author, setAuthor] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [discussion, setDiscussion] = useState('')
  const [conclusion, setConclusion] = useState('')
  const [references, setReferences] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validation helper
  const isFieldRequired = (field: string) => {
    const value = {
      title, author, course, issueDate, abstract, 
      introduction, discussion, conclusion, references
    }[field]
    return touched[field] && !value
  }

  const resetForm = () => {
    setCourse('')
    setTitle('')
    setAbstract('')
    setAuthor('')
    setIssueDate('')
    setIntroduction('')
    setDiscussion('')
    setConclusion('')
    setReferences('')
    setFile(null)
    setTouched({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Mark all fields as touched
    const allFields = {
      title, author, course, issueDate, abstract, 
      introduction, discussion, conclusion, references
    }
    const newTouched = Object.keys(allFields).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, boolean>)
    setTouched(newTouched)

    if (!title || !author || !course || !issueDate || !abstract ||
        !introduction || !discussion || !conclusion || !references) {
      setError('Please fill in all required fields.')
      return
    }

    if (!file) {
      setError('Please upload your thesis file (PDF or DOCX).')
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF and DOCX files are allowed. Please convert your file and try again.')
      return
    }

    try {
      await submitThesis(
        course, title, abstract, author, issueDate,
        introduction, discussion, conclusion, references, file
      )

      setSuccess(true)
      resetForm()
      
      // Auto-scroll to success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Failed to submit thesis. Please check your connection and try again.')
    }
  }

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
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
            Share your research with the academic community
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
            {/* BASIC INFORMATION SECTION */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-amber-500 rounded-full" />
                Basic Information
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
                    <Select value={course} onValueChange={setCourse}>
                      <SelectTrigger className={`focus:ring-amber-500 ${isFieldRequired('course') ? 'border-red-300' : ''}`}>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Accountancy">Bachelor of Science in Accountancy</SelectItem>
                        <SelectItem value="Accounting of Information System">Bachelor of Science in Accounting of Information System</SelectItem>
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
                        className={`w-full justify-start focus:ring-amber-500 h-[2.4rem] ${isFieldRequired('issueDate') ? 'border-red-300' : ''}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {issueDate
                          ? format(new Date(issueDate), 'PPP')
                          : 'Select submission date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={issueDate ? new Date(issueDate) : undefined}
                        onSelect={(date) =>
                          setIssueDate(date ? date.toISOString() : '')
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
              </div>
            </div>

            <Separator />

            {/* THESIS CONTENT SECTION */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-amber-500 rounded-full" />
                Thesis Content
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Abstract <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Summarize your research objectives, methods, and key findings (150-300 words)"
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    onBlur={() => handleFieldBlur('abstract')}
                    rows={4}
                    className={`focus-visible:ring-amber-500 ${isFieldRequired('abstract') ? 'border-red-300' : ''}`}
                  />
                  {isFieldRequired('abstract') && (
                    <p className="text-xs text-red-500 mt-1">Abstract is required</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Introduction <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Introduce your research problem, objectives, and scope"
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    onBlur={() => handleFieldBlur('introduction')}
                    rows={5}
                    className={`focus-visible:ring-amber-500 ${isFieldRequired('introduction') ? 'border-red-300' : ''}`}
                  />
                  {isFieldRequired('introduction') && (
                    <p className="text-xs text-red-500 mt-1">Introduction is required</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Discussion <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Present your methodology, results, and analysis"
                    value={discussion}
                    onChange={(e) => setDiscussion(e.target.value)}
                    onBlur={() => handleFieldBlur('discussion')}
                    rows={6}
                    className={`focus-visible:ring-amber-500 ${isFieldRequired('discussion') ? 'border-red-300' : ''}`}
                  />
                  {isFieldRequired('discussion') && (
                    <p className="text-xs text-red-500 mt-1">Discussion is required</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Conclusion <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Summarize findings, implications, and future work"
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    onBlur={() => handleFieldBlur('conclusion')}
                    rows={4}
                    className={`focus-visible:ring-amber-500 ${isFieldRequired('conclusion') ? 'border-red-300' : ''}`}
                  />
                  {isFieldRequired('conclusion') && (
                    <p className="text-xs text-red-500 mt-1">Conclusion is required</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    References <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="List your citations in your preferred format (APA, MLA, Chicago, etc.)"
                    value={references}
                    onChange={(e) => setReferences(e.target.value)}
                    onBlur={() => handleFieldBlur('references')}
                    rows={4}
                    className={`focus-visible:ring-amber-500 ${isFieldRequired('references') ? 'border-red-300' : ''}`}
                  />
                  {isFieldRequired('references') && (
                    <p className="text-xs text-red-500 mt-1">References are required</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* FILE UPLOAD SECTION */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-amber-500 rounded-full" />
                Document Upload
              </h3>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 bg-white
                  ${file 
                    ? 'border-amber-300 bg-amber-50 hover:bg-amber-100' 
                    : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50/50'
                  }`}
              >
                <UploadCloud className={`mx-auto h-12 w-12 mb-3 ${file ? 'text-amber-600' : 'text-gray-400'}`} />
                
                <p className="text-base font-medium text-gray-700">
                  {file ? 'File selected' : 'Click to upload your thesis document'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {file ? file.name : 'PDF or DOCX format, max 50MB'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Your file will be securely stored and archived
                </p>

                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />

                {file && (
                  <Badge variant="secondary" className="mt-4 bg-amber-100 text-amber-700">
                    ✓ {file.name}
                  </Badge>
                )}
              </div>
              {!file && touched.file && (
                <p className="text-xs text-red-500 mt-2">Please upload your thesis file</p>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                size="lg"
                className="w-full cursor-pointer bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 py-5"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Submitting Thesis...
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