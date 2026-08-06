import { useState } from 'react';
import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Plus, Search, BookMarked, AlertTriangle } from 'lucide-react';
import { libraryBooks, libraryIssues, inr } from '@/data/mockModules';

export default function LibraryPage() {
  const [q, setQ] = useState('');
  const books = libraryBooks.filter(b => `${b.title} ${b.author} ${b.isbn} ${b.category}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <ModulePage>
      <ModuleHeader
        icon={BookOpen}
        title="Library"
        description="Catalogue, circulation and fines"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Add book</Button>}
      />

      <StatGrid stats={[
        { label: 'Titles', value: libraryBooks.length, icon: BookOpen },
        { label: 'Copies', value: libraryBooks.reduce((a, b) => a + b.copies, 0), icon: BookMarked },
        { label: 'Issued out', value: libraryIssues.filter(i => i.status === 'active').length, icon: BookMarked, tone: 'success' },
        { label: 'Fines pending', value: inr(libraryIssues.reduce((a, i) => a + i.fine, 0)), icon: AlertTriangle, tone: 'warning' },
      ]} />

      <Tabs defaultValue="catalogue">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="catalogue" className="flex-1 sm:flex-none">Catalogue</TabsTrigger>
          <TabsTrigger value="circulation" className="flex-1 sm:flex-none">Circulation</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogue" className="mt-4">
          <Card>
            <CardHeader className="flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Book catalogue</CardTitle>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, author, ISBN" className="pl-9" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ModuleTable
                rows={books}
                empty="No books match your search."
                columns={[
                  { key: 'title', header: 'Title', mobile: 'title', cell: b => b.title },
                  { key: 'author', header: 'Author', mobile: 'subtitle', cell: b => `${b.author} · ${b.category}` },
                  { key: 'isbn', header: 'ISBN', cell: b => <span className="text-muted-foreground">{b.isbn}</span> },
                  { key: 'shelf', header: 'Shelf', mobile: 'meta', cell: b => b.shelf },
                  { key: 'copies', header: 'Available', mobile: 'meta', cell: b => `${b.available}/${b.copies}` },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circulation" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Issues & returns</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ModuleTable
                rows={libraryIssues}
                columns={[
                  { key: 'book', header: 'Book', mobile: 'title', cell: i => i.book },
                  { key: 'member', header: 'Member', mobile: 'subtitle', cell: i => i.member },
                  { key: 'issued', header: 'Issued', mobile: 'meta', cell: i => i.issued },
                  { key: 'due', header: 'Due', mobile: 'meta', cell: i => i.due },
                  { key: 'fine', header: 'Fine', mobile: 'meta', cell: i => (i.fine ? inr(i.fine) : '—') },
                  { key: 'status', header: 'Status', mobile: 'badge', cell: i => <StatusBadge status={i.status} /> },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}