import { useState } from "react";
import { Zap, CheckCircle, Copy, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";

export default function LeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const formUrl = window.location.href;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(formUrl);
    toast.success("Link copied to clipboard!");
  };

  if (submitted) {
      return (
      <PageTransition><div className="h-screen overflow-y-auto bg-background flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative w-full max-w-md text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto glow-primary">
            <CheckCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Thank you!</h1>
          <p className="text-muted-foreground">Your project inquiry has been submitted successfully. We'll get back to you within 24 hours.</p>
          <Button variant="outline" className="border-border/50 text-foreground hover:bg-secondary h-11">
            <CalendarDays className="w-4 h-4 mr-2" /> Book a Meeting
          </Button>
        </div>
      </div></PageTransition>
    );
  }

  return (
    <PageTransition><div className="h-screen overflow-y-auto bg-background flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="relative w-full max-w-lg space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Start Your Project</h1>
          <p className="text-sm text-muted-foreground mt-1">Tell us about your project and we'll get back to you</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/5 bg-card/60 backdrop-blur-xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Name *</Label>
              <Input required placeholder="Your name" className="bg-secondary/50 border-border/50 h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Phone *</Label>
              <Input required type="tel" placeholder="+91 98765 43210" className="bg-secondary/50 border-border/50 h-11" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Email *</Label>
            <Input required type="email" placeholder="you@company.com" className="bg-secondary/50 border-border/50 h-11" />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Project Type *</Label>
            <Select required>
              <SelectTrigger className="bg-secondary/50 border-border/50 h-11">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ecommerce">E-commerce Website</SelectItem>
                <SelectItem value="website">Business Website</SelectItem>
                <SelectItem value="mobile-app">Mobile App</SelectItem>
                <SelectItem value="web-app">Web Application</SelectItem>
                <SelectItem value="lms">LMS / Education Platform</SelectItem>
                <SelectItem value="saas">SaaS Product</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Budget Range</Label>
            <Select>
              <SelectTrigger className="bg-secondary/50 border-border/50 h-11">
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-50k">Under ₹50,000</SelectItem>
                <SelectItem value="50k-1l">₹50,000 - ₹1,00,000</SelectItem>
                <SelectItem value="1l-3l">₹1,00,000 - ₹3,00,000</SelectItem>
                <SelectItem value="3l-5l">₹3,00,000 - ₹5,00,000</SelectItem>
                <SelectItem value="above-5l">Above ₹5,00,000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Project Description</Label>
            <Textarea placeholder="Tell us about your project requirements..." className="bg-secondary/50 border-border/50 min-h-[100px] resize-none" />
          </div>

          <Button type="submit" className="w-full gradient-primary text-primary-foreground glow-primary hover:opacity-90 h-11">
            Submit Inquiry
          </Button>
        </form>

        {/* Copy link */}
        <div className="flex items-center justify-center">
          <button onClick={copyLink} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="w-3 h-3" /> Copy form link
          </button>
        </div>
      </div>
    </div></PageTransition>
  );
}
