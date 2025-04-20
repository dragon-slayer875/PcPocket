import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "../themeProvider";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { themeStyles } from "../themeProvider";
import { ThemeSelector } from "../themeModeToggle";

export function AppearanceConfig() {
  const { setTheme, theme } = useTheme();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <Label>Theme Style</Label>
          <RadioGroup
            defaultValue={theme}
            onValueChange={function(value) {
              setTheme(value);
            }}
            className="flex gap-7"
          >
            {themeStyles.map((style) => (
              <div key={style.value} className="flex items-center space-x-1">
                <RadioGroupItem
                  value={style.value}
                  id={style.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={style.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-foreground"
                    style={{
                      backgroundColor: style.color,
                    }}
                  ></div>
                  <span
                    className={cn(
                      "font-medium",
                      theme === style.value ? "" : "text-muted-foreground",
                    )}
                  >
                    {style.name}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <Separator />
        <ThemeSelector />
      </CardContent>
    </Card>
  );
}
