"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, ArrowLeft, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Location {
  location_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  variants: string[];
  notes?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNote, setEditingNote] = useState<{id: string, note: string} | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLocations();
    }
  }, [isAuthenticated]);

  const fetchLocations = async () => {
    const res = await fetch('/api/admin/locations', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
    if (res.ok) {
      setLocations(await res.json());
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem('adminToken', token);
        setIsAuthenticated(true);
      } else {
        toast({ title: "Error", description: "Skktt ga weg", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (location: Location) => {
    if (!confirm(`Are you sure you want to delete:\n\n${location.name}\n${location.address}?`)) return;
    
    const res = await fetch(`/api/admin/locations/${location.location_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
    });
    
    if (res.ok) {
      setLocations(locations.filter(l => l.location_id !== location.location_id));
      toast({ title: "Deleted", description: `${location.name} has been removed` });
    }
  };

  const handleUpdateNote = async (locationId: string, note: string) => {
    const res = await fetch(`/api/admin/locations/${locationId}/note`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ note })
    });
    
    if (res.ok) {
      setLocations(locations.map(l => 
        l.location_id === locationId ? { ...l, notes: note } : l
      ));
      setEditingNote(null);
      toast({ title: "Success", description: "Note updated" });
    }
  };

  const filteredLocations = locations.filter(location => 
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.variants.some(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black bg-[radial-gradient(rgba(149,255,0,0.1)_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="container mx-auto max-w-md py-12">
          <Card className="bg-black/95 text-white backdrop-blur-lg border-white/5">
            <CardHeader>
              <h1 className="text-2xl font-light tracking-wider text-[#95ff00]">Skktt ga weg</h1>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50"
                  placeholder="Password..."
                />
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#95ff00] text-black hover:bg-[#95ff00]/90"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enter
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(rgba(149,255,0,0.1)_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="container mx-auto py-12 px-4 relative">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="absolute left-4 top-4 text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-light text-[#95ff00]">Location Management</h1>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border-0 pl-10 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50 text-white placeholder-white/50"
              placeholder="Search locations..."
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <Card key={location.location_id} className="bg-black/95 text-white backdrop-blur-lg border-white/5">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-medium text-[#95ff00]">{location.name}</h2>
                    <p className="text-white/70">{location.address}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {location.variants.map((variant) => (
                        <span key={variant} className="text-xs bg-[#95ff00]/10 text-[#95ff00] px-2 py-1 rounded-full">
                          {variant}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(location)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {editingNote?.id === location.location_id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editingNote.note}
                      onChange={(e) => setEditingNote({ ...editingNote, note: e.target.value })}
                      className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50 text-white"
                    />
                    <Button
                      onClick={() => handleUpdateNote(location.location_id, editingNote.note)}
                      className="bg-[#95ff00] text-black hover:bg-[#95ff00]/90"
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingNote(null)}
                      className="text-white/70"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingNote({ id: location.location_id, note: location.notes || '' })}
                    className="mt-2 p-2 rounded bg-white/5 hover:bg-white/10 cursor-pointer min-h-[60px] text-white/70"
                  >
                    {location.notes || 'Click to add notes...'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}