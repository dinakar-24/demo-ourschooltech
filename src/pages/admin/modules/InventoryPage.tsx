import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, AlertTriangle, Wallet, ShoppingCart } from 'lucide-react';
import { inventoryItems, purchaseOrders, inr } from '@/data/mockModules';

export default function InventoryPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={Package}
        title="Inventory & Assets"
        description="Stock levels, asset value and purchase orders"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Add item</Button>}
      />

      <StatGrid stats={[
        { label: 'Items tracked', value: inventoryItems.length, icon: Package },
        { label: 'Low stock', value: inventoryItems.filter(i => i.status === 'low').length, icon: AlertTriangle, tone: 'warning' },
        { label: 'Asset value', value: inr(inventoryItems.reduce((a, i) => a + i.value, 0)), icon: Wallet },
        { label: 'Open POs', value: purchaseOrders.filter(p => p.status !== 'completed').length, icon: ShoppingCart, tone: 'success' },
      ]} />

      <Tabs defaultValue="stock">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="stock" className="flex-1 sm:flex-none">Stock</TabsTrigger>
          <TabsTrigger value="po" className="flex-1 sm:flex-none">Purchase orders</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Stock register</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ModuleTable
                rows={inventoryItems}
                columns={[
                  { key: 'name', header: 'Item', mobile: 'title', cell: i => i.name },
                  { key: 'category', header: 'Category', mobile: 'subtitle', cell: i => `${i.category} · ${i.location}` },
                  { key: 'qty', header: 'Qty', mobile: 'meta', cell: i => `${i.qty} ${i.unit}` },
                  { key: 'min', header: 'Reorder at', mobile: 'meta', cell: i => `${i.min}` },
                  { key: 'value', header: 'Value', mobile: 'meta', cell: i => inr(i.value) },
                  { key: 'status', header: 'Status', mobile: 'badge', cell: i => <StatusBadge status={i.status} /> },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="po" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Purchase orders</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ModuleTable
                rows={purchaseOrders}
                columns={[
                  { key: 'id', header: 'PO', mobile: 'title', cell: p => p.id },
                  { key: 'vendor', header: 'Vendor', mobile: 'subtitle', cell: p => p.vendor },
                  { key: 'items', header: 'Items', mobile: 'meta', cell: p => `${p.items}` },
                  { key: 'amount', header: 'Amount', mobile: 'meta', cell: p => inr(p.amount) },
                  { key: 'raised', header: 'Raised', mobile: 'meta', cell: p => p.raised },
                  { key: 'status', header: 'Status', mobile: 'badge', cell: p => <StatusBadge status={p.status} /> },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ModulePage>
  );
}