import { FormEvent, useMemo, useState } from "react";
import { Copy, Loader2, RotateCcw, Search } from "lucide-react";
import { pharmacyApi, BelugaPharmacy, PharmacySearchPayload } from "@/api/pharmacyApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

const emptySearch: PharmacySearchPayload = {
  name: "",
  city: "",
  state: "",
  zip: "",
};

const cleanPayload = (payload: PharmacySearchPayload): PharmacySearchPayload => (
  Object.entries(payload).reduce<PharmacySearchPayload>((acc, [key, value]) => {
    const trimmed = value?.trim();
    if (trimmed) {
      acc[key as keyof PharmacySearchPayload] = trimmed;
    }
    return acc;
  }, {})
);

const formatAddress = (pharmacy: BelugaPharmacy) => (
  [
    pharmacy.Address1,
    pharmacy.Address2,
    `${pharmacy.City}, ${pharmacy.State} ${pharmacy.ZipCode}`.trim(),
  ].filter(Boolean).join("\n")
);

const formatPharmacyDetails = (pharmacy: BelugaPharmacy) => {
  const specialties = pharmacy.PharmacySpecialties?.length
    ? pharmacy.PharmacySpecialties.join(", ")
    : "-";

  return [
    `Pharmacy ID: ${pharmacy.PharmacyId}`,
    `Store Name: ${pharmacy.StoreName}`,
    `Address 1: ${pharmacy.Address1 || "-"}`,
    `Address 2: ${pharmacy.Address2 || "-"}`,
    `City: ${pharmacy.City || "-"}`,
    `State: ${pharmacy.State || "-"}`,
    `Zip Code: ${pharmacy.ZipCode || "-"}`,
    `Primary Phone: ${pharmacy.PrimaryPhone || "-"}`,
    `Primary Fax: ${pharmacy.PrimaryFax || "-"}`,
    `Phone Additional 1: ${pharmacy.PhoneAdditional1 || "-"}`,
    `Phone Additional 2: ${pharmacy.PhoneAdditional2 || "-"}`,
    `Phone Additional 3: ${pharmacy.PhoneAdditional3 || "-"}`,
    `Specialties: ${specialties}`,
    `Service Level: ${pharmacy.ServiceLevel ?? "-"}`,
    `Latitude: ${pharmacy.Latitude ?? "-"}`,
    `Longitude: ${pharmacy.Longitude ?? "-"}`,
  ].join("\n");
};

const getLookupError = (err: unknown) => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { error?: string; detail?: string } } }).response;
    return response?.data?.error || response?.data?.detail;
  }
  return undefined;
};

export default function BelugaPharmacyLookup() {
  const [search, setSearch] = useState<PharmacySearchPayload>(emptySearch);
  const [results, setResults] = useState<BelugaPharmacy[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSearch = useMemo(() => Object.values(search).some(value => value?.trim()), [search]);

  const setField = (field: keyof PharmacySearchPayload, value: string) => {
    setSearch(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const copyDetails = async (pharmacy: BelugaPharmacy) => {
    try {
      await navigator.clipboard.writeText(formatPharmacyDetails(pharmacy));
      toast({ title: "Copied", description: "Pharmacy details copied to clipboard" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Copy failed",
        description: "Could not copy pharmacy details",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = cleanPayload(search);

    if (!Object.keys(payload).length) {
      setError("Enter at least one search field.");
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const pharmacies = await pharmacyApi.belugaLookup(payload);
      setResults(pharmacies);
    } catch (err: unknown) {
      console.error(err);
      const message = getLookupError(err);
      setResults([]);
      setError(message || "Pharmacy lookup failed.");
      toast({
        title: "Lookup failed",
        description: message || "Unable to fetch pharmacies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearch(emptySearch);
    setResults([]);
    setHasSearched(false);
    setError("");
  };

  return (
    <div className="p-4 md:p-6 space-y-5 min-w-0">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Find Beluga Pharmacies</h1>
      </div>

      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="pharmacy-name">Name</Label>
                <Input
                  id="pharmacy-name"
                  value={search.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="CVS"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pharmacy-city">City</Label>
                <Input
                  id="pharmacy-city"
                  value={search.city}
                  onChange={(event) => setField("city", event.target.value)}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pharmacy-state">State</Label>
                <Input
                  id="pharmacy-state"
                  value={search.state}
                  onChange={(event) => setField("state", event.target.value.toUpperCase().slice(0, 2))}
                  placeholder="NY"
                  maxLength={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pharmacy-zip">Zip</Label>
                <Input
                  id="pharmacy-zip"
                  value={search.zip}
                  onChange={(event) => setField("zip", event.target.value.slice(0, 10))}
                  placeholder="10001"
                  inputMode="numeric"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={loading || !canSearch}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Results</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading pharmacies
            </div>
          ) : results.length ? (
            <Table size="sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-40">Pharmacy</TableHead>
                  <TableHead className="min-w-48">Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Fax</TableHead>
                  <TableHead>Specialties</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="w-12 text-right">Copy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((pharmacy) => (
                  <TableRow key={`${pharmacy.PharmacyId}-${pharmacy.StoreName}`}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{pharmacy.StoreName}</div>
                      <div className="text-muted-foreground">ID {pharmacy.PharmacyId}</div>
                    </TableCell>
                    <TableCell className="whitespace-pre-line">{formatAddress(pharmacy)}</TableCell>
                    <TableCell>{pharmacy.PrimaryPhone || "-"}</TableCell>
                    <TableCell>{pharmacy.PrimaryFax || "-"}</TableCell>
                    <TableCell>
                      {pharmacy.PharmacySpecialties?.length ? pharmacy.PharmacySpecialties.join(", ") : "-"}
                    </TableCell>
                    <TableCell>{pharmacy.ServiceLevel ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyDetails(pharmacy)}
                        title="Copy pharmacy details"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {hasSearched ? "No pharmacies found." : "Enter search criteria to fetch pharmacies."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
