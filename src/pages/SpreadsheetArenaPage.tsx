import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import SpreadsheetArena from "@/components/SpreadsheetArena";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SpreadsheetArenaPage() {
  useEffect(() => {
    document.title = "Arena de Planilhas - BussulaC";
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-y-auto pt-16 lg:pt-8 overscroll-contain">
        <div className="max-w-5xl mx-auto p-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Arena de Planilhas</CardTitle>
              <CardDescription>Desafios práticos com avaliação por IA</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Resolva desafios de Excel/Sheets e receba feedback imediato.
              </p>
            </CardContent>
          </Card>
          <SpreadsheetArena />
        </div>
      </main>
    </div>
  );
}
