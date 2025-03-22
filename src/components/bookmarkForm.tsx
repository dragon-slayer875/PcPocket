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
import { BookmarkMutationItem } from "@/types";

const formSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  tags: z.array(z.string()),
});

export function BookmarkForm({
  setOpen,
  data = { title: "", link: "", tags: [] },
  handleSubmit,
}: {
  setOpen: (open: boolean) => void;
  data?: BookmarkMutationItem;
  handleSubmit: (values: typeof data) => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: data,
  });

  useEffect(() => {
    form.setFocus("link");
  }, []);

  function onSubmit(values: z.infer<typeof formSchema>) {
    let submitData: BookmarkMutationItem = values;
    if (data.id) {
      submitData.id = data.id;
    }

    handleSubmit(submitData);
    setOpen(false);
  }

  function transformTagValue(e: React.ChangeEvent<HTMLInputElement>) {
    let tags = e.target.value.split(",");
    return tags ?? [];
  }

  return (
    <div className="px-4 py-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[1rem]">Title</FormLabel>
                <FormControl>
                  <Input placeholder="Epic link title" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[1rem]">Link</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[1rem]">Tags</FormLabel>
                <FormControl>
                  <Input
                    placeholder="react,typescript"
                    {...field}
                    value={field.value.join(",")}
                    onChange={(e) => field.onChange(transformTagValue(e))}
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
