import { Outlet } from "react-router";
import useSeo from "./useSeo";

const SeoHead = () => {
  useSeo();
  return <Outlet />;
};

export default SeoHead;
