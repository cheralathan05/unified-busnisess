'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Calendar, Download } from 'lucide-react'

const salesData = [
  { month: 'Jan', value: 180000, target: 200000 },
  { month: 'Feb', value: 210000, target: 200000 },
  { month: 'Mar', value: 195000, target: 200000 },
  { month: 'Apr', value: 220000, target: 210000 },
  { month: 'May', value: 245000, target: 210000 },
  { month: 'Jun', value: 265000, target: 220000 },
]

const conversionData = [
  { stage: 'Prospect', value: 24, percentage: 100 },
  { stage: 'Contacted', value: 18, percentage: 75 },
  { stage: 'Proposal', value: 12, percentage: 50 },
  { stage: 'Won', value: 5, percentage: 21 },
]

const sourceData = [
  { name: 'Direct', value: 45, fill: '#3b82f6' },
  { name: 'Referral', value: 30, fill: '#10b981' },
  { name: 'Marketing', value: 15, fill: '#f59e0b' },
  { name: 'Other', value: 10, fill: '#8b5cf6' },
]

export default function AnalyticsPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-muted-foreground mt-1">Track your business performance and insights</p>
            </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-32 bg-muted/50 border-border/50">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="gap-2">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Total Revenue</p>
          <p className="text-3xl font-bold text-foreground mt-2">₹13.2L</p>
          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +12% from last month
          </p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Total Leads</p>
          <p className="text-3xl font-bold text-foreground mt-2">24</p>
          <p className="text-xs text-muted-foreground mt-2">5 new this week</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Conversion Rate</p>
          <p className="text-3xl font-bold text-foreground mt-2">21%</p>
          <p className="text-xs text-muted-foreground mt-2">5 deals won this month</p>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Avg Deal Size</p>
          <p className="text-3xl font-bold text-foreground mt-2">₹2.64L</p>
          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +8% increase
          </p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="p-6 border-border/50">
          <h2 className="text-lg font-bold text-foreground mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10, 10, 11, 0.9)', border: '1px solid rgba(255,255,255,0.2)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Actual" />
              <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Conversion Funnel */}
        <Card className="p-6 border-border/50">
          <h2 className="text-lg font-bold text-foreground mb-4">Conversion Funnel</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="stage" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10, 10, 11, 0.9)', border: '1px solid rgba(255,255,255,0.2)' }}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Lead Source Distribution */}
      <Card className="p-6 border-border/50">
        <h2 className="text-lg font-bold text-foreground mb-4">Lead Source Distribution</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="lg:col-span-2 flex flex-col justify-center space-y-3">
            {sourceData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
        </div>
      </div>
    </div>
  )
}
