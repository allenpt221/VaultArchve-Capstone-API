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
import { Badge, CheckCircle, CircleCheck, CircleCheckBig, CircleX, Loader2, Search, Sparkles, SparklesIcon, X, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { generativeStore } from "@/Stores/generativeStore";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"


const courseInterest = ['Accountancy', 'Accounting Information System' ,'Entrepreneurship', 'Public Administration']

const tagColors = [
  "bg-amber-500/10 text-amber-600 border-amber-200",
  "bg-blue-500/10 text-blue-600 border-blue-200",
  "bg-green-500/10 text-green-600 border-green-200",
  "bg-purple-500/10 text-purple-600 border-purple-200",
  "bg-rose-500/10 text-rose-600 border-rose-200",
];

const cardStyles = [
  { card: "border-amber-200 bg-amber-500/5", badge: "bg-amber-500/10 text-amber-600 border-amber-200", tag: "bg-amber-500/10 text-amber-600 border-amber-200" },
  { card: "border-blue-200 bg-blue-500/5",   badge: "bg-blue-500/10 text-blue-600 border-blue-200",   tag: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { card: "border-green-200 bg-green-500/5", badge: "bg-green-500/10 text-green-600 border-green-200", tag: "bg-green-500/10 text-green-600 border-green-200" },
  { card: "border-purple-200 bg-purple-500/5", badge: "bg-purple-500/10 text-purple-600 border-purple-200", tag: "bg-purple-500/10 text-purple-600 border-purple-200" },
  { card: "border-rose-200 bg-rose-500/5",   badge: "bg-rose-500/10 text-rose-600 border-rose-200",   tag: "bg-rose-500/10 text-rose-600 border-rose-200" },
];


function AIrecommendation() {

  const [selectedInterest, setSelectedInterest] = useState("Accountancy");
  const [searchTopic, setSearchTopic] = useState('');
  const [chatPrompt, setChatPrompt] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [active, setActive] = useState<'recommendation' | 'progressive'>('recommendation');

  const [alert, setAlert] = useState(false);

  const { RecommendedAI, result, message, loading } = generativeStore();
  
  const isSuccess = message.includes("successfully");
  const isLoading = message.includes("Generating");
  const isUnauthorized = message.includes("Unauthorized");


  console.log(result);


  useEffect(() => {
    if (!loading && message) {
      const timer = setTimeout(() => {
        setAlert(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loading, message]);





  const handleSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(true);
    setDisabled(true);


  await RecommendedAI({
    topic: searchTopic,
    course: selectedInterest,
    chatPrompt: chatPrompt || "Suggest thesis ideas",
  });

    setTimeout(() => {
    setAlert(false);
    setDisabled(false);
  }, 3000);
};





  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-secondary mb-3">
          <SparklesIcon className="h-5 w-5 text-amber-400" />
          <span className="font-body text-sm font-semibold uppercase tracking-wider text-amber-400">AI-Powered</span>
        </div>
        <h1 className="font-display sm:text-4xl text-2xl font-bold text-foreground mb-3">Thesis Recommendations</h1>
        <p className="font-body text-muted-foreground max-w-xl mx-auto">
          Discover related academic works using AI. Search by topic or get personalized suggestions from your submissions.
        </p>
      </div>

<div className="flex items-center justify-center p-2 m-2">
  <div className="relative flex bg-muted rounded-xl p-1 w-full max-w-md">

    {/* Sliding background */}
    <span
      className="absolute top-1 bottom-1 rounded-lg bg-amber-400 transition-all duration-300 ease-in-out"
      style={{
        width: 'calc(50% - 8px)',
        left: active === 'recommendation' ? '4px' : 'calc(50% + 4px)',
      }}
    />

    <button
      onClick={() => setActive('recommendation')}
      className={`relative z-10 flex-1 text-center py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-300 ${
        active === 'recommendation' ? 'text-black' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      Thesis Recommendation
    </button>

    <button
      onClick={() => setActive('progressive')}
      className={`relative z-10 flex-1 text-center py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-300 ${
        active === 'progressive' ? 'text-black' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      Progressive Trial
    </button>

  </div>
</div>

      {/* Search Section */}
      <form onSubmit={handleSelect}>
        <Card className="border-border mb-10">
          <CardHeader>
            <CardTitle className=" text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-amber-400" />
              Search by Thesis Title
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter a research topic (e.g., Ai In Accounting Information System)"
              className="sm:text-base text-sm"
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
              className="text-sm"
            />
            <Button
            type="submit"
            disabled={!searchTopic.trim() || loading || disabled}
              className="bg-amber-400 py-5 px-2 text-black font-semibold cursor-pointer  text-sm"
            >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
            {loading ? "Generating..." : disabled ? "Please wait..." : "Get Recommendations"}
            </Button>

          {result.length > 0 && result[0]?.error ? (
            <Card className="border-border bg-muted/30">
                <CardContent className="p-4 space-y-1">
                  <p className="text-sm font-semibold leading-snug text-red-700">{result[0].error}</p>
                  <p className="text-xs text-muted-foreground">
                    This helps improve recommendation accuracy by understanding your research scope, objectives, and key features.
                  </p>
                </CardContent>
              </Card>
          ) : (
            result.map((item, index) => (
              <Card key={index} className={`border ${cardStyles[index % cardStyles.length].card}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex sm:flex-row flex-col items-start gap-3 pl-2 sm:pl-0">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md min-w-7 text-center border ${cardStyles[index % cardStyles.length].badge}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h4 className="sm:text-base text-sm font-semibold text-card-foreground leading-snug ">
                      {item.title}
                    </h4>
                  </div>
                    <p className="font-body text-xs text-muted-foreground pl-2 sm:pl-9">
                      {item.summary}
                    </p>
                  <div className="flex flex-wrap gap-2 pl-2 sm:pl-9">
                    {item.tags?.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className={`text-xs px-3 py-1 rounded-full border ${tagColors[index % tagColors.length]}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          </CardContent>
        </Card>
      </form>

    {alert && message && (
      <Alert
        variant="default"
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md px-6 py-4 shadow-lg rounded-xl border ${
          isSuccess
            ? "border-green-300 bg-green-50"
            : isLoading
            ? "border-blue-300 bg-blue-50"
            : "border-red-300 bg-red-50"
        }`}
      >
        <div className="flex items-start gap-3">
          {!isSuccess ? <CircleX className="text-red-800"/> : <CircleCheck className="text-green-500" />}
          <div>
            <AlertTitle
              className={`${
                isSuccess
                  ? "text-green-800"
                  : isLoading
                  ? "text-blue-800"
                  : "text-red-800"
              } sm:text-sm text-xs font-semibold`}
            >
              {message}
            </AlertTitle>

            <AlertDescription className="sm:text-sm text-xs">
              {isSuccess
                ? "Your AI recommendations are ready! Redirecting shortly..."
                : isLoading
                ? "Please wait while we generate your recommendations..."
                : isUnauthorized
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