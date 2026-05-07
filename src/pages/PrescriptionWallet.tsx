"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, Search, FileText, Calendar, Phone, Building2, Trash2, Loader2, AlertCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { usePrescriptions, useAddPrescription, useRemovePrescription, useFamilyMembers, useQueryClient } from "@/hooks/use-queries";
import { QUERY_KEYS } from "@/lib/query-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Prescription } from "@/utils/storage";
import { Alert, AlertTitle } from "@/components/ui/alert";
import DynamicAIInsight from "@/components/DynamicAIInsight";

const PrescriptionWallet = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMember, setFilterMember] = useState("all");
  const [formError, setFormError] = useState<string | null>(null);
  const { data: prescriptions = [], isLoading: rxLoading } = usePrescriptions();
  const { data: familyMembers = [], isLoading: membersLoading } = useFamilyMembers();
  const addPrescription = useAddPrescription();
  const removePrescription = useRemovePrescription();
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60",
    pharmacyName: "",
    pharmacyPhone: "",
    expiryDate: "",
    familyMemberId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.familyMemberId || !formData.expiryDate) {
      setFormError("Please fill in all required fields");
      return;
    }
    setFormError(null);
    try {
      const newPrescription = await addPrescription.mutateAsync(formData);
      queryClient.setQueryData(QUERY_KEYS.prescriptions, (prev: Prescription[] | undefined) => [newPrescription, ...(prev || [])]);
      setShowAdd(false);
      setFormData({
        title: "",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60",
        pharmacyName: "",
        pharmacyPhone: "",
        expiryDate: "",
        familyMemberId: "",
      });
      toast.success("Prescription added to wallet!");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to add prescription");
      toast.error("Failed to add prescription");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this prescription?")) {
      try {
        await removePrescription.mutateAsync(id);
        toast.success("Prescription removed");
      } catch (error) {
        toast.error("Failed to remove prescription");
      }
    }
  };

  const filteredRx = prescriptions.filter((rx) => {
    const matchesSearch = rx.title.toLowerCase().includes(search.toLowerCase()) ||
      rx.pharmacyName.toLowerCase().includes(search.toLowerCase());
    const matchesMember = filterMember === "all" || rx.familyMemberId === filterMember;
    return matchesSearch && matchesMember;
  });

  const isExpired = (date: string) => new Date(date) < new Date();

  const isLoading = rxLoading || membersLoading;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-purple-50/30 pb-32 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 text-purple-700 hover:bg-purple-100">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Prescription Wallet</h1>
          <p className="text-purple-600 font-medium">Securely store and manage your medical documents.</p>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100">
              <Plus className="w-4 h-4 mr-2" /> Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Prescription</DialogTitle>
            </DialogHeader>

            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle className="text-sm font-medium">{formError}</AlertTitle>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Family Member *</Label>
                  <Select
                    value={formData.familyMemberId}
                    onValueChange={(v) => setFormData({ ...formData, familyMemberId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Document Title *</Label>
                  <Input
                    placeholder="e.g. Annual Eye Exam"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pharmacy Name</Label>
                    <Input
                      placeholder="CVS Pharmacy"
                      value={formData.pharmacyName}
                      onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pharmacy Phone</Label>
                    <Input
                      placeholder="555-0123"
                      value={formData.pharmacyPhone}
                      onChange={(e) => setFormData({ ...formData, pharmacyPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Expiry Date *</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-purple-600"
                  disabled={addPrescription.isPending}
                >
                  {addPrescription.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save to Wallet"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by title or pharmacy..."
              className="pl-10 bg-white border-purple-100 focus-visible:ring-purple-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 flex gap-2">
            <div className="flex-1 relative">
              <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Select value={filterMember} onValueChange={setFilterMember}>
                <SelectTrigger className="pl-10 bg-white border-purple-100">
                  <SelectValue placeholder="Filter by member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {familyMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading
            ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                <p className="text-sm text-muted-foreground font-medium">Opening your wallet...</p>
              </div>
            )
            : filteredRx.length === 0
            ? (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-purple-100">
                <FileText className="w-16 h-16 text-purple-100 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No documents found</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-1">
                  {search || filterMember !== "all"
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Start by adding your first prescription or medical document to your digital wallet."}
                </p>
              </div>
            )
            : (
              <div className="col-span-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredRx.map((rx) => {
                      const member = familyMembers.find((m) => m.id === rx.familyMemberId);
                      const expired = isExpired(rx.expiryDate);
                      return (
                        <motion.div
                          key={rx.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={cn(
                            "overflow-hidden border-none shadow-md hover:shadow-xl transition-all group rounded-2xl",
                            expired ? "bg-rose-50/50" : "bg-white"
                          )}
                        >
                          <div className="relative h-40 bg-gray-100 overflow-hidden">
                            <img
                              src={rx.imageUrl}
                              alt={rx.title}
                              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                              <div>
                                <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                                  {member?.name || "Unknown"}
                                </p>
                                <h3 className="text-white font-bold line-clamp-1">{rx.title}</h3>
                              </div>
                              {expired && (
                                <div className="bg-rose-600 text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-lg">
                                  <AlertCircle className="w-3 h-3" />
                                  EXPIRED
                                </div>
                              )}
                            </div>
                          </div>

                          <CardContent className="p-4 space-y-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Building2 className="w-3.5 h-3.5 text-purple-500" />
                                <span className="font-medium">{rx.pharmacyName || "No pharmacy listed"}</span>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Phone className="w-3.5 h-3.5 text-purple-500" />
                                <span>{rx.pharmacyPhone || "No phone listed"}</span>
                              </div>
                            </div>

                            <div className={cn(
                              "flex items-center gap-2 text-xs font-medium",
                              expired ? "text-rose-600" : "text-gray-600"
                            )}>
                              <Calendar className="w-3.5 h-3.5 text-purple-500" />
                              <span>Expires: {new Date(rx.expiryDate).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="pt-2 flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8"
                                onClick={() => handleDelete(rx.id)}
                                disabled={removePrescription.isPending}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                              </Button>
                            </div>
                          </CardContent>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
        </div>

        <div className="mt-8">
          <DynamicAIInsight />
        </div>
      </div>
    </motion.div>
  );
};

export default PrescriptionWallet;