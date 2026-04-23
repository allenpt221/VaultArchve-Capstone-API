'use client'
import { BookOpen, CircleAlert, GraduationCap, Search, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import heroBg from "@/assets/bghero.png";
import Image from "next/image";
import { repoStores } from "@/Stores/repoStores";
import ThesisCard from "@/components/ThesisCard";
import { useEffect, useState } from "react";
import axios from '@/lib/axios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';



export default function Home() {

    const { randomRepository, repository} = repoStores();
    const [isLoading, setIsLoading] = useState(true);
    const [showAlert, setShowAlert] = useState(false);
    const [isClickable, setIsClickable] = useState(true);
    const totalViews = repository.reduce((sum, item) => sum + (Number(item.views) || 0), 0);
    const totalDownloads = repository.reduce((sum, repo) => sum + (Number(repo.downloads) || 0), 0);

    
    function formatViews(num: number) {
      if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
      }
      if (num >= 1_000) {
        return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
      }
      return num.toString();
    }


    const stats = [
      { icon: BookOpen, label: "Total Theses", value: "1,240+" },
      { icon: Users, label: "Contributors", value: formatViews(totalDownloads)},
      { icon: GraduationCap, label: "Courses", value: "4" },
      { icon: TrendingUp, label: "Total Views", value: formatViews(totalViews)},
    ];


    const handleCountView = async (id: string) => {
      try {
        await axios.put(`repository/views/${id}`);

      } catch (error:any) {
        console.error(error); 
      }
  };



    useEffect(() => {
      const timer = setTimeout(() => 
        setIsLoading(false), 
      1000);
      return () => clearTimeout(timer);
    }, []);

    const triggerAlert = () => {
      setShowAlert(true);
      setIsClickable(false);
      setTimeout(() => { 
        setShowAlert(false)
        setIsClickable(true)
      }, 3000);
  };
  

  return (
      <div className="">
      <div className="relative  min-h-130 flex justify-center items-center overflow-hidden">
        <Image src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1B355F]/70" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-20">
            <div className="inline-flex items-center gap-2 bg-amber-300/30 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <BookOpen className="h-4 w-4" />
              Academic Digital Repository
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Discover & Preserve
              <span className="block text-amber-400 font-serif">Academic Excellence</span>
            </h1>
            <p className="text-primary-foreground/75 text-sm max-w-2xl mx-auto mb-8 leading-relaxed">
              VaultArchve is the official digital thesis repository of Guagua Community College — explore, search, and contribute to our growing academic archive.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/browse">
                <Button className="bg-yellow-500 text-black hover:bg-amber-400/90 cursor-pointer font-semibold px-8 py-6 text-base">
                  <Search className="mr-2 h-4 w-4" /> Browse Thesis
                </Button>
              </Link>
              <Link href="/recommendation">
                <Button variant="outline" className="font-semibold cursor-pointer border-primary-foreground/30 text-black hover:text-white hover:bg-primary-foreground/10  px-8 py-6 text-base">
                  Recommend Thesis
                </Button>
              </Link>
            </div>
          </div>
      </div>
      <div className="relative -mt-12 z-20 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl shadow-md p-5 text-center border border-border">
              <stat.icon className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-card-foreground">{stat.value}</p>
              <p className="font-body text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">Featured Theses</h2>
          <p className="font-body text-muted-foreground max-w-xl mx-auto">
            Explore recent and highly-viewed academic works from our community of scholars.
          </p>
        </div>
        {isLoading ? (

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-2'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-5 w-28 bg-gray-200 rounded-full" />
                  <div className="h-4 w-8 bg-gray-200 rounded" />
                </div>
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded" />
                  <div className="h-3 w-5/6 bg-gray-200 rounded" />
                  <div className="h-3 w-4/6 bg-gray-200 rounded" />
                </div>
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {randomRepository.map((item, index) => (
              <ThesisCard id={item.id} isClickable={isClickable} onAuthFail={triggerAlert} onView={() => handleCountView(item.id)} key={index} views={item.views} course={item.course} title={item.title} author={item.author} issue_date={item.issue_date} abstract={item.abstract} />
            ))}
          </div>
        )}
        <div className="text-center mt-10">
          <Link href="/browse">
            <Button variant="outline" className="hover:bg-amber-400 font-semibold py-5 border-amber-400 text-amber-400 px-8">
              View All Theses →
            </Button>
          </Link>
        </div>
      </div>

      {showAlert && (
        <Alert
          variant="default"
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md px-6 py-4 shadow-lg rounded-xl border border-red-500 bg-red-100`}
        >
          <div className="flex items-start gap-3">
            <CircleAlert className="text-red-500" />
            <div>
              <AlertTitle
                className='text-red-600 font-semibold'>
                Login Required
              </AlertTitle>
              <AlertDescription className="text-red-600 text-xs">
                Log in to access the full thesis and continue reading.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}
