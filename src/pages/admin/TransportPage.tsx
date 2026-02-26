import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Bus, Edit2, Trash2, Search, Loader2, MapPin, Phone, Users } from 'lucide-react';
import { useTransportRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute, TransportRoute } from '@/hooks/useTransport';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmptyState } from '@/components/ui/data-states';

const defaultRouteForm = {
  route_name: '',
  route_number: '',
  driver_name: '',
  driver_phone: '',
  vehicle_number: '',
  capacity: 40,
  start_location: '',
  end_location: '',
};

export default function TransportPage() {
  const schoolId = useEffectiveSchoolId();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);
  const [form, setForm] = useState(defaultRouteForm);

  const { data: routes = [], isLoading } = useTransportRoutes();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();

  const filteredRoutes = routes.filter(r =>
    r.route_name.toLowerCase().includes(search.toLowerCase()) ||
    r.vehicle_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.driver_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateRoute = () => {
    setEditingRoute(null);
    setForm(defaultRouteForm);
    setRouteDialogOpen(true);
  };

  const openEditRoute = (r: TransportRoute) => {
    setEditingRoute(r);
    setForm({
      route_name: r.route_name,
      route_number: r.route_number || '',
      driver_name: r.driver_name || '',
      driver_phone: r.driver_phone || '',
      vehicle_number: r.vehicle_number || '',
      capacity: r.capacity,
      start_location: r.start_location || '',
      end_location: r.end_location || '',
    });
    setRouteDialogOpen(true);
  };

  const handleRouteSubmit = () => {
    if (!form.route_name) return;
    const payload = {
      ...form,
      school_id: schoolId,
      route_number: form.route_number || null,
      driver_name: form.driver_name || null,
      driver_phone: form.driver_phone || null,
      vehicle_number: form.vehicle_number || null,
      start_location: form.start_location || null,
      end_location: form.end_location || null,
    };
    setRouteDialogOpen(false);
    if (editingRoute) {
      updateRoute.mutate({ id: editingRoute.id, ...payload });
    } else {
      createRoute.mutate(payload);
    }
  };

  const routeFormJsx = (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label>Route Name *</Label>
        <Input value={form.route_name} onChange={e => setForm(f => ({ ...f, route_name: e.target.value }))} placeholder="e.g. Route 1 - North" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Route Number</Label>
          <Input value={form.route_number} onChange={e => setForm(f => ({ ...f, route_number: e.target.value }))} placeholder="e.g. R-01" />
        </div>
        <div className="grid gap-2">
          <Label>Vehicle Number</Label>
          <Input value={form.vehicle_number} onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value }))} placeholder="e.g. KA-01-1234" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Driver Name</Label>
          <Input value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label>Driver Phone</Label>
          <Input value={form.driver_phone} onChange={e => setForm(f => ({ ...f, driver_phone: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Start Location</Label>
          <Input value={form.start_location} onChange={e => setForm(f => ({ ...f, start_location: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label>End Location</Label>
          <Input value={form.end_location} onChange={e => setForm(f => ({ ...f, end_location: e.target.value }))} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Capacity</Label>
        <Input type="text" inputMode="numeric" value={form.capacity || ''} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setForm(f => ({ ...f, capacity: v ? parseInt(v) : 0 })); }} placeholder="e.g. 40" />
      </div>
    </div>
  );

  const routeFormTitle = editingRoute ? 'Edit Route' : 'Add Route';
  const routeSubmitLabel = editingRoute ? 'Save Changes' : 'Create Route';
  const isSubmitting = createRoute.isPending || updateRoute.isPending;

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Transport Management</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Manage bus routes and drivers</p>
          </div>
          <Button onClick={openCreateRoute} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Add Route
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search routes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filteredRoutes.length === 0 ? (
          <EmptyState icon={Bus} title="No transport routes" description="Add your first bus route to get started." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRoutes.map(route => (
              <Card key={route.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Bus className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{route.route_name}</p>
                        {route.route_number && <p className="text-xs text-muted-foreground">#{route.route_number}</p>}
                      </div>
                    </div>
                    <Badge variant={route.is_active ? 'default' : 'secondary'} className="text-xs">
                      {route.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {route.vehicle_number && <p>🚌 {route.vehicle_number}</p>}
                    {route.driver_name && (
                      <div className="flex items-center gap-1">
                        <span>👤 {route.driver_name}</span>
                        {route.driver_phone && <span>• <Phone className="w-3 h-3 inline" /> {route.driver_phone}</span>}
                      </div>
                    )}
                    {(route.start_location || route.end_location) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{route.start_location || '—'} → {route.end_location || '—'}</span>
                      </div>
                    )}
                    <p><Users className="w-3 h-3 inline" /> Capacity: {route.capacity}</p>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEditRoute(route)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => deleteRoute.mutate(route.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Route Form Dialog/Drawer */}
      {isMobile ? (
        <Drawer open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
          <DrawerContent className="max-h-[90dvh] flex flex-col bg-background">
            <DrawerHeader className="text-left"><DrawerTitle>{routeFormTitle}</DrawerTitle></DrawerHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-4">{routeFormJsx}</div>
            <DrawerFooter className="flex-row gap-2">
              <Button variant="outline" onClick={() => setRouteDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleRouteSubmit} disabled={isSubmitting} className="flex-1">{routeSubmitLabel}</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{routeFormTitle}</DialogTitle></DialogHeader>
            {routeFormJsx}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRouteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRouteSubmit} disabled={isSubmitting}>{routeSubmitLabel}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
