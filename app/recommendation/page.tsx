'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea";
import { Input } from '@/components/ui/input';
import { CheckCircle, CircleCheckBig, CircleX, Search, Sparkles, SparklesIcon, X, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { generativeStore } from "@/Stores/generativeStore";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"


const courseInterest = ['Accounting Information System', 'Accountancy' ,'Entrepreneurship', 'public administration']




function AIrecommendation() {

  const [selectedInterest, setSelectedInterest] = useState("Accounting Information System");
  const [searchTopic, setSearchTopic] = useState('');
  const [chatPrompt, setChatPrompt] = useState('');

  const [alert, setAlert] = useState(false);


  const { RecommendedAI, result, message } = generativeStore();

  const handleSelect = async () => {
    setAlert(true);

    setTimeout(() => {
      
    })

  await RecommendedAI({
    course: searchTopic,
    interest: selectedInterest,
    chatPrompt: chatPrompt || "Suggest thesis ideas",
  });

    setTimeout(() => {
    setAlert(false);
  }, 3000);
};

console.log(result)




  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-secondary mb-3">
          <SparklesIcon className="h-5 w-5" />
          <span className="font-body text-sm font-semibold uppercase tracking-wider">AI-Powered</span>
        </div>
        <h1 className="font-display sm:text-4xl text-2xl font-bold text-foreground mb-3">Thesis Recommendations</h1>
        <p className="font-body text-muted-foreground max-w-xl mx-auto">
          Discover related academic works using AI. Search by topic or get personalized suggestions from your submissions.
        </p>
      </div>

      {/* Search Section */}
      <Card className="border-border mb-10">
        <CardHeader>
          <CardTitle className=" text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-amber-400" />
            Search by Topic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter a research topic (e.g., Ai In Accounting Information System)"
            className=""
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
          />
          <Select
          value={selectedInterest}
          onValueChange={(value) => setSelectedInterest(value)}>
            <SelectTrigger className="w-full">
              <SelectValue  />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {courseInterest.map((interest) => (
                  <SelectItem key={interest} value={interest}>{interest}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Textarea
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder="Optional: paste an abstract or description for more accurate results..."
            rows={3}
            className=""
          />
          <Button
          onClick={handleSelect}
          disabled={!searchTopic.trim()}
            className="bg-amber-400 py-5 px-2 text-black font-semibold cursor-pointer  text-sm"
          >
          <SparklesIcon className="h-5 w-5" />
            Get Recommendations
          </Button>

          <div>
            <p>tile</p>

          </div>
        </CardContent>
      </Card>

        {alert && (
           <Alert
              variant="default"
              className={`fixed top-6 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md px-6 py-4 shadow-lg rounded-xl border ${
                message.includes("successfully")
                  ? "border-green-300 bg-green-50"
                  : message.includes("Generating")
                  ? "border-blue-300 bg-blue-50"
                  : "border-red-300 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {message.includes("successfully") ? (
                  <CircleCheckBig className="text-green-600 mt-1" />
                ) : message.includes("Generating") ? (
                  <SparklesIcon className="text-blue-600 mt-1 animate-spin" />
                ) : (
                  <CircleX className="text-red-600 mt-1" />
                )}
                <div>
                  <AlertTitle
                    className={`${
                      message.includes("successfully")
                        ? "text-green-800"
                        : message.includes("Generating")
                        ? "text-blue-800"
                        : "text-red-800"
                    } sm:text-sm text-xs font-semibold`}
                  >
                    {message}
                  </AlertTitle>
                  <AlertDescription className="sm:text-sm text-xs">
                    {message.includes("successfully")
                      ? "Your AI recommendations are ready! Redirecting shortly..."
                      : message.includes("Generating")
                      ? "Please wait while we generate your recommendations..."
                      : message.includes("Unauthorized")
                      ? "You need to log in to continue."
                      : "Please try again."}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
        )}
    </div>
  )
}

export default AIrecommendation;