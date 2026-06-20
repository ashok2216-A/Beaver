'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ExternalLink, Key, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

interface RegistryTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  source_url: string;
  openapi_spec: any;
  system_prompt: string;
  auth_type: string;
  auth_header: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [templates, setTemplates] = useState<RegistryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = await getToken();
        const headers = { "Authorization": `Bearer ${token}` };
        
        const [resA] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/templates/apiverve`, { headers }),
          // fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/templates/cloudmersive`, { headers })
        ]);

        const mapCategory = (raw: string) => {
          const c = raw.replace(/\s*\(\d+\)$/, '').trim();
          if (["Data Conversion", "Data Generation", "Data Processing", "Data Validation", "Parsers", "Documents"].includes(c)) return "Data Tools";
          if (["Data Lookup", "Data Scraping", "Domain Data", "Networking", "Reference Data"].includes(c)) return "Web & Network";
          if (["Finance", "Math/Calculations"].includes(c)) return "Finance & Math";
          if (["Entertainment", "Games", "News", "Food", "Lifestyle", "Astrology"].includes(c)) return "Lifestyle & Media";
          if (["Geography", "Transportation", "Weather"].includes(c)) return "Geo & Weather";
          if (["Health/Wellness", "Science"].includes(c)) return "Science & Health";
          if (["AI/Computer Vision", "Images"].includes(c)) return "AI & Vision";
          return c;
        };

        let allTemplates = [];
        if (resA.ok) {
          const aData = await resA.json();
          const aTemplates = aData.templates || [];
          allTemplates.push(...aTemplates.map((t: RegistryTemplate) => ({
            ...t,
            category: mapCategory((t.category || '').replace('API Verve', '').replace('APIVerve', '').trim() || 'Utility'),
            name: (t.name || '').replace('API Verve', '').replace('APIVerve', '').replace('API', 'Agent').trim()
          })));
        }
        // if (resC.ok) {
        //   const cTemplates = (await resC.json()) || [];
        //   allTemplates.push(...cTemplates.map((t: RegistryTemplate) => ({
        //     ...t,
        //     category: t.category.replace('Cloudmersive', '').trim() || 'Utility',
        //     name: t.name.replace('Cloudmersive', '').replace('API', 'Agent').trim()
        //   })));
        // }
        
        setTemplates(allTemplates);
      } catch (err) {
        console.error("Failed to fetch templates", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [getToken]);

  const categories = Array.from(new Set(templates.map(t => t.category))).sort().map(cat => ({
    name: cat,
    count: templates.filter(t => t.category === cat).length
  }));

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? t.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const getProvider = (template: RegistryTemplate) => {
    return template.id.startsWith("cloudmersive") ? "Official Agent" : "API Verve";
  };

  const getCacheKey = (template: RegistryTemplate) => {
    return template.id.startsWith("cloudmersive") ? "cloudmersive_api_key" : "apiverve_api_key";
  };

  const handleInstallClick = (template: RegistryTemplate) => {
    installTemplate(template, "");
  };

  const installTemplate = async (template: RegistryTemplate, key: string) => {
    setInstallingId(template.id);
    try {
      const token = await getToken();
      
      const payload = {
        name: template.name,
        description: template.description,
        system_prompt: template.system_prompt,
        api_spec: JSON.stringify(template.openapi_spec),
        base_url: template.source_url.includes("cloudmersive") ? "https://api.cloudmersive.com" : "https://api.apiverve.com",
        auth_type: template.auth_type || "custom",
        auth_header: template.auth_header || "x-api-key",
        auth_secret: key,
        source_type: "rest",
        tools_list: []
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${template.name} added successfully!`);
        router.push(`/dashboard/agents/${data.id}`);
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to add agent");
        if (err.detail?.includes("API key") || err.detail?.includes("Unauthorized")) {
           localStorage.removeItem(getCacheKey(template)); // clear invalid key
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during installation.");
    } finally {
      setInstallingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2 mb-8 mt-2">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Zap className="w-4 h-4" />
          <h2 className="text-xs font-semibold tracking-widest uppercase">Integration Hub</h2>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Template Marketplace
        </h1>
        <p className="text-muted-foreground text-base max-w-2xl mt-1">
          Browse and add verified agents.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8 pb-4 border-b">
        <Button 
          variant={selectedCategory === null ? "secondary" : "ghost"}
          onClick={() => setSelectedCategory(null)}
          className="rounded-md h-8 text-xs font-medium"
        >
          All
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.name}
            variant={selectedCategory === cat.name ? "secondary" : "ghost"}
            onClick={() => setSelectedCategory(cat.name)}
            className="rounded-md h-8 text-xs font-medium"
          >
            {cat.name} ({cat.count})
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map(template => (
          <div key={template.id} className="group flex flex-col bg-card/40 backdrop-blur-md border rounded-xl hover:border-primary/50 transition-colors duration-200 overflow-hidden shadow-sm">
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-1.5 gap-2">
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">{template.name}</h3>
                <span className="text-[10px] font-medium px-2 py-0.5 bg-muted text-muted-foreground rounded whitespace-nowrap mt-0.5">
                  {template.category}
                </span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed mb-4 flex-1 line-clamp-3">{template.description}</p>
              
              <div className="flex items-center gap-2 pt-3 border-t mt-auto">
                <Button 
                  size="sm"
                  variant="default"
                  className="flex-1 h-8 text-xs font-medium shadow-none"
                  onClick={() => handleInstallClick(template)}
                  disabled={installingId === template.id}
                >
                  {installingId === template.id ? <Loader className="w-3 h-3 mr-1.5" /> : <Plus className="w-3 h-3 mr-1.5" />}
                  {installingId === template.id ? "Adding" : "Add"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">No APIs found matching your search.</p>
        </div>
      )}

    </div>
  );
}
