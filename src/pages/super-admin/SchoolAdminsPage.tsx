import { useState, useEffect } from 'react';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Building2, Mail, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface School {
  id: string;
  name: string;
  code: string;
}

interface SchoolAdmin {
  id: string;
  email: string;
  full_name: string;
  school_id: string | null;
  school?: School;
}

export default function SchoolAdminsPage() {
  const [admins, setAdmins] = useState<SchoolAdmin[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    schoolId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name, code')
        .order('name');

      if (schoolsError) throw schoolsError;
      setSchools(schoolsData || []);

      // Fetch school admins from profiles with school_admin role
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'school_admin');

      if (rolesError) throw rolesError;

      if (rolesData && rolesData.length > 0) {
        const userIds = rolesData.map((r) => r.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name, school_id')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Map school data to admins
        const adminsWithSchools = (profilesData || []).map((admin) => ({
          ...admin,
          school: schoolsData?.find((s) => s.id === admin.school_id),
        }));

        setAdmins(adminsWithSchools);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with school_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ school_id: formData.schoolId })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        // Add school_admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'school_admin',
          });

        if (roleError) throw roleError;

        toast.success('School admin created successfully! They will need to verify their email.');
        setIsDialogOpen(false);
        setFormData({ email: '', password: '', fullName: '', schoolId: '' });
        fetchData();
      }
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.school?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SuperAdminLayout title="School Admins">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add School Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add School Admin</DialogTitle>
                <DialogDescription>
                  Create a new school administrator account
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@school.com"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="school">Assign to School *</Label>
                    <Select
                      value={formData.schoolId}
                      onValueChange={(value) => setFormData({ ...formData, schoolId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name} ({school.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Admin'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              School Administrators ({filteredAdmins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No school admins found</p>
                <p className="text-sm mt-1">
                  {searchQuery ? 'Try a different search term' : 'Add a school admin to get started'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Assigned School</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                              {admin.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <span className="font-medium">{admin.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {admin.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {admin.school ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span>{admin.school.name}</span>
                              <span className="text-xs text-muted-foreground">({admin.school.code})</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
