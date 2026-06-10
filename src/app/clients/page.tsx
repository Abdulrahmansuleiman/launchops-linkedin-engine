"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, Download, Eye, Loader2, ExternalLink } from "lucide-react";
import { ContractView } from "./components/ContractView";

const statusColors: Record<string, "warning" | "success" | "info" | "default"> = {
  PENDING_FORM: "default",
  FORM_SENT: "info",
  FORM_COMPLETED: "info",
  CONTRACT_DRAFTED: "warning",
  CONTRACT_SIGNED: "success",
  ONBOARDED: "success",
};

const statusLabels: Record<string, string> = {
  PENDING_FORM: "Pending Form",
  FORM_SENT: "Form Sent",
  FORM_COMPLETED: "Form Completed",
  CONTRACT_DRAFTED: "Contract Drafted",
  CONTRACT_SIGNED: "Contract Signed",
  ONBOARDED: "Onboarded",
};

export default function ClientsPage() {
  const [viewingContract, setViewingContract] = useState<any>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--muted)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Clients
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Manage your onboarded clients and contracts
          </p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-full mb-4" style={{ background: "var(--badge-bg)" }}>
            <Users className="w-8 h-8" style={{ color: "var(--muted)" }} />
          </div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>
            No clients yet
          </h3>
          <p className="text-sm max-w-md" style={{ color: "var(--muted)" }}>
            Convert a lead to a client from the Leads page. When a lead says yes on a call, click "Convert to Client" to generate their onboarding form and contract.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client: any) => (
            <Card key={client.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>
                        {client.companyName}
                      </h3>
                      <Badge variant={statusColors[client.onboardingStatus] || "default"}>
                        {statusLabels[client.onboardingStatus] || client.onboardingStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      <span>{client.contactName}</span>
                      {client.contactEmail && <span>{client.contactEmail}</span>}
                    </div>
                    {client.lead && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          Lead: {client.lead.name}
                        </span>
                        {client.lead.score && (
                          <Badge variant={client.lead.score >= 80 ? "success" : "default"} className="text-[10px]">
                            {client.lead.score}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {client.services?.map((s: string) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "var(--badge-bg)", color: "var(--muted)" }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    {client.monthlyRetainer && (
                      <p className="text-sm mt-2 font-medium" style={{ color: "var(--foreground)" }}>
                        £{client.monthlyRetainer.toLocaleString()}/mo
                        {client.contractDuration && <span style={{ color: "var(--muted)", fontWeight: 400 }}> &middot; {client.contractDuration} months</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {client.contractContent && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setViewingContract(client)}>
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Contract
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const w = window.open("", "_blank");
                            if (w) {
                              w.document.write(client.contractContent);
                              w.document.close();
                              w.focus();
                              setTimeout(() => w.print(), 500);
                            }
                          }}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          PDF
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewingContract && (
        <ContractView
          client={viewingContract}
          onClose={() => setViewingContract(null)}
        />
      )}
    </div>
  );
}
