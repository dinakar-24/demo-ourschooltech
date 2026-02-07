import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  KeyRound,
  Copy,
} from 'lucide-react';
import { useManageUser } from '@/hooks/useManageUser';
import { toast } from 'sonner';

interface UserActionsMenuProps {
  userId: string;
  userName: string;
  userEmail: string;
  isDisabled?: boolean;
  isSelf?: boolean;
  onActionComplete: () => void;
  // For edit dialog
  currentFullName?: string;
  currentPhone?: string;
}

export function UserActionsMenu({
  userId,
  userName,
  userEmail,
  isDisabled = false,
  isSelf = false,
  onActionComplete,
  currentFullName,
  currentPhone,
}: UserActionsMenuProps) {
  const { manageUser, isProcessing } = useManageUser();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [tempPassDialogOpen, setTempPassDialogOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: currentFullName || userName,
    phone: currentPhone || '',
  });

  const handleDelete = async () => {
    const result = await manageUser({ action: 'delete', user_id: userId });
    if (result.success) {
      setDeleteOpen(false);
      onActionComplete();
    }
  };

  const handleToggleDisable = async () => {
    const action = isDisabled ? 'enable' : 'disable';
    const result = await manageUser({ action, user_id: userId });
    if (result.success) {
      setDisableOpen(false);
      onActionComplete();
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await manageUser({
      action: 'update_profile',
      user_id: userId,
      full_name: editForm.full_name,
      phone: editForm.phone,
    });
    if (result.success) {
      setEditOpen(false);
      onActionComplete();
    }
  };

  const handleResetPassword = async () => {
    const result = await manageUser({ action: 'reset_password', user_id: userId });
    if (result.success && result.temp_password) {
      setTempPassword(result.temp_password);
      setResetOpen(false);
      setTempPassDialogOpen(true);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    toast.success('Password copied to clipboard');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isProcessing}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => { setEditForm({ full_name: currentFullName || userName, phone: currentPhone || '' }); setEditOpen(true); }}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetOpen(true)}>
            <KeyRound className="w-4 h-4 mr-2" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!isSelf && (
            <DropdownMenuItem onClick={() => setDisableOpen(true)} className={isDisabled ? 'text-green-600' : 'text-yellow-600'}>
              {isDisabled ? <CheckCircle className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
              {isDisabled ? 'Enable User' : 'Disable User'}
            </DropdownMenuItem>
          )}
          {!isSelf && (
            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{userName}</strong> ({userEmail})? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable/Enable Confirmation */}
      <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isDisabled ? 'Enable' : 'Disable'} User</AlertDialogTitle>
            <AlertDialogDescription>
              {isDisabled
                ? `This will re-enable ${userName}'s access to the system.`
                : `This will prevent ${userName} from logging in. They won't lose any data.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleDisable} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : isDisabled ? 'Enable' : 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update {userName}'s profile information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Generate a temporary password for <strong>{userName}</strong>. You'll need to share it with them securely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} disabled={isProcessing}>
              {isProcessing ? 'Resetting...' : 'Reset Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Temporary Password Display */}
      <Dialog open={tempPassDialogOpen} onOpenChange={setTempPassDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Temporary Password</DialogTitle>
            <DialogDescription>
              Share this password securely with {userName}. They should change it after login.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
            <span className="flex-1 break-all">{tempPassword}</span>
            <Button variant="ghost" size="icon" onClick={copyPassword} className="shrink-0">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
