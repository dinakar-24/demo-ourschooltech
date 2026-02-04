import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Bell,
  Edit,
  Trash2,
  Eye,
  Send,
  Calendar,
  Users,
  AlertCircle,
} from 'lucide-react';

const mockAnnouncements = [
  {
    id: '1',
    title: 'Annual Sports Day',
    message: 'Annual Sports Day will be held on 28th January 2024. All students are requested to participate actively. Parents are cordially invited.',
    priority: 'high',
    targetRoles: ['teacher', 'parent', 'student'],
    createdAt: '2024-01-15',
    createdBy: 'Admin',
    status: 'published',
  },
  {
    id: '2',
    title: 'Parent Teacher Meeting',
    message: 'PTM scheduled for Class 8, 9, and 10 on 25th January 2024. Please report to the school auditorium at 10:00 AM.',
    priority: 'medium',
    targetRoles: ['parent', 'teacher'],
    createdAt: '2024-01-14',
    createdBy: 'Admin',
    status: 'published',
  },
  {
    id: '3',
    title: 'Holiday Notice - Republic Day',
    message: 'School will remain closed on 26th January 2024 on account of Republic Day.',
    priority: 'low',
    targetRoles: ['teacher', 'parent', 'student'],
    createdAt: '2024-01-13',
    createdBy: 'Admin',
    status: 'published',
  },
  {
    id: '4',
    title: 'Fee Payment Reminder',
    message: 'This is to remind all parents that the last date for fee payment is 31st January 2024. Late fee will be applicable after the due date.',
    priority: 'high',
    targetRoles: ['parent'],
    createdAt: '2024-01-12',
    createdBy: 'Admin',
    status: 'draft',
  },
];

export default function AnnouncementsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  return (
    <AdminLayout title="Announcements">
      <div className="space-y-6 animate-fade-up">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Announcements</p>
              <p className="text-2xl font-bold text-foreground">24</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold text-success">20</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold text-warning">4</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-primary">8</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="Enter announcement title" />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea 
                    placeholder="Enter announcement message..." 
                    className="min-h-[120px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Publish Date</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <div className="flex gap-4 pt-2">
                    {['teacher', 'parent', 'student'].map(role => (
                      <div key={role} className="flex items-center gap-2">
                        <Checkbox 
                          id={role}
                          checked={selectedRoles.includes(role)}
                          onCheckedChange={() => toggleRole(role)}
                        />
                        <label htmlFor={role} className="text-sm capitalize cursor-pointer">
                          {role}s
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Save as Draft
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  <Send className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {mockAnnouncements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      announcement.priority === 'high' ? 'bg-destructive/10' :
                      announcement.priority === 'medium' ? 'bg-warning/10' :
                      'bg-muted'
                    }`}>
                      <Bell className={`w-5 h-5 ${
                        announcement.priority === 'high' ? 'text-destructive' :
                        announcement.priority === 'medium' ? 'text-warning' :
                        'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        {getPriorityBadge(announcement.priority)}
                        {announcement.status === 'draft' && (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {announcement.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {announcement.createdAt}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {announcement.targetRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon-sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
