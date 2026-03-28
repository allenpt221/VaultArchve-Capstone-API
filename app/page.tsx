import { BookOpen, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import heroBg from "@/assets/bghero.png";
import Image from "next/image";


export default function Home() {
  return (
      <div className="">
      <div className="relative  min-h-130 flex justify-center items-center overflow-hidden">
        <Image src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#0b014d]/70" />
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-20">
            <div className="inline-flex items-center gap-2 bg-amber-300/30 text-amber-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <BookOpen className="h-4 w-4" />
              Academic Digital Repository
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Discover & Preserve
              <span className="block text-amber-400 font-serif">Academic Excellence</span>
            </h1>
            <p className=" text-primary-foreground/75 text-sm max-w-2xl mx-auto mb-8 leading-relaxed">
              VaultArchve is the official digital thesis repository of Guagua Community College — explore, search, and contribute to our growing academic archive.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/browse">
                <Button className="bg-yellow-500 text-black hover:bg-amber-400/90 cursor-pointer font-semibold px-8 py-6 text-base">
                  <Search className="mr-2 h-4 w-4" /> Browse Theses
                </Button>
              </Link>
              <Link href="/submit">
                <Button variant="outline" className="font-semibold cursor-pointer border-primary-foreground/30 text-black hover:text-white hover:bg-primary-foreground/10  px-8 py-6 text-base">
                  Recommend Thesis
                </Button>
              </Link>
            </div>
          </div>
      </div>
    </div>
  );
}
