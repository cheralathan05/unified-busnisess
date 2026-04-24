import { Settings as SettingsIcon, User, Moon, Sun, LogOut } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { DataDeduplicationPanel } from "@/components/DataDeduplicationPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" /> Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
        </div>

        <GlassCard hover={false}>
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Profile
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Name</Label>
              <Input defaultValue="Admin User" className="bg-secondary/50 border-border/50 h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <Input defaultValue="admin@aiprojectos.com" className="bg-secondary/50 border-border/50 h-11" />
            </div>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90">Save Changes</Button>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <h2 className="font-semibold text-foreground mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-warning" />}
              <div>
                <p className="text-sm text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-2" /> Log Out
          </Button>
        </GlassCard>

        <GlassCard hover={false}>
          <h2 className="font-semibold text-foreground mb-4">Data Management</h2>
          <DataDeduplicationPanel />
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
