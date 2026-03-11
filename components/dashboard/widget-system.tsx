'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GripVertical, X, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface WidgetConfig {
  id: string
  title: string
  description?: string
  component: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  removable?: boolean
  minimizable?: boolean
}

interface WidgetProps {
  config: WidgetConfig
  onRemove?: (id: string) => void
  isDragging?: boolean
  isDraggable?: boolean
  dragHandle?: React.ReactNode
  className?: string
}

export function Widget({
  config,
  onRemove,
  isDragging,
  isDraggable = true,
  dragHandle,
  className,
}: WidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false)

  const sizeClasses: Record<string, string> = {
    sm: 'col-span-1 row-span-1',
    md: 'col-span-2 md:col-span-2 lg:col-span-2',
    lg: 'col-span-full lg:col-span-3',
    full: 'col-span-full',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        sizeClasses[config.size || 'md'],
        isDragging && 'opacity-50',
        className,
      )}
    >
      <Card className="h-full flex flex-col hover:shadow-elevation-2 transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {isDraggable && dragHandle && (
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
                    {dragHandle}
                  </div>
                )}
                <CardTitle className="text-lg">{config.title}</CardTitle>
              </div>
              {config.description && (
                <CardDescription className="mt-1">{config.description}</CardDescription>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {config.minimizable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              {config.removable !== false && onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(config.id)}
                  className="h-8 w-8 p-0 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden"
            >
              <CardContent className="pb-0 pt-0">
                {config.component}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

interface WidgetGridProps {
  widgets: WidgetConfig[]
  onRemove?: (id: string) => void
  onReorder?: (widgets: WidgetConfig[]) => void
  isDraggable?: boolean
  className?: string
  editMode?: boolean
}

export function WidgetGrid({
  widgets,
  onRemove,
  isDraggable = false,
  className,
  editMode = false,
}: WidgetGridProps) {
  return (
    <motion.div
      layout
      className={cn(
        'grid gap-6 auto-rows-max',
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      <AnimatePresence mode="popLayout">
        {widgets.map((widget) => (
          <Widget
            key={widget.id}
            config={widget}
            onRemove={editMode ? onRemove : undefined}
            isDraggable={isDraggable && editMode}
            dragHandle={<GripVertical className="w-5 h-5" />}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

// Widget templates
export const WidgetTemplates = {
  emptyState: {
    id: 'empty',
    title: 'No widgets',
    description: 'Add some widgets to get started',
    component: <div className="text-center py-8 text-muted-foreground">No widgets configured</div>,
    size: 'full' as const,
  },

  loader: (id: string) => ({
    id,
    title: 'Loading...',
    component: (
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    ),
    size: 'md' as const,
  }),
}
