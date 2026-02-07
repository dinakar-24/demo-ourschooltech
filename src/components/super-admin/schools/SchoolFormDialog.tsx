import { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, X } from 'lucide-react';
import { IndianPhoneInput } from '@/components/ui/indian-phone-input';

interface SchoolFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo: string;
}

interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
  created_at: string;
}

interface SchoolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSchool: School | null;
  onSubmit: (data: SchoolFormData, logoPreview: string | null) => Promise<void>;
  isSubmitting: boolean;
}

const initialFormData: SchoolFormData = {
  name: '',
  code: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  logo: '',
};

export const SchoolFormDialog = memo(function SchoolFormDialog({
  open,
  onOpenChange,
  editingSchool,
  onSubmit,
  isSubmitting,
}: SchoolFormDialogProps) {
  const [formData, setFormData] = useState<SchoolFormData>(initialFormData);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Reset form when dialog opens/closes or editing school changes
  useEffect(() => {
    if (open) {
      if (editingSchool) {
        setFormData({
          name: editingSchool.name,
          code: editingSchool.code,
          address: editingSchool.address,
          city: editingSchool.city,
          phone: editingSchool.phone || '',
          email: editingSchool.email || '',
          logo: editingSchool.logo || '',
        });
        setLogoPreview(editingSchool.logo || null);
      } else {
        setFormData(initialFormData);
        setLogoPreview(null);
      }
    }
  }, [open, editingSchool]);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeLogo = useCallback(() => {
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo: '' }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData, logoPreview);
  };

  const handleFieldChange = useCallback((field: keyof SchoolFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
          <DialogDescription>
            {editingSchool ? 'Update school details' : 'Enter the details of the new school'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Delhi Public School"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">School Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                  placeholder="DPS001"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  placeholder="New Delhi"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="123, Main Road"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <IndianPhoneInput
                  id="phone"
                  value={formData.phone}
                  onChange={(v) => handleFieldChange('phone', v)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="school@example.com"
                />
              </div>
            </div>
            
            {/* Logo Upload */}
            <div className="grid gap-2">
              <Label>School Logo (Optional)</Label>
              {logoPreview ? (
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg border overflow-hidden bg-muted">
                    <img 
                      src={logoPreview} 
                      alt="School logo preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                  <span className="text-sm text-muted-foreground">PNG, JPG up to 2MB</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingSchool ? 'Update School' : 'Add School'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});
