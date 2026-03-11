'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import { Bell, Lock, Palette, Building2, Users, Key, Save, ChevronRight } from 'lucide-react'

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('Tech Solutions')
  const [businessType, setBusinessType] = useState('Service')
  const [email, setEmail] = useState('amit@business.com')
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  })

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and customize your experience
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-auto grid-cols-4 gap-2 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6 mt-8">
          <Card className="p-6 border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Business Information</h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Business Name</Label>
                  <Input 
                    placeholder="Your business name" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="bg-muted/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Business Type</Label>
                  <Input 
                    placeholder="Service/Product/Hybrid" 
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="bg-muted/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Website</Label>
                  <Input placeholder="https://yoursite.com" className="bg-muted/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phone</Label>
                  <Input placeholder="+91 98765 43210" className="bg-muted/50 border-border/50" />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6 mt-8">
          <Card className="p-6 border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Account Information</h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <Input placeholder="Amit Patel" className="bg-muted/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input 
                    type="email"
                    placeholder="amit@business.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-muted/50 border-border/50"
                  />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </Card>

          {/* Plan Information */}
          <Card className="p-6 border-border/50">
            <h2 className="text-lg font-bold text-foreground mb-4">Plan & Billing</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/30">
                <div>
                  <p className="font-semibold text-foreground">Premium Plan</p>
                  <p className="text-sm text-muted-foreground">Renews on June 30, 2024</p>
                </div>
                <ChevronRight className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6 mt-8">
          <Card className="p-6 border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Notification Preferences</h2>
            </div>
            <div className="space-y-4">
              {[
                { id: 'email', label: 'Email Notifications', description: 'Receive updates and alerts via email' },
                { id: 'sms', label: 'SMS Alerts', description: 'Get important alerts via SMS' },
                { id: 'push', label: 'Push Notifications', description: 'Receive push notifications in your browser' },
              ].map((option) => (
                <div key={option.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <Toggle
                    pressed={notifications[option.id as keyof typeof notifications]}
                    onPressedChange={(pressed) => 
                      setNotifications({ ...notifications, [option.id]: pressed })
                    }
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6 mt-8">
          <Card className="p-6 border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Security Settings</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Password</Label>
                <Input type="password" placeholder="••••••••" className="bg-muted/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">New Password</Label>
                <Input type="password" placeholder="••••••••" className="bg-muted/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Confirm New Password</Label>
                <Input type="password" placeholder="••••••••" className="bg-muted/50 border-border/50" />
              </div>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Key className="w-4 h-4" />
                Update Password
              </Button>
            </div>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="p-6 border-border/50">
            <h2 className="text-lg font-bold text-foreground mb-4">Two-Factor Authentication</h2>
            <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account</p>
            <Button variant="outline" className="gap-2">
              Enable 2FA
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  )
}
