import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, Save, Loader2 } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export function SubscriptionPricingSettings() {
  const { getSetting, updateSetting } = useSystemSettings();

  const pricing = getSetting('subscription_pricing', {
    price_per_student: 250,
    currency: 'INR',
    billing_cycle: 'yearly',
  });

  const [pricePerStudent, setPricePerStudent] = useState(String(pricing.price_per_student));

  useEffect(() => {
    setPricePerStudent(String(pricing.price_per_student));
  }, [pricing.price_per_student]);

  const handleSave = () => {
    const price = parseInt(pricePerStudent);
    if (!price || price <= 0) return;

    updateSetting.mutate({
      key: 'subscription_pricing',
      value: {
        price_per_student: price,
        currency: 'INR',
        billing_cycle: 'yearly',
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-primary" />
          Subscription Pricing
        </CardTitle>
        <CardDescription>
          Configure the yearly subscription pricing per student. This applies to all new and renewal subscriptions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="pricePerStudent">Price Per Student (₹/year)</Label>
          <Input
            id="pricePerStudent"
            type="number"
            min="1"
            value={pricePerStudent}
            onChange={(e) => setPricePerStudent(e.target.value)}
            placeholder="250"
          />
          <p className="text-xs text-muted-foreground">
            Example: {parseInt(pricePerStudent) || 0} × 100 students = ₹{((parseInt(pricePerStudent) || 0) * 100).toLocaleString()}/year
          </p>
        </div>

        <Button onClick={handleSave} disabled={updateSetting.isPending}>
          {updateSetting.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Pricing
        </Button>
      </CardContent>
    </Card>
  );
}
