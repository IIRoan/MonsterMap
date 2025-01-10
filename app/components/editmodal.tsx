import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import AddressInput from "@/app/components/addressinput";
import type { Location } from "@/types/Location";

interface EditLocationModalProps {
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
  onLocationUpdated: () => void;
}

export default function EditLocationModal({
  location,
  isOpen,
  onClose,
  onLocationUpdated,
}: EditLocationModalProps) {
  const [formData, setFormData] = useState<Partial<Location>>({});
  const [loading, setLoading] = useState(false);
  const [variantInput, setVariantInput] = useState("");

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        coordinates: location.coordinates,
        variants: [...location.variants]
      });
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/locations/${location?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Update failed');
      
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
      
      onLocationUpdated();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariant = () => {
    if (variantInput && !formData.variants?.includes(variantInput)) {
      setFormData(prev => ({
        ...prev,
        variants: [...(prev.variants || []), variantInput]
      }));
      setVariantInput("");
    }
  };

  const removeVariant = (variant: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants?.filter(v => v !== variant)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 text-white backdrop-blur-lg border-white/5 sm:max-w-2xl">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 className="text-2xl font-light tracking-wider text-[#95ff00] mb-6">Edit Location</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Store Name</label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Address</label>
                <AddressInput
                  defaultValue={formData.address}
                  onSelect={(suggestion) => {
                    setFormData(prev => ({
                      ...prev,
                      address: suggestion.address,
                      coordinates: [suggestion.lat, suggestion.lng]
                    }));
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Latitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.coordinates?.[0] || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      coordinates: [parseFloat(e.target.value), prev.coordinates?.[1] || 0]
                    }))}
                    className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Longitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.coordinates?.[1] || ''}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      coordinates: [prev.coordinates?.[0] || 0, parseFloat(e.target.value)]
                    }))}
                    className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Variants</label>
                <div className="flex gap-2">
                  <Input
                    value={variantInput}
                    onChange={e => setVariantInput(e.target.value)}
                    className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50"
                    placeholder="Add variant..."
                  />
                  <Button
                    type="button"
                    onClick={handleAddVariant}
                    className="bg-[#95ff00]/10 hover:bg-[#95ff00]/20 text-[#95ff00] border-0"
                  >
                    Add
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.variants?.map(variant => (
                    <span
                      key={variant}
                      className="flex items-center rounded-full bg-[#95ff00]/10 px-2 py-0.5 text-xs text-[#95ff00]"
                    >
                      {variant}
                      <button
                        type="button"
                        onClick={() => removeVariant(variant)}
                        className="ml-2 text-white/50 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={onClose}
                  className="bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#95ff00] text-black hover:bg-[#95ff00]/90"
                >
                  {loading ? "Updating..." : "Update Location"}
                </Button>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}