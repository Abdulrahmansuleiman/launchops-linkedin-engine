"use client";

import { useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchFormProps {
  onSearch: (input: string) => void;
  loading: boolean;
}

export function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSearch(input.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted)" }} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter LinkedIn URL, website, or company name"
          className="w-full h-10 pl-10 pr-4 rounded-lg text-sm outline-none transition-colors"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--input-border)",
            color: "var(--foreground)",
          }}
          disabled={loading}
        />
      </div>
      <Button type="submit" disabled={loading || !input.trim()}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        <span className="ml-2">{loading ? "Searching..." : "Search"}</span>
      </Button>
    </form>
  );
}
