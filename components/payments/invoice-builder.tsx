'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge-enhanced'
import { Input } from '@/components/ui/input'
import { X, Plus, Download, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
}

interface InvoiceBuilderProps {
  onSave?: (invoice: any) => void
  onPreview?: () => void
  initialData?: any
}

export function InvoiceBuilder({ onSave, onPreview, initialData }: InvoiceBuilderProps) {
  const [items, setItems] = useState<InvoiceItem[]>(
    initialData?.items || [
      { id: '1', description: 'Professional Services', quantity: 1, price: 5000 },
    ],
  )
  const [taxRate, setTaxRate] = useState(initialData?.taxRate || 18)
  const [discount, setDiscount] = useState(initialData?.discount || 0)

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const taxAmount = Math.round((subtotal * taxRate) / 100)
  const discountAmount = Math.round((subtotal * discount) / 100)
  const total = subtotal + taxAmount - discountAmount

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        price: 0,
      },
    ])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, updates: Partial<InvoiceItem>) => {
    setItems(items.map(item => (item.id === id ? { ...item, ...updates } : item)))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create Invoice</CardTitle>
        <CardDescription>Build and customize your invoice</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Items section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Invoice Items</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          {/* Items table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/30 grid grid-cols-12 gap-2 p-3 text-xs font-semibold">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-3 text-right">Price</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            <AnimatePresence>
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-12 gap-2 p-3 border-t border-border/50 items-center"
                >
                  <Input
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    className="col-span-5 h-8"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                    className="col-span-2 h-8 text-right"
                  />
                  <div className="col-span-3 text-right">
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, { price: parseInt(e.target.value) || 0 })}
                      className="h-8 text-right"
                    />
                  </div>
                  <div className="col-span-1 text-right font-medium text-sm">
                    ₹{(item.quantity * item.price).toLocaleString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="col-span-1 h-8 w-8 p-0 hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Tax and discount */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/10">
          <div>
            <label className="text-sm font-medium">Tax Rate (%)</label>
            <Input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Discount (%)</label>
            <Input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 rounded-lg border border-border bg-muted/5 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-medium">₹{subtotal.toLocaleString()}</span>
          </div>
          {taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax ({taxRate}%)</span>
              <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>Discount ({discount}%)</span>
              <span className="font-medium">-₹{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
            <span>Total</span>
            <Badge variant="solid" color="primary" size="md">
              ₹{total.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onPreview && (
            <Button variant="outline" className="gap-2 flex-1">
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          )}
          {onSave && (
            <Button
              className="gap-2 flex-1"
              onClick={() => onSave({ items, taxRate, discount, total })}
            >
              <Download className="w-4 h-4" />
              Save Invoice
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
