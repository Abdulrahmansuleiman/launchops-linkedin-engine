"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ContractViewProps {
  client: any;
  onClose: () => void;
}

export function ContractView({ client, onClose }: ContractViewProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to download the contract.");
      setDownloading(false);
      return;
    }
    printWindow.document.write(client.contractContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      setDownloading(false);
    }, 500);
  };

  const modalOverlay: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
  };
  const modalBox: React.CSSProperties = {
    width: "100%", maxWidth: "800px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
    background: "var(--card)", borderRadius: "12px",
    border: "1px solid var(--card-border)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalBox} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--card-border)" }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              Service Agreement — {client.companyName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={client.onboardingStatus === "CONTRACT_DRAFTED" ? "warning" : "success"}>
                {client.onboardingStatus}
              </Badge>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Generated {new Date(client.contractGeneratedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownload} disabled={downloading}>
              <Download className="w-4 h-4 mr-1" />
              {downloading ? "Opening..." : "Download PDF"}
            </Button>
            <button onClick={onClose} className="p-1 rounded hover:opacity-70"><X className="w-5 h-5" style={{ color: "var(--muted)" }} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-white">
          <div dangerouslySetInnerHTML={{ __html: client.contractContent }} />
        </div>
      </div>
    </div>
  );
}
