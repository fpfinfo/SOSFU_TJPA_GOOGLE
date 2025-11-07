import React, { useEffect, useMemo, useState } from "react";
import { ManualSection } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Search } from "lucide-react";

export default function Manual() {
  const [sections, setSections] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const published = await ManualSection.filter({ is_published: true }, "order");
      setSections(published);
      if (published.length > 0) setActiveId(published[0].id);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return sections
      .filter(sec => {
        const txt = `${sec.title} ${sec.content}`.toLowerCase();
        return s === "" || txt.includes(s);
      })
      .sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
  }, [sections, search]);

  const active = filtered.find(s => s.id === activeId) || filtered[0];

  return (
    <div className="p-6 mx-auto max-w-6xl">
      <div className="flex items-center gap-3 mb-4">
        <BookOpen className="w-7 h-7 text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-900">Manual de Uso</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input className="pl-10" placeholder="Buscar no manual..." value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
          <Card className="border-none shadow-lg">
            <CardContent className="p-2">
              <ul className="space-y-1">
                {filtered.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => setActiveId(sec.id)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${active?.id === sec.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"}`}
                    >
                      <div className="font-medium">{sec.title}</div>
                      {sec.category && <div className="text-xs text-gray-500">{sec.category}</div>}
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && <li className="text-gray-500 px-3 py-2">Nenhuma seção encontrada.</li>}
              </ul>
            </CardContent>
          </Card>
        </aside>
        <section className="lg:col-span-8">
          {active ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">{active.title}</h2>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: active.content }} />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-lg"><CardContent className="p-6 text-gray-500">Selecione uma seção à esquerda.</CardContent></Card>
          )}
        </section>
      </div>
    </div>
  );
}