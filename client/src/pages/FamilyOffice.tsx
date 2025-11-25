import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Users, Plus, Crown, Eye, Trash2, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getLoginUrl } from "@/const";
import { formatINR } from "@/lib/currency";

/**
 * AETHER V5 - Family Office Mode
 * Multi-user wealth management with hierarchical permissions
 */
export default function FamilyOffice() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"family_admin" | "family_viewer">("family_viewer");

  const utils = trpc.useUtils();

  // Fetch family group data
  const { data: familyGroup } = trpc.family.getGroup.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: familyMembers } = trpc.family.getMembers.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: consolidatedWealth } = trpc.family.getConsolidatedWealth.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const createFamilyMutation = trpc.family.createFamily.useMutation({
    onSuccess: () => {
      toast.success("Family group created!");
      utils.family.getGroup.invalidate();
    },
  });

  const inviteMemberMutation = trpc.family.inviteMember.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent!");
      setInviteDialogOpen(false);
      setInviteEmail("");
      utils.family.getMembers.invalidate();
    },
  });

  const removeMemberMutation = trpc.family.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      utils.family.getMembers.invalidate();
      utils.family.getConsolidatedWealth.invalidate();
    },
  });

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleCreateFamily = () => {
    const familyName = prompt("Enter family name:");
    if (familyName) {
      createFamilyMutation.mutate({ name: familyName });
    }
  };

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error("Please enter an email");
      return;
    }
    inviteMemberMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
    });
  };

  const handleRemoveMember = (userId: number) => {
    if (confirm("Are you sure you want to remove this member?")) {
      removeMemberMutation.mutate({ userId });
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "family_admin";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Family Office</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container section-padding">
        {!familyGroup ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Create Your Family Office</h2>
              <p className="text-muted-foreground">
                Manage wealth across generations with consolidated dashboards and role-based access
              </p>
            </div>

            <Card className="p-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Crown className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-semibold">Family Admin</h3>
                  <p className="text-sm text-muted-foreground">Full control over all assets and members</p>
                </div>
                <div className="space-y-2">
                  <Eye className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-semibold">Family Viewer</h3>
                  <p className="text-sm text-muted-foreground">View-only access to consolidated wealth</p>
                </div>
                <div className="space-y-2">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-semibold">Consolidated View</h3>
                  <p className="text-sm text-muted-foreground">See total family net worth across all members</p>
                </div>
              </div>

              <Button size="lg" onClick={handleCreateFamily} className="w-full">
                <Plus className="h-5 w-5 mr-2" />
                Create Family Group
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Consolidated Wealth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Consolidated Family Wealth</h2>
                {isAdmin && (
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Family Member</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Email</label>
                          <Input
                            type="email"
                            placeholder="member@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Role</label>
                          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="family_admin">Family Admin (Full Access)</SelectItem>
                              <SelectItem value="family_viewer">Family Viewer (Read-Only)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleInvite} className="w-full">
                          Send Invitation
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Total Family Net Worth</p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatINR(consolidatedWealth?.totalNetWorth || 0)}
                  </p>
                  <p className="text-sm text-success mt-1">
                    +{consolidatedWealth?.yearToDateReturn || 0}% this year
                  </p>
                </Card>

                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Total Assets</p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatINR(consolidatedWealth?.totalAssets || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Across {consolidatedWealth?.assetCount || 0} holdings
                  </p>
                </Card>

                <Card className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Family Members</p>
                  <p className="text-3xl font-bold text-foreground">{familyMembers?.length || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {familyMembers?.filter((m: any) => m.role === "family_admin").length || 0} admins
                  </p>
                </Card>
              </div>
            </motion.div>

            {/* Family Members */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-xl font-bold text-foreground mb-4">Family Members</h3>
              <Card className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Net Worth</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {familyMembers?.map((member: any) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name || "—"}</TableCell>
                        <TableCell>{member.email || "—"}</TableCell>
                        <TableCell>
                          <span className={member.role === "family_admin" ? "text-primary font-medium" : ""}>
                            {member.role === "family_admin" ? "Admin" : "Viewer"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatINR(member.netWorth || 0)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {member.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
