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
  const [author, setAuthor] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [file, setFile] = useState<File | null>(null)

  // Standard format fields
  const [abstract, setAbstract] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [discussion, setDiscussion] = useState('')
  const [conclusion, setConclusion] = useState('')
  const [references, setReferences] = useState('')

  // Entrepreneurship format fields
  const [entrepIntro, setEntrepIntro] = useState('')
  const [actionPlan, setActionPlan] = useState('')
  const [marketProductDescription, setMarketProductDescription] = useState('')
  const [surveyResult, setSurveyResult] = useState('')
  const [targetMarket, setTargetMarket] = useState('')
  const [product, setProduct] = useState('')
  const [production, setProduction] = useState('')

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEntrep = course === 'Entrepreneurship'

  // Validation helper
  const isFieldRequired = (field: string) => {
    if (field === 'file') return touched['file'] && !file

    const commonValues: Record<string, string> = { title, author, course, issueDate }

    const standardValues: Record<string, string> = {
      abstract, introduction, discussion, conclusion, references,
    }

    const entrepValues: Record<string, string> = {
      entrepIntro, actionPlan, marketProductDescription,
      surveyResult, targetMarket, product, production,
    }

    const value =
      commonValues[field] ??
      (isEntrep ? entrepValues[field] : standardValues[field])

    return touched[field] && !value
  }

  const resetForm = () => {
    setCourse('')
    setTitle('')
    setAuthor('')
    setIssueDate('')
    setFile(null)

    setAbstract('')
    setIntroduction('')
    setDiscussion('')
    setConclusion('')
    setReferences('')

    setEntrepIntro('')
    setActionPlan('')
    setMarketProductDescription('')
    setSurveyResult('')
    setTargetMarket('')
    setProduct('')
    setProduction('')

    setTouched({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const commonFields = { title, author, course, issueDate }

    const contentFields = isEntrep
      ? {
          entrepIntro, actionPlan, marketProductDescription,
          surveyResult, targetMarket, product, production,
        }
      : { abstract, introduction, discussion, conclusion, references }

    const allFields = { ...commonFields, ...contentFields }

    const newTouched = Object.keys(allFields).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, boolean>)
    newTouched['file'] = true
    setTouched(newTouched)

    const hasMissingField = Object.values(allFields).some((v) => !v)
    if (hasMissingField) {
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
    const isValidType =
      allowedTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.docx')

    if (!isValidType) {
      setError('Only PDF and DOCX files are allowed. Please convert your file and try again.')
      return
    }

    try {

      const payload =
        isEntrep
          ? {
              type: "entrepreneurship" as const,
              course,
              title,
              author,
              issueDate,
              file,

              entrep_intro: entrepIntro,
              entrep_action_plan: actionPlan,
              entrep_market_product_description: marketProductDescription,
              entrep_survey_result: surveyResult,
              entrep_target_market: targetMarket,
              entrep_product: product,
              entrep_production: production,
            }
          : {
              type: "standard" as const,
              course,
              title,
              author,
              issueDate,
              file,

              thesis_abstract: abstract,
              thesis_introduction: introduction,
              thesis_discussion: discussion,
              thesis_conclusion: conclusion,
              thesis_references: references,
            };

      await submitThesis(payload);

      setSuccess(true)
      resetForm()

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
            Publish research with the academic community
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
                Thesis Information
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
                            setIssueDate(
                              date ? 
                              `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
              </div>
            </div>

            <Separator />

            {/* THESIS CONTENT SECTION — format depends on selected course */}
            {isEntrep ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-amber-500 rounded-full" />
                  Thesis Content
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                    Entrepreneurship Format
                  </Badge>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Introduction <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Introduce the business concept and its purpose"
                      value={entrepIntro}
                      onChange={(e) => setEntrepIntro(e.target.value)}
                      onBlur={() => handleFieldBlur('entrepIntro')}
                      rows={4}
                      className={`focus-visible:ring-amber-500 ${isFieldRequired('entrepIntro') ? 'border-red-300' : ''}`}
                    />
                    {isFieldRequired('entrepIntro') && (
                      <p className="text-xs text-red-500 mt-1">Introduction is required</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Action Plan <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Outline the steps and timeline for launching the business"
                      value={actionPlan}
                      onChange={(e) => setActionPlan(e.target.value)}
                      onBlur={() => handleFieldBlur('actionPlan')}
                      rows={5}
                      className={`focus-visible:ring-amber-500 ${isFieldRequired('actionPlan') ? 'border-red-300' : ''}`}
                    />
                    {isFieldRequired('actionPlan') && (
                      <p className="text-xs text-red-500 mt-1">Action plan is required</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Market / Product Description <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Describe the market opportunity and the product or service offered"
                      value={marketProductDescription}
                      onChange={(e) => setMarketProductDescription(e.target.value)}
                      onBlur={() => handleFieldBlur('marketProductDescription')}
                      rows={5}
                      className={`focus-visible:ring-amber-500 ${isFieldRequired('marketProductDescription') ? 'border-red-300' : ''}`}
                    />
                    {isFieldRequired('marketProductDescription') && (
                      <p className="text-xs text-red-500 mt-1">Market/product description is required</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Survey Result <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Summarize the findings from your market survey"
                      value={surveyResult}
                      onChange={(e) => setSurveyResult(e.target.value)}
                      onBlur={() => handleFieldBlur('surveyResult')}
                      rows={5}
                      className={`focus-visible:ring-amber-500 ${isFieldRequired('surveyResult') ? 'border-red-300' : ''}`}
                    />
                    {isFieldRequired('surveyResult') && (
                      <p className="text-xs text-red-500 mt-1">Survey result is required</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Target Market <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Define your target customers and their characteristics"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      onBlur={() => handleFieldBlur('targetMarket')}
                      rows={4}
                      className={`focus-visible:ring-amber-500 ${isFieldRequired('targetMarket') ? 'border-red-300' : ''}`}
                    />
                    {isFieldRequired('targetMarket') && (
                      <p className="text-xs text-red-500 mt-1">Target market is required</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Product <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Detail the product/service specifications and features"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      onBlur={() => handleFieldBlur('product')}
                      rows={4}
                      className={`focus-visible:ring-amber-500 ${isFieldRequired('product') ? 'border-red-300' : ''}`}
                    />
                    {isFieldRequired('product') && (
                      <p className="text-xs text-red-500 mt-1">Product is required</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Production <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Explain the production process, resources, and supply chain"
                      value={production}
                      onChange={(e) => setProduction(e.target.value)}
                      onBlur={() => handleFieldBlur('production')}
                      rows={4}
                      className={`focus-visible:ring-amber-500 ${isFieldRequired('production') ? 'border-red-300' : ''}`}
                    />
                    {isFieldRequired('production') && (
                      <p className="text-xs text-red-500 mt-1">Production is required</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
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
            )}

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
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null)
                    setTouched(prev => ({ ...prev, file: false }))
                  }}
                />

                {file && (
                  <Badge variant="secondary" className="mt-4 bg-amber-100 text-amber-700 max-w-full truncate">
                    ✓ {file.name}
                  </Badge>
                )}
              </div>
              {isFieldRequired('file') && (
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