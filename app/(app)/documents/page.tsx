'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Search, Filter, Download, Trash2 } from 'lucide-react';
import { useState } from 'react';

const documents = [
  { id: 1, name: 'Website Project Proposal', size: '2.4 MB', date: '2024-06-10', customer: 'Ravi Kumar', type: 'proposal' },
  { id: 2, name: 'Invoice INV-2024-001', size: '512 KB', date: '2024-06-12', customer: 'Priya Sharma', type: 'invoice' },
  { id: 3, name: 'Service Agreement', size: '1.8 MB', date: '2024-06-08', customer: 'Vijayk Enterprises', type: 'contract' },
  { id: 4, name: 'Payment Receipt', size: '340 KB', date: '2024-06-15', customer: 'Anita Singh', type: 'receipt' },
];

const typeColors: Record<string, string> = {
  proposal: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  invoice: 'bg-green-500/10 text-green-400 border border-green-500/30',
  contract: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
  receipt: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
};

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage contracts, invoices, and files</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-5 h-5" />
          Upload Document
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50 border-border/50 rounded-lg"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No documents found. Upload your first document to get started.</p>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-6 hover:shadow-lg transition-all cursor-pointer border-border/50">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <Badge className={typeColors[doc.type] || 'bg-gray-500/10'}>
                  {doc.type}
                </Badge>
              </div>
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{doc.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">{doc.customer}</p>
              <p className="text-xs text-muted-foreground mb-4">{doc.size} • {doc.date}</p>
              
              <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                <Button variant="ghost" size="sm" className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
        </div>
      </div>
    </div>
  );
}
