"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import AddressInput from "@/app/components/addressinput";
import DOMPurify from "dompurify";

interface LocationSubmission {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  variants: string[];
  submissionToken?: string;
}

interface ValidationErrors {
  name?: string;
  address?: string;
  coordinates?: string;
  general?: string;
}

const SUBMISSION_COOLDOWN = 12000; // 20 seconds cooldown between submissions
const MAX_SUBMISSIONS_PER_DAY = 10;
const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 200;
const MAX_VARIANTS = 20;
const MAX_VARIANT_LENGTH = 50;

export default function SubmitLocation() {
  const router = useRouter();
  const [formData, setFormData] = useState<LocationSubmission>({
    name: "",
    address: "",
    latitude: 0,
    longitude: 0,
    variants: [],
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [variantInput, setVariantInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [variantSuggestions, setVariantSuggestions] = useState<string[]>([]);
  const [showVariantSuggestions, setShowVariantSuggestions] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);
  const [dailySubmissionCount, setDailySubmissionCount] = useState<number>(0);
  const [submissionToken, setSubmissionToken] = useState<string>("");

  useEffect(() => {
    // Load submission history from localStorage
    const storedLastSubmission = localStorage.getItem("lastSubmissionTime");
    const storedDailyCount = localStorage.getItem("dailySubmissionCount");
    const lastDate = localStorage.getItem("lastSubmissionDate");

    if (storedLastSubmission) {
      setLastSubmissionTime(parseInt(storedLastSubmission));
    }

    // Reset daily count if it's a new day
    const today = new Date().toDateString();
    if (lastDate !== today) {
      localStorage.setItem("dailySubmissionCount", "0");
      localStorage.setItem("lastSubmissionDate", today);
      setDailySubmissionCount(0);
    } else if (storedDailyCount) {
      setDailySubmissionCount(parseInt(storedDailyCount));
    }

    // Get CSRF token
    fetchSubmissionToken();
  }, []);

  const fetchSubmissionToken = async () => {
    try {
      const response = await fetch("/api/csrf-token");
      const data = await response.json();
      setSubmissionToken(data.token);
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    }
  };

  const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input.trim());
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Check submission rate limits
    const currentTime = Date.now();
    if (currentTime - lastSubmissionTime < SUBMISSION_COOLDOWN) {
      newErrors.general = `Please wait ${Math.ceil(
        (SUBMISSION_COOLDOWN - (currentTime - lastSubmissionTime)) / 1000
      )} seconds before submitting again`;
      isValid = false;
    }

    if (dailySubmissionCount >= MAX_SUBMISSIONS_PER_DAY) {
      newErrors.general =
        "Daily submission limit reached. Please try again tomorrow";
      isValid = false;
    }

    // Validate name
    const sanitizedName = sanitizeInput(formData.name);
    if (!sanitizedName) {
      newErrors.name = "Store name is required";
      isValid = false;
    } else if (sanitizedName.length > MAX_NAME_LENGTH) {
      newErrors.name = `Store name must be less than ${MAX_NAME_LENGTH} characters`;
      isValid = false;
    }

    // Validate address
    const sanitizedAddress = sanitizeInput(formData.address);
    if (!sanitizedAddress) {
      newErrors.address = "Address is required";
      isValid = false;
    } else if (sanitizedAddress.length > MAX_ADDRESS_LENGTH) {
      newErrors.address = `Address must be less than ${MAX_ADDRESS_LENGTH} characters`;
      isValid = false;
    }

    // Validate coordinates
    if (formData.latitude === 0 && formData.longitude === 0) {
      newErrors.coordinates = "Valid coordinates are required";
      isValid = false;
    }

    // Validate coordinate ranges
    if (
      formData.latitude < -90 ||
      formData.latitude > 90 ||
      formData.longitude < -180 ||
      formData.longitude > 180
    ) {
      newErrors.coordinates = "Invalid coordinate values";
      isValid = false;
    }

    // Validate variants
    if (formData.variants.length > MAX_VARIANTS) {
      newErrors.general = `Maximum ${MAX_VARIANTS} variants allowed`;
      isValid = false;
    }

    if (
      formData.variants.some((variant) => variant.length > MAX_VARIANT_LENGTH)
    ) {
      newErrors.general = `Variant names must be less than ${MAX_VARIANT_LENGTH} characters`;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleVariantSelect = (variant: string) => {
    const sanitizedVariant = sanitizeInput(variant);
    if (
      sanitizedVariant &&
      formData.variants.length < MAX_VARIANTS &&
      !formData.variants.includes(sanitizedVariant)
    ) {
      setFormData((prev) => ({
        ...prev,
        variants: [...prev.variants, sanitizedVariant],
      }));
    }
    setVariantInput("");
    setShowVariantSuggestions(false);
  };

  const updateSubmissionMetrics = () => {
    const currentTime = Date.now();
    localStorage.setItem("lastSubmissionTime", currentTime.toString());
    setLastSubmissionTime(currentTime);

    const newDailyCount = dailySubmissionCount + 1;
    localStorage.setItem("dailySubmissionCount", newDailyCount.toString());
    setDailySubmissionCount(newDailyCount);

    localStorage.setItem("lastSubmissionDate", new Date().toDateString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: Object.values(errors)[0],
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Sanitize all inputs before submission
      const sanitizedData = {
        ...formData,
        name: sanitizeInput(formData.name),
        address: sanitizeInput(formData.address),
        variants: formData.variants.map(sanitizeInput),
        submissionToken,
      };

      const response = await fetch("/api/locations/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": submissionToken,
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Submission failed");
      }

      updateSubmissionMetrics();
      setSubmitted(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit location",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVariants = async (input: string) => {
    if (input.length < 2) return [];
    const sanitizedInput = sanitizeInput(input);
    const response = await fetch(
      "/api/variants/search?q=" + encodeURIComponent(sanitizedInput)
    );
    return response.json();
  };

  // Debounce variant input to prevent API abuse
  const debouncedFetchVariants = async (input: string) => {
    if (variantInput !== input) {
      setVariantInput(input);
      const suggestions = await fetchVariants(input);
      setVariantSuggestions(suggestions.slice(0, 10)); // Limit suggestions
      setShowVariantSuggestions(true);
    }
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
                  <h1 className="text-2xl font-light tracking-wider text-[#95ff00]">
                    Submit New Location
                  </h1>
                  {errors.general && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.general}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm text-white/70">
                        Store Name
                      </label>
                      <Input
                        required
                        maxLength={MAX_NAME_LENGTH}
                        value={formData.name}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }));
                          if (errors.name) {
                            setErrors((prev) => ({ ...prev, name: undefined }));
                          }
                        }}
                        className={`bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50 focus-visible:ring-offset-0 ${
                          errors.name
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-white/70">Address</label>
                      <AddressInput
                        defaultValue={formData.address}
                        onSelect={(suggestion) => {
                          setFormData((prev) => ({
                            ...prev,
                            address: suggestion.address,
                            latitude: suggestion.lat,
                            longitude: suggestion.lng,
                          }));
                          if (errors.address || errors.coordinates) {
                            setErrors((prev) => ({
                              ...prev,
                              address: undefined,
                              coordinates: undefined,
                            }));
                          }
                        }}
                        className={
                          errors.address
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm">{errors.address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-white/70">
                          Latitude
                        </label>
                        <Input
                          required
                          type="number"
                          step="any"
                          value={formData.latitude || ""}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              latitude: parseFloat(e.target.value),
                            }));
                            if (errors.coordinates) {
                              setErrors((prev) => ({
                                ...prev,
                                coordinates: undefined,
                              }));
                            }
                          }}
                          className={`bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50 focus-visible:ring-offset-0 ${
                            errors.coordinates
                              ? "border-red-500 ring-1 ring-red-500"
                              : ""
                          }`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-white/70">
                          Longitude
                        </label>
                        <Input
                          required
                          type="number"
                          step="any"
                          value={formData.longitude || ""}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              longitude: parseFloat(e.target.value),
                            }));
                            if (errors.coordinates) {
                              setErrors((prev) => ({
                                ...prev,
                                coordinates: undefined,
                              }));
                            }
                          }}
                          className={`bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50 focus-visible:ring-offset-0 ${
                            errors.coordinates
                              ? "border-red-500 ring-1 ring-red-500"
                              : ""
                          }`}
                        />
                      </div>
                      {errors.coordinates && (
                        <div className="col-span-2">
                          <p className="text-red-500 text-sm">
                            {errors.coordinates}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-white/70">
                        Variants Available ({formData.variants.length}/
                        {MAX_VARIANTS})
                      </label>
                      <div className="relative">
                        <div className="flex gap-2">
                          <Input
                            value={variantInput}
                            onChange={async (e) => {
                              await debouncedFetchVariants(e.target.value);
                            }}
                            onFocus={() => setShowVariantSuggestions(true)}
                            className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50 focus-visible:ring-offset-0"
                            placeholder="Add variant..."
                            maxLength={MAX_VARIANT_LENGTH}
                            disabled={formData.variants.length >= MAX_VARIANTS}
                          />
                          <Button
                            type="button"
                            onClick={() => handleVariantSelect(variantInput)}
                            className="bg-[#95ff00]/10 hover:bg-[#95ff00]/20 text-[#95ff00] border-0"
                            disabled={formData.variants.length >= MAX_VARIANTS}
                          >
                            Add
                          </Button>
                        </div>
                        {showVariantSuggestions &&
                          variantSuggestions.length > 0 && (
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
                        {formData.variants.map((variant) => (
                          <span
                            key={variant}
                            className="flex items-center rounded-full bg-[#95ff00]/10 px-2 py-0.5 text-xs text-[#95ff00]"
                          >
                            {variant}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: prev.variants.filter(
                                    (v) => v !== variant
                                  ),
                                }))
                              }
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
                      disabled={
                        loading ||
                        dailySubmissionCount >= MAX_SUBMISSIONS_PER_DAY
                      }
                      className="w-full bg-[#95ff00] text-black hover:bg-[#95ff00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Submitting..." : "Submit Location"}
                    </Button>

                    {dailySubmissionCount > 0 && (
                      <p className="text-sm text-white/50 text-center">
                        Submissions today: {dailySubmissionCount}/
                        {MAX_SUBMISSIONS_PER_DAY}
                      </p>
                    )}
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
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1,
                  ease: "easeInOut",
                }}
                className="text-6xl text-[#95ff00]"
              >
                ✓
              </motion.div>
              <h2 className="text-2xl font-light text-white">
                Thank you for your submission!
              </h2>
              <p className="text-white/70">Redirecting you back...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
