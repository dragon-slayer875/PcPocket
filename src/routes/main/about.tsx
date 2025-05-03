import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Coffee } from "lucide-react";
import { SiGithub, SiX } from "@icons-pack/react-simple-icons";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getVersion } from "@tauri-apps/api/app";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/main/about")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: version } = useQuery({
    queryKey: ["version"],
    queryFn: async () => {
      const version = await getVersion();
      return version;
    },
  });

  const appInfo = {
    name: "PcPocket",
    description:
      "Cross platform, offline first bookmark manager. Built with Tauri, React, and TypeScript.",
    author: {
      name: "Rudraksh Tyagi",
      role: "Tinkerer and Enjoyer of many interests",
      bio: "Eternal learner. Passionate about technology and all that it allows me to do. Lover of performant and efficient code and functional and pretty UIs.",
    },
    social: {
      github: "https://github.com/dragon-slayer875",
      twitter: "https://x.com/r875t",
      buyMeACoffee: "https://buymeacoffee.com/dragonslayer875",
    },
  };

  return (
    <div className="mx-auto max-w-4xl flex flex-1 flex-col overflow-auto space-y-8 md:self-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            {appInfo.name}
            <Badge variant="outline" className="ml-2">
              v{version}
            </Badge>
          </CardTitle>
          <CardDescription className="text-base">
            {appInfo.description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() =>
              openUrl("https://github.com/dragon-slayer875/PcPocket")
            }
          >
            <SiGithub className="mr-2 h-4 w-4" />
            Source
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About the Creator</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center md:flex-row gap-6">
          <div className="text-center">
            <h3 className="font-medium">{appInfo.author.name}</h3>
            <p className="text-sm text-muted-foreground">
              {appInfo.author.role}
            </p>
          </div>
          <Separator className="md:hidden" />
          <div className="md:border-l md:pl-6 flex-1">
            <p className="text-muted-foreground leading-relaxed">
              {appInfo.author.bio}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => openUrl(appInfo.social.github)}
          >
            <SiGithub className="mr-2 h-4 w-4" />
            GitHub
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => openUrl(appInfo.social.twitter)}
          >
            <SiX className="mr-2 h-4 w-4" />
            Twitter
          </Button>
          <Button
            variant="default"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => openUrl(appInfo.social.buyMeACoffee)}
          >
            <Coffee className="mr-2 h-4 w-4" />
            Buy me a coffee
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
