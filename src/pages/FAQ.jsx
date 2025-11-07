import React, { useEffect, useMemo, useState } from "react";
import { FaqItem } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, HelpCircle } from "lucide-react";

export default function FAQ() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");

  useEffect(() => {
    const load = async () => {
      const published = await FaqItem.filter({ is_published: true }, "order");
      setItems(published);
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean));
    return ["todas", ...Array.from(set)];
  }, [items]);

  const filtered = items.filter(i => {
    const text = `${i.question} ${i.answer} ${(i.tags || []).join(" ")}`.toLowerCase();
    const okSearch = text.includes(search.toLowerCase());
    const okCat = category === "todas" || i.category === category;
    return okSearch && okCat;
    }).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-7 h-7 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Perguntas Frequentes</h1>
        </div>
        <Badge variant="outline" className="ml-auto">{filtered.length} resultado(s)</Badge>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Encontre respostas rapidamente</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input className="pl-10" placeholder="Pesquisar por palavra-chave..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="border rounded-md px-3 py-2" value={category} onChange={(e)=>setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {filtered.map((i) => (
              <AccordionItem key={i.id} value={i.id}>
                <AccordionTrigger className="text-left">{i.question}</AccordionTrigger>
                <AccordionContent>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-line">{i.answer}</div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {i.category && <Badge variant="outline">{i.category}</Badge>}
                    {(i.tags || []).map((t, idx) => <Badge key={idx} variant="secondary">#{t}</Badge>)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            {filtered.length === 0 && <p className="text-gray-500">Nenhuma pergunta encontrada.</p>}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}