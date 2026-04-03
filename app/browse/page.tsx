'use client'
import { Search } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { repoStores } from '@/Stores/repoStores';
import ThesisCard from '@/components/ui/ThesisCard';

const departments = [
  "Education",
  "Environmental Science",
  "Information Technology",
  "Business Administration",
  "Tourism & Hospitality",
  "Psychology",
];

const years = [ "2026","2025","2024", "2023", "2022", "2021", "2020"];

// Reusable className for all SelectItems
const selectItemClass = "cursor-pointer py-2 px-2 hover:bg-yellow-500 hover:text-black focus:bg-yellow-500 focus:text-black";

function Browse() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState("newest");


  const { repository, sortByYear } = repoStores();


    useEffect(() => {
    sortByYear(year);
  }, [year]);







  return (
    <div className="sm:px-20 px-5 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Browse Theses</h1>
        <p className="font-body text-muted-foreground">
          Search and explore the complete collection of academic theses.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-5 mb-8 flex sm:flex-row flex-col   gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 font-body sm:w-full"
          />
        </div>

        {/* Department */}
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent className='min-h-10 overflow-y-auto'>
            <SelectItem value="all" className={selectItemClass}>All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d} className={selectItemClass}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year */}
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-full sm:w-32 font-body">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className={selectItemClass}>All Years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y} className={selectItemClass}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-36 font-body">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest" className={selectItemClass}>Newest First</SelectItem>
            <SelectItem value="oldest" className={selectItemClass}>Oldest First</SelectItem>
            <SelectItem value="popular" className={selectItemClass}>Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
        <span className='text-black/70 text-sm'>Showing {repository.length} results</span>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-2'>
          {repository.map((item, index) => (
            <ThesisCard key={index} course={item.course} title={item.title} author={item.author} issue_date={item.issue_date} abstract={item.abstract} views={item.views}  />
          ))}
      </div>
    </div>
  )
}

export default Browse;