"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import AddressInput from "@/app/components/addressinput"

interface LocationSubmission {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    variants: string[];
}

export default function SubmitLocation() {
    const router = useRouter();
    const [formData, setFormData] = useState<LocationSubmission>({
        name: "",
        address: "",
        latitude: 0,
        longitude: 0,
        variants: []
    });
    const [variantInput, setVariantInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [variantSuggestions, setVariantSuggestions] = useState<string[]>([]);
    const [showVariantSuggestions, setShowVariantSuggestions] = useState(false);

    const handleVariantSelect = (variant: string) => {
        if (!formData.variants.includes(variant)) {
            setFormData(prev => ({
                ...prev,
                variants: [...prev.variants, variant]
            }));
        }
        setVariantInput('');
        setShowVariantSuggestions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/locations/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Submission failed');
            setSubmitted(true);
            setTimeout(() => router.push('/'), 2000);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to submit location",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchVariants = async (input: string) => {
        if (input.length < 2) return [];
        const response = await fetch('/api/variants/search?q=' + encodeURIComponent(input));
        return response.json();
    };

    return (
        <div className="min-h-screen bg-black bg-[radial-gradient(rgba(149,255,0,0.1)_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="container mx-auto max-w-2xl py-12">
                <AnimatePresence>
                    {!submitted ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <Card className="bg-black/95 text-white backdrop-blur-lg border-white/5">
                                <CardHeader>
                                    <h1 className="text-2xl font-light tracking-wider text-[#95ff00]">Submit New Location</h1>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm text-white/70">Store Name</label>
                                            <Input
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50 focus-visible:ring-offset-0"
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
                                                        latitude: suggestion.lat,
                                                        longitude: suggestion.lng
                                                    }));
                                                }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm text-white/70">Latitude</label>
                                                <Input
                                                    required
                                                    type="number"
                                                    step="any"
                                                    value={formData.latitude || ""}
                                                    onChange={e => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                                                    className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50 focus-visible:ring-offset-0"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm text-white/70">Longitude</label>
                                                <Input
                                                    required
                                                    type="number"
                                                    step="any"
                                                    value={formData.longitude || ""}
                                                    onChange={e => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                                                    className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50 focus-visible:ring-offset-0"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm text-white/70">Variants Available</label>
                                            <div className="relative">
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={variantInput}
                                                        onChange={async (e) => {
                                                            setVariantInput(e.target.value);
                                                            const suggestions = await fetchVariants(e.target.value);
                                                            setVariantSuggestions(suggestions);
                                                            setShowVariantSuggestions(true);
                                                        }}
                                                        onFocus={() => setShowVariantSuggestions(true)}
                                                        className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50 focus-visible:ring-offset-0"
                                                        placeholder="Add variant..."
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleVariantSelect(variantInput)}
                                                        className="bg-[#95ff00]/10 hover:bg-[#95ff00]/20 text-[#95ff00] border-0"
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                                {showVariantSuggestions && variantSuggestions.length > 0 && (
                                                    <div className="absolute top-full left-0 w-full z-50 mt-1">
                                                        <div className="bg-black border border-white/10 rounded-md shadow-lg">
                                                            {variantSuggestions.map((variant, index) => (
                                                                <div
                                                                    key={index}
                                                                    onClick={() => handleVariantSelect(variant)}
                                                                    className="px-3 py-2 text-white hover:bg-white/5 cursor-pointer"
                                                                >
                                                                    {variant}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {formData.variants.map(variant => (
                                                    <span
                                                        key={variant}
                                                        className="flex items-center rounded-full bg-[#95ff00]/10 px-2 py-0.5 text-xs text-[#95ff00]"
                                                    >
                                                        {variant}
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                variants: prev.variants.filter(v => v !== variant)
                                                            }))}
                                                            className="ml-2 text-white/50 hover:text-white"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-[#95ff00] text-black hover:bg-[#95ff00]/90 transition-colors"
                                        >
                                            {loading ? "Submitting..." : "Submit Location"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center space-y-4"
                        >
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 360]
                                }}
                                transition={{
                                    duration: 1,
                                    ease: "easeInOut",
                                }}
                                className="text-6xl text-[#95ff00]"
                            >
                                ✓
                            </motion.div>
                            <h2 className="text-2xl font-light text-white">Thank you for your submission!</h2>
                            <p className="text-white/70">Redirecting you back...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}