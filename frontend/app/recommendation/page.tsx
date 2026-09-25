'use client'
import ProgressiveTrial from '@/components/GenerativeAI/ProgressiveTrial'
import AIrecommendation from '@/components/GenerativeAI/RecommendationAI'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bot } from 'lucide-react'
import { useEffect, useState } from 'react'

const ASSISTANT_STORAGE_KEY = 'thesisAssistant:selectedAssistant'

function page() {

  const AssistantAI = ['Title recommendation', 'Progressive Trail']
  const [selectedAssistant, setSelectedAssistant] = useState(() => {
    if (typeof window === 'undefined') return 'Title recommendation'
    const saved = localStorage.getItem(ASSISTANT_STORAGE_KEY)
    return saved && AssistantAI.includes(saved) ? saved : 'Title recommendation'
  })

  useEffect(() => {
    localStorage.setItem(ASSISTANT_STORAGE_KEY, selectedAssistant)
  }, [selectedAssistant])

  return (
    <div className='sm:h-[89vh] w-full flex flex-col bg-background sm:px-3'>
      <header className="shrink-0 border-b border-border/60 h-14 flex justify-between items-center xl:px-30 lg:px-5 px-2">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-amber-400 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-black" />
          </div>
          <span className="font-body text-sm font-semibold text-foreground">Thesis Assistant</span>
        </div>


        <div className='hidden sm:flex'>
          <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
            <SelectTrigger className="w-full md:w-70">
              <SelectValue placeholder="Generative" />
            </SelectTrigger>
            <SelectContent className='min-h-10 overflow-y-auto'>
              {AssistantAI.map((item, key) => (
                <SelectItem key={key} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Mobile selector */}
      <div className="sm:hidden shrink-0 border-b border-border/60 px-2 py-2">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {AssistantAI.map((item, key) => (
            <button
              key={key}
              onClick={() => setSelectedAssistant(item)}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium font-body transition-colors ${
                selectedAssistant === item
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {selectedAssistant === "Title recommendation" && <AIrecommendation />}
      {selectedAssistant === "Progressive Trail" && <ProgressiveTrial />}

    </div>
  )
}

export default page