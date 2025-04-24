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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coffee } from "lucide-react";
import { SiGithub, SiX } from "@icons-pack/react-simple-icons";

export const Route = createFileRoute("/main/about")({
  component: RouteComponent,
});

function RouteComponent() {
  // Replace with your app's information
  const appInfo = {
    name: "PcPocket",
    version: "5.5.0-alpha",
    description:
      "Cross platform offline bookmark manager. Built with Tauri, React, and TypeScript.",
    author: {
      name: "Rudraksh Tyagi",
      role: "Tinkerer and Developer",
      avatar: "/placeholder.svg",
      bio: "A brief bio about yourself, your background, and your experience. Share what motivates you and what you're passionate about.",
    },
    social: {
      github: "https://github.com/dragon-slayer875",
      twitter: "https://twitter.com/yourusername",
      buyMeACoffee: "https://buymeacoffee.com/yourusername",
    },
  };

  return (
    <div className="mx-auto max-w-4xl flex flex-1 flex-col overflow-auto space-y-8 md:self-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
        <p className="text-muted-foreground">
          Information about the application and its creator
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            {appInfo.name}
            <Badge variant="outline" className="ml-2">
              v{appInfo.version}
            </Badge>
          </CardTitle>
          <CardDescription className="text-base">
            {appInfo.description}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About the Creator</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={appInfo.author.avatar}
                alt={appInfo.author.name}
              />
              <AvatarFallback>
                {appInfo.author.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="font-medium">{appInfo.author.name}</h3>
              <p className="text-sm text-muted-foreground">
                {appInfo.author.role}
              </p>
            </div>
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
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <a
              href={appInfo.social.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SiGithub className="mr-2 h-4 w-4" />
              GitHub
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <a
              href={appInfo.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SiX className="mr-2 h-4 w-4" />
              Twitter
            </a>
          </Button>
          <Button
            asChild
            variant="default"
            size="lg"
            className="w-full sm:w-auto"
          >
            <a
              href={appInfo.social.buyMeACoffee}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Coffee className="mr-2 h-4 w-4" />
              Buy me a coffee
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
