import { BookOpen } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";


export default function Home() {
  return (
    <div className="bg-blue-950 min-h-130 flex justify-center items-center overflow-hidden">

              <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/85" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-20">
          <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-1.5 rounded-full text-sm font-body font-medium mb-6">
            <BookOpen className="h-4 w-4" />
            Academic Digital Repository
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
            Discover & Preserve
            <span className="block text-secondary">Academic Excellence</span>
          </h1>
          <p className="font-body text-primary-foreground/75 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            VaultArchve is the official digital thesis repository of Guagua Community College — explore, search, and contribute to our growing academic archive.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold px-8 py-6 text-base">
                <Search className="mr-2 h-4 w-4" /> Browse Theses
              </Button>
            </Link>
            <Link href="/submit">
              <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-body px-8 py-6 text-base">
                Submit Your Thesis
              </Button>
            </Link>
          </div>
        </div>
    </div>
  );
}
