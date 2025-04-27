import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Clipboard, FilePlus2, FolderOpen } from "lucide-react";
import {
  useCreateDbMutation,
  useGetDbPathQuery,
  useOpenDbMutation,
} from "@/lib/queries";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { CopyButton } from "../ui/copyButton";

export function DbConfig() {
  const { data } = useGetDbPathQuery();
  const createDbMutation = useCreateDbMutation();
  const openDbMutation = useOpenDbMutation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Settings</CardTitle>
        <CardDescription>Manage your database configuration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Database Location</Label>
          <div className="flex items-center space-x-2">
            <Input
              value={data ? (data as string) : ""}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={async function() {
                writeText(data as string);
              }}
            >
              <CopyButton text={data as string} />
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Create New Database</Label>
          <ul className="list-disc pl-5">
            <li>
              <p className="text-sm text-muted-foreground">
                This will create a new empty database file.
              </p>
            </li>
            <li>
              <p className="text-sm text-muted-foreground">
                Current database file will be removed from the application. The
                removed database file will retain its contents.
              </p>
            </li>
          </ul>
          <Button
            variant="destructive"
            onClick={() => createDbMutation.mutate()}
          >
            <FilePlus2 className="mr-1 h-4 w-4" />
            Create New Database
          </Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Open Existing Database</Label>
          <ul className="list-disc pl-5">
            <li>
              <p className="text-sm text-muted-foreground">
                This will open an existing database file.
              </p>
            </li>
            <li>
              <p className="text-sm text-muted-foreground">
                Current database file will be removed from the application. The
                removed database file will retain its contents.
              </p>
            </li>
          </ul>
          <Button
            variant="destructive"
            onClick={function() {
              openDbMutation.mutate();
            }}
          >
            <FolderOpen className="mr-1 h-4 w-4" />
            Open Exisitng Database
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
