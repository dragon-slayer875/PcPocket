import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DrawerDialog } from "../ui/drawerDialog";
import { ParserForm } from "./parserForm";
import {
  useAddCustomParserMutation,
  useGetCustomParsersQuery,
} from "@/lib/queries";

export function ParserConfig() {
  const [isAddParserOpen, setIsAddParserOpen] = useState(false);
  const { data } = useGetCustomParsersQuery();
  const addCustomParserMutation = useAddCustomParserMutation();

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Available Parsers</h2>
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
        {data?.length ? (
          data.map((parser) => (
            <Card key={parser.name}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{parser.name}</CardTitle>
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
