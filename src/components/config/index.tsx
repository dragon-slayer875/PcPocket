import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParserConfig } from "./parserConfig";
import { DbConfig } from "./dbConfig";
import { AppearanceConfig } from "./appearanceConfig";

const tabs = [
  {
    value: "parsers",
    label: "Parsers",
    component: <ParserConfig />,
  },
  {
    value: "database",
    label: "Database",
    component: <DbConfig />,
  },
  {
    value: "appearance",
    label: "Appearance",
    component: <AppearanceConfig />,
  },
];

export function Config() {
  return (
    <Tabs defaultValue="parsers" className="w-full">
      <TabsList className="flex w-full">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="space-y-4 mt-4"
        >
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}
