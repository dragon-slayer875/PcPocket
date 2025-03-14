// import { HomeScreen } from "@/components/homeScreen";
// import { InitScreen } from "@/components/initScreen";
// import { useGetDbPathQuery } from "@/lib/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  // const { isPending, isError, data, error } = useGetDbPathQuery();
  //
  // if (isPending) {
  //   return <div>Loading...</div>;
  // }
  //
  // if (isError) {
  //   return <div>Error: {error.message}</div>;
  // }
  //
  // return <>{data ? <HomeScreen /> : <InitScreen />}</>;
  return <div>Index</div>;
}
