import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DrawerDialog } from "../ui/drawerDialog";
import { invoke } from "@tauri-apps/api/core";
import { ParserConfigType } from "@/types";
import { ParserForm } from "./parserForm";
import { useAddCustomParserMutation } from "@/lib/queries";

export function ParserConfig() {
  const [isAddParserOpen, setIsAddParserOpen] = useState(false);
  const [parsers, setParsers] = useState<ParserConfigType[]>([]);
  const addCustomParserMutation = useAddCustomParserMutation();

  useEffect(() => {
    async function fetchParsers() {
      const response = (await invoke(
        "list_all_custom_parsers",
      )) as ParserConfigType[];
      setParsers(response);
    }
    fetchParsers();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Available Custom Parsers</h2>
        <DrawerDialog
          open={isAddParserOpen}
          setOpen={setIsAddParserOpen}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Parser
            </Button>
          }
          content={
            <ParserForm
              setOpen={setIsAddParserOpen}
              handleSubmit={addCustomParserMutation.mutate}
            />
          }
          title="Add Custom Parser"
          description="Configure a new custom parser for your data."
        />
      </div>

      <div className="grid gap-4">
        {parsers.length ? (
          parsers.map((parser) => (
            <Card key={parser.name}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{parser.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{parser.supportedFormats}</CardDescription>
              </CardHeader>
            </Card>
          ))
        ) : (
          <div className="text-center text-muted-foreground">
            No custom parsers available.
          </div>
        )}
      </div>
    </>
  );
}
