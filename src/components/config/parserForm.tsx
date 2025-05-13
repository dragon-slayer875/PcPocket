import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Folder } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

const formSchema = z.object({
  name: z.string(),
  type: z.enum(["python"]),
  path: z.string(),
  supportedFormats: z.array(z.string()),
});

export function ParserForm({
  setOpen,
  data = { name: "", type: "python", path: "", supportedFormats: [] },
  handleSubmit,
}: {
  setOpen: (open: boolean) => void;
  data?: {
    name: string;
    type: "python";
    path: string;
    supportedFormats: string[];
  };
  handleSubmit: (values: typeof data) => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: data,
  });

  useEffect(() => {
    form.setFocus("name");
  }, []);

  function onSubmit(values: z.infer<typeof formSchema>) {
    handleSubmit(values);
    setOpen(false);
  }

  function transformSupportedFormatValue(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    let tags = e.target.value.split(",");
    return tags ?? [];
  }

  return (
    <div className="px-4 py-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[1rem]">Name</FormLabel>
                <FormControl>
                  <Input required placeholder="Parser Name" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[1rem]">Type</FormLabel>
                <FormControl>
                  <Select
                    defaultValue={field.value}
                    required
                    onValueChange={(e) => field.onChange(e)}
                    {...field}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="path"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[1rem]">Path</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Input required placeholder="/path/to/parser" {...field} />
                    <Button
                      variant="outline"
                      type="button"
                      className="ml-2"
                      onClick={async function () {
                        const path = await open();
                        if (path && typeof path === "string") {
                          field.onChange(path);
                        }
                      }}
                    >
                      <Folder className="mr-1 h-4 w-4" />
                      <span>Browse</span>
                    </Button>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supportedFormats"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[1rem]">Supported Formats</FormLabel>
                <FormControl>
                  <Input
                    placeholder="xml,json"
                    {...field}
                    value={field.value.join(",")}
                    required
                    onChange={(e) =>
                      field.onChange(transformSupportedFormatValue(e))
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button className="w-full" size={"lg"} type="submit">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
}
