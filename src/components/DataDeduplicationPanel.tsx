import { useState } from "react";
import { AlertTriangle, Trash2, Check, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { cleanAllDuplicateData, getDeduplicationReport } from "@/lib/deduplication-service";

export function DataDeduplicationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningComplete, setCleaningComplete] = useState(false);
  const [cleanResults, setCleanResults] = useState<any[]>([]);

  const handleCheckDuplicates = () => {
    const { report: dupReport, totalDuplicates } = getDeduplicationReport();
    setReport({
      results: dupReport,
      total: totalDuplicates,
      timestamp: new Date().toLocaleString(),
    });
  };

  const handleCleanDuplicates = () => {
    if (!window.confirm("This will remove all duplicate data from your storage. Continue?")) {
      return;
    }

    setIsCleaning(true);
    // Simulate async cleaning
    setTimeout(() => {
      const results = cleanAllDuplicateData();
      setCleanResults(results);
      setCleaningComplete(true);
      setIsCleaning(false);
      // Refresh report after cleaning
      setTimeout(() => {
        handleCheckDuplicates();
      }, 500);
    }, 1000);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors border border-border/50"
      >
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Data Deduplication Tools</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <GlassCard hover={false} className="space-y-4">
          {!report && !cleaningComplete && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Check for and remove duplicate data from your storage. This includes requirements, leads, and projects.
              </p>
              <div className="flex gap-2">
                <Button
                  className="gradient-primary text-primary-foreground hover:opacity-90"
                  onClick={handleCheckDuplicates}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Check for Duplicates
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCleanDuplicates}
                  disabled={isCleaning}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> {isCleaning ? "Cleaning..." : "Clean All"}
                </Button>
              </div>
            </div>
          )}

          {report && !cleaningComplete && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Deduplication Report</h3>
                <span className="text-xs text-muted-foreground">{report.timestamp}</span>
              </div>

              {report.total === 0 ? (
                <div className="p-4 rounded-lg bg-success/10 border border-success/30 flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <p className="text-sm text-success">No duplicates found! Your data is clean.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                    <p className="text-sm text-warning">Found {report.total} duplicate record(s)</p>
                  </div>

                  {report.results.map((result: any, i: number) => (
                    <div key={i} className="p-3 bg-secondary/30 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {result.source.replace(/-/g, " ")}
                        </span>
                        <Badge variant="outline" className="bg-warning/20 text-warning">
                          {result.duplicatesFound} duplicate{result.duplicatesFound !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {result.duplicatesRemoved} record(s) can be removed
                      </p>
                    </div>
                  ))}

                  <Button
                    className="w-full gradient-primary text-primary-foreground hover:opacity-90"
                    onClick={handleCleanDuplicates}
                    disabled={isCleaning}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> {isCleaning ? "Cleaning..." : "Remove Duplicates"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {cleaningComplete && cleanResults.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/30 flex items-center gap-2">
                <Check className="w-5 h-5 text-success" />
                <p className="text-sm text-success">Successfully removed {cleanResults.reduce((sum, r) => sum + r.duplicatesRemoved, 0)} duplicate record(s)!</p>
              </div>

              {cleanResults.map((result: any, i: number) => (
                <div key={i} className="p-3 bg-secondary/30 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground capitalize">
                      {result.source.replace(/-/g, " ")}
                    </span>
                    <Badge variant="outline" className="bg-success/20 text-success">
                      {result.duplicatesRemoved} removed
                    </Badge>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReport(null);
                    setCleaningComplete(false);
                    setCleanResults([]);
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground hover:opacity-90"
                  onClick={handleCheckDuplicates}
                >
                  Check Again
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
