'use client'
import { CircleAlert, Search, ChevronLeft, ChevronRight, FileSearch } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { repoStores } from '@/Stores/repoStores';
import axios from '@/lib/axios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ITEMS_PER_PAGE } from '../Provider';
import ThesisCard from '@/components/ThesisCard';
import { useSavedThesisStore } from '@/Stores/savedThesisStore';


const departments = ['Accountancy', 'Accounting Information System', 'Public Administration', 'Entrepreneurship'];
const years = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];

const selectItemClass = "cursor-pointer py-2 px-2 hover:bg-yellow-500 hover:text-black focus:bg-yellow-500 focus:text-black";

const sortMap: Record<string, { sort: string; order: string }> = {
  newest:  { sort: "issue_date", order: "desc" },
  oldest:  { sort: "issue_date", order: "asc" },
  popular: { sort: "views",      order: "desc" },
};

function Browse() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const { repository, FilteredThesis, incrementViews, incrementSaves, decrementSaves } = repoStores();

  const { saveStatusMap, checkSaveStatus, saveThesis, unsaveThesis } = useSavedThesisStore();

  const [showAlert, setShowAlert] = useState(false);
  const [isClickable, setIsClickable] = useState(true);

  const stableFilteredThesis = useCallback(FilteredThesis, []);

  useEffect(() => {
    const { sort: sortCol, order } = sortMap[sort];
    stableFilteredThesis(search, year, dept, sortCol, order);
  }, [search, year, dept, sort, stableFilteredThesis]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dept, year, sort]);

  const handleCountView = async (id: string) => {
    try {
      await axios.put(`repository/views/${id}`);
      incrementViews(id);
    } catch (error: any) {
      console.error(error);
    }
  };

  const triggerAlert = () => {
    setShowAlert(true);
    setIsClickable(false);
    setTimeout(() => {
      setShowAlert(false);
      setIsClickable(true);
    }, 3000);
  };

  const displayed = useMemo(() => {
    const q = search.toLowerCase();
    return repository.filter((item) =>
      item.title?.toLowerCase().includes(q) ||
      item.author?.toLowerCase().includes(q)
    );
  }, [repository, search]);

  const totalPages = Math.ceil(displayed.length / ITEMS_PER_PAGE);

  const paginated = useMemo(
    () => displayed.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    ),
    [displayed, currentPage]
  );

  const paginatedIds = useMemo(
    () => paginated.map((item) => item.id).join(','),
    [paginated]
  );

  useEffect(() => {
    paginatedIds.split(',').forEach((id) => {
      if (id && saveStatusMap[id] === undefined) {
        checkSaveStatus(id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedIds, checkSaveStatus]);

    const handleToggleSave = async (id: string) => {
      const isSaved = saveStatusMap[id];
      const result = isSaved ? await unsaveThesis(id) : await saveThesis(id);
      if (result.success) {
        isSaved ? decrementSaves(id) : incrementSaves(id);
      } else {
        triggerAlert();
      }
    };

  return (
    <div className="sm:px-20 px-3 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Browse Thesis</h1>
        <p className="font-body text-muted-foreground">
          Search and explore the complete collection of academic thesis.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-5 mb-8 flex sm:flex-row flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 font-body sm:w-full h-full text-xs"
          />
        </div>

        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-full md:w-70">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent className='min-h-10 overflow-y-auto'>
            <SelectItem value="all" className={selectItemClass}>All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d} className={selectItemClass}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      <span className='text-black/70 text-sm'>Showing {displayed.length} results</span>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-2'>
        {paginated.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <FileSearch className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">No results found</p>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
              We couldn't find any thesis matching your search. Try adjusting your filters or using different keywords.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => { setSearch(""); setDept("all"); setYear("all"); setSort("newest"); }}
                className="text-xs px-3 py-1.5 rounded-md border border-border bg-muted hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-colors text-muted-foreground"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          paginated.map((item) => (
            <ThesisCard
              key={item.id}
              id={item.id}
              isClickable={isClickable}
              onAuthFail={triggerAlert}
              onView={() => handleCountView(item.id)}
              course={item.course}
              title={item.title}
              author={item.author}
              issue_date={item.issue_date}
              abstract={item.abstract}
              views={item.ThesisDataAnalytics?.[0]?.views ?? 0}
              saves={item.ThesisDataAnalytics?.[0]?.saves ?? 0}
              isSaved={saveStatusMap[item.id] ?? false}
              onToggleSave={() => handleToggleSave(item.id)}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-500 hover:text-black transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-500 hover:text-black transition-colors"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {showAlert && (
        <Alert
          variant="default"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-md px-6 py-4 shadow-lg rounded-xl border border-red-500 bg-red-100"
        >
          <div className="flex items-start gap-3">
            <CircleAlert className="text-red-500" />
            <div>
              <AlertTitle className='text-red-600 font-semibold'>
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

export default Browse;