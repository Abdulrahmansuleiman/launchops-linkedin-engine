"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search, Filter, MessageCircle, Send, MoreHorizontal, Target } from "lucide-react";

const leads = [
  { name: "Jordan Blake", title: "CEO at Apex Ventures", followers: "12.5K", status: "hot", stage: "Demo Booked", last: "2h ago" },
  { name: "Priya Sharma", title: "Founder at GrowthStack", followers: "8.2K", status: "warm", stage: "Connected", last: "1d ago" },
  { name: "Marcus Webb", title: "Director at ScaleUp Labs", followers: "15.1K", status: "hot", stage: "DM Sent", last: "30m ago" },
  { name: "Emily Rowe", title: "COO at LeadFlow Inc.", followers: "6.8K", status: "cold", stage: "New Lead", last: "3d ago" },
  { name: "David Kim", title: "Partner at Ninja Agency", followers: "21.4K", status: "warm", stage: "DM Replied", last: "5h ago" },
  { name: "Nina Patel", title: "CRO at ConvertPro", followers: "9.3K", status: "hot", stage: "Demo Done", last: "1h ago" },
];

export default function Leads() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = leads.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "hot": return "success";
      case "warm": return "info";
      case "cold": return "default";
      default: return "default" as const;
    }
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Leads
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Discover, score, and pipeline LinkedIn prospects
          </p>
        </div>
        <Button>
          <Target className="w-4 h-4 mr-1.5" />
          Import from LinkedIn
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted)" }} />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-32">
          <option value="all">All Status</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </Select>
        <Button variant="secondary" size="sm">
          <Filter className="w-3.5 h-3.5 mr-1" /> Filters
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--muted)" }}>
                  <th className="text-left font-medium pb-3 pr-4">Name</th>
                  <th className="text-left font-medium pb-3 pr-4 hidden sm:table-cell">Followers</th>
                  <th className="text-left font-medium pb-3 pr-4 hidden md:table-cell">Status</th>
                  <th className="text-left font-medium pb-3 pr-4 hidden lg:table-cell">Stage</th>
                  <th className="text-left font-medium pb-3 pr-4 hidden lg:table-cell">Updated</th>
                  <th className="text-right font-medium pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.name}
                    className="border-t transition-colors"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium" style={{ color: "var(--foreground)" }}>{lead.name}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{lead.title}</p>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell" style={{ color: "var(--muted)" }}>
                      {lead.followers}
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell">
                      <Badge variant={statusColor(lead.status)} className="capitalize">{lead.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 hidden lg:table-cell" style={{ color: "var(--muted)" }}>
                      {lead.stage}
                    </td>
                    <td className="py-3 pr-4 hidden lg:table-cell" style={{ color: "var(--muted)" }}>
                      {lead.last}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="!p-1.5">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="!p-1.5">
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="!p-1.5">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Leads", value: "47" },
          { label: "Hot (ready to pitch)", value: "8" },
          { label: "Engaged (reply rate >50%)", value: "14" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
