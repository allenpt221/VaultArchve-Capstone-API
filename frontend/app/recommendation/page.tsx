'use client'
import ProgressiveTrial from '@/components/GenerativeAI/ProgressiveTrial'
import AIrecommendation from '@/components/GenerativeAI/RecommendationAI'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bot } from 'lucide-react'
import { useState } from 'react'

function page() {

  const AssistantAI = ['Title recommendation', 'Progressive Trial']
  const [selectedAssistant, setSelectedAssistant] = useState('Title recommendation')

  return (
    <div className='sm:h-[89vh] w-full flex flex-col bg-background px-3'>
      <header className="shrink-0 border-b border-border/60 h-14 flex justify-between items-center lg:px-50 px-2">
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


      {selectedAssistant === "Title recommendation" && <AIrecommendation />}
      {selectedAssistant === "Progressive Trial" && <ProgressiveTrial />}



    </div>
  )
}

export default page