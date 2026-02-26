import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, MapPin, Phone, Loader2 } from 'lucide-react';
import { useStudentTransport } from '@/hooks/useTransport';
import { EmptyState } from '@/components/ui/data-states';

export default function StudentTransportPage() {
  const { data: transport = [], isLoading } = useStudentTransport();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">My Transport</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Your bus route and pickup details</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : transport.length === 0 ? (
          <EmptyState icon={Bus} title="No transport assigned" description="You haven't been assigned to any bus route yet." />
        ) : (
          <div className="space-y-3">
            {transport.map(t => (
              <Card key={t.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bus className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{t.route?.route_name}</span>
                    {t.route?.route_number && <Badge variant="outline" className="text-xs">#{t.route.route_number}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {t.route?.vehicle_number && <p>🚌 {t.route.vehicle_number}</p>}
                    {t.route?.driver_name && (
                      <p>👤 {t.route.driver_name}{t.route.driver_phone && ` • ${t.route.driver_phone}`}</p>
                    )}
                    {t.pickup_stop && <p><MapPin className="w-3.5 h-3.5 inline mr-1" />Pickup: {t.pickup_stop}</p>}
                    {t.drop_stop && <p><MapPin className="w-3.5 h-3.5 inline mr-1" />Drop: {t.drop_stop}</p>}
                  </div>
                  <Badge className="capitalize text-xs">{t.boarding_type}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
