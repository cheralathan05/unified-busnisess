import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, CheckCircle2, Lightbulb, TrendingUp } from "lucide-react";

interface AIAnalysisProps {
  projectType: string;
  features: string[];
  description: string;
  budget: number;
  deadline: string;
  priority: string;
  analysis?: AnalysisData | null;
  isLoading?: boolean;
}

interface AnalysisData {
  completionScore: number;
  insights: string[];
  risks: string[];
  recommendations: string[];
}

/**
 * Smart AI Analysis Component
 * Displays AI-powered insights about project scope and completeness
 */
export function AIAnalysisBox({
  projectType,
  features,
  description,
  budget,
  deadline,
  priority,
  analysis,
  isLoading = false,
}: AIAnalysisProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-cyan-300 mt-1 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm text-white/80">AI Analysis loading...</p>
            <p className="text-xs text-white/50 mt-1">Waiting for the live Ollama response</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 flex-shrink-0 animate-pulse text-cyan-300" />
          <div className="flex-1">
            <p className="text-sm text-white/80">Add project details to unlock AI insights</p>
            <p className="mt-1 text-xs text-white/50">The live Ollama analysis appears here once the model returns a result.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Completion Score */}
      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-300" /> AI Completion Score
          </h3>
          <motion.div
            className="text-3xl font-bold text-cyan-200"
            key={analysis.completionScore}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            {analysis.completionScore}%
          </motion.div>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${analysis.completionScore}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-xs text-white/60 mt-2">
          {analysis.completionScore > 80
            ? "Project brief is comprehensive and ready for execution"
            : analysis.completionScore > 60
              ? "Good progress—add more details for optimal clarity"
              : "Keep building out your project vision"}
        </p>
      </div>

      {/* Insights */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-amber-300" /> Key Insights
        </h4>
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {analysis.insights.map((insight, idx) => (
              <motion.div
                key={insight}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-xs text-white/75 p-2 rounded-lg bg-black/20 border border-white/10"
              >
                {insight}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Risks */}
      {analysis.risks.length > 0 && (
        <div className="rounded-2xl border border-orange-300/20 bg-orange-300/10 p-4">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-orange-300" /> Potential Challenges
          </h4>
          <div className="space-y-2">
            {analysis.risks.map((risk, idx) => (
              <motion.div
                key={risk}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-xs text-orange-100 p-2 rounded-lg bg-black/20 border border-orange-300/20"
              >
                {risk}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Next Steps
        </h4>
        <div className="space-y-2">
          {analysis.recommendations.map((rec, idx) => (
            <motion.div
              key={rec}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="text-xs text-emerald-100 p-2 rounded-lg bg-black/20 border border-emerald-300/20 flex items-start gap-2"
            >
              <span className="text-emerald-300 font-bold mt-0.5">{idx + 1}.</span>
              {rec}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface SmartSuggestionsProps {
  suggestions: string[];
  onAddFeature?: (feature: string) => void;
  isLoading?: boolean;
}

/**
 * Smart Feature Suggestions Component
 * Shows AI-recommended features based on project context
 */
export function SmartSuggestions({ suggestions, onAddFeature, isLoading = false }: SmartSuggestionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4"
    >
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-violet-300 animate-pulse" /> AI Suggestions
      </h4>
      {suggestions.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onAddFeature?.(suggestion)}
              className="text-xs py-2 px-3 rounded-lg bg-violet-400/20 border border-violet-300/30 text-violet-100 hover:bg-violet-400/30 transition text-left"
            >
              + {suggestion}
            </motion.button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/60">Add more project details to unlock feature suggestions</p>
      )}
    </motion.div>
  );
}

interface CompletionMeterProps {
  score: number;
  message?: string;
}

/**
 * Visual completion meter for form progress
 */
export function CompletionMeter({ score, message }: CompletionMeterProps) {
  return (
    <motion.div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-white/70">Form Clarity</span>
          <motion.span
            className="text-sm font-bold text-cyan-300"
            key={score}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            {score}%
          </motion.span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400"
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
      {message && <p className="text-xs text-white/60 w-32 text-right">{message}</p>}
    </motion.div>
  );
}

export default {
  AIAnalysisBox,
  SmartSuggestions,
  CompletionMeter,
};
