import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser, signOut } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");

  return (
    <div className="root-layout">
      <nav className="flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" width={38} height={32} alt="logo" />
          <h2 className="text-primary-100">PrepWise</h2>
        </Link>

        <form action={signOut}>
          <button className="text-red-400 text-sm">Sign Out</button>
        </form>
      </nav>

      {children}
    </div>
  );
};

export default Layout;
