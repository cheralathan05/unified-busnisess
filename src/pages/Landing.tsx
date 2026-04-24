import { ArrowRight, Zap, Brain, Shield, BarChart3, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";

const features = [
  { icon: Brain, title: "AI-Powered Insights", desc: "Smart suggestions at every step of your project lifecycle" },
  { icon: Zap, title: "Automated Workflows", desc: "From lead to delivery — everything runs automatically" },
  { icon: Shield, title: "Risk Detection", desc: "AI monitors projects and alerts you before problems happen" },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Track progress, payments, and team performance live" },
  { icon: Users, title: "Smart Team Assignment", desc: "AI matches the right people to the right tasks" },
  { icon: CheckCircle, title: "Client Portal", desc: "Give clients visibility into progress and approvals" },
];

const steps = [
  { num: "01", title: "Capture Lead", desc: "AI understands client needs instantly" },
  { num: "02", title: "Smart Meeting", desc: "AI extracts requirements from conversations" },
  { num: "03", title: "Auto Planning", desc: "Tasks, timeline, and team created automatically" },
  { num: "04", title: "Deliver & Grow", desc: "Complete projects and retain clients effortlessly" },
];

export default function Landing() {
  return (
    <PageTransition><div className="h-screen overflow-y-auto bg-background">
      {/* Nav */}
      <nav className="border-b border-border/30 glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center glow-primary">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">AI Project OS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Login</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gradient-primary text-primary-foreground glow-primary hover:opacity-90">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-8 animate-fade-in">
            <Zap className="w-3 h-3" /> AI-Powered Project Management
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="text-foreground">AI Project</span>
            <br />
            <span className="gradient-text">Operating System</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Convert leads into completed products automatically. The intelligent system that thinks, guides, and executes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/signup">
              <Button size="lg" className="gradient-primary text-primary-foreground glow-primary hover:opacity-90 px-8 h-12 text-base">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-border/50 text-foreground hover:bg-secondary h-12 px-8 text-base">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground mb-3">Everything you need</h2>
          <p className="text-muted-foreground">Powerful features to run your entire project lifecycle</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-xl border border-white/5 bg-card/40 backdrop-blur-xl p-6 transition-all duration-300 hover:bg-card/70 hover:border-white/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground mb-3">How it works</h2>
          <p className="text-muted-foreground">From lead to delivery in 4 simple steps</p>
        </div>
        <div className="space-y-6">
          {steps.map((s) => (
            <div
              key={s.num}
              className="flex items-start gap-6 p-6 rounded-xl border border-white/5 bg-card/30 backdrop-blur-xl transition-all duration-300 hover:bg-card/60 hover:border-white/10"
            >
              <span className="text-3xl font-bold gradient-text shrink-0">{s.num}</span>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="rounded-2xl gradient-primary p-12 text-center glow-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">Ready to automate your workflow?</h2>
            <p className="text-primary-foreground/80 mb-8">Start converting leads into completed projects today.</p>
            <Link to="/signup">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 h-12 px-8">
                Start Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 AI Project OS</span>
          <span>Built with intelligence</span>
        </div>
      </footer>
    </div></PageTransition>
  );
}
