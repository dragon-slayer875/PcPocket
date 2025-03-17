import { ComponentProps, useState } from "react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Delete } from "lucide-react";

export function TagInput({
  value,
  onChange,
  ref,
  ...props
}: ComponentProps<"input">) {
  const [tags, setTags] = useState<string[]>([]);
  const [tag, setTag] = useState("");

  // useEffect(() => {
  //   onChange(tags);
  // }, [tags]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      setTags([...tags, tag]);
      setTag("");
    }
  }

  function removeTag(index: number) {
    setTags([...tags.filter((_, i) => i !== index)]);
  }

  return (
    <>
      <Input
        type="text"
        value={tag}
        onChange={(e) => {
          props.type;
          setTag(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        ref={ref}
        {...props}
      />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={tag} onClick={() => removeTag(index)}>
            {tag}
            <Delete />
          </Badge>
        ))}
      </div>
    </>
  );
}
