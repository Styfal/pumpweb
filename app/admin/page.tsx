// app/admin/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// ------- DB document shapes (adjust if your schema differs) -------
type PortfolioDoc = {
  _id: ObjectId;
  id?: string;
  username: string;
  token_name?: string;
  ticker?: string;
  slogan?: string;
  logo_url?: string;
  template?: string;
  description?: string;
  is_published?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
};

type PaymentDoc = {
  _id: ObjectId;
  id?: string;
  status: string;
  amount: number;
  currency: string;
  verified_at?: Date | string | null;
  created_at?: Date | string;
  portfolio_username?: string;
  portfolio_id?: string;
};

type TemplateDoc = {
  _id: ObjectId;
  name: string;
  display_name?: string;
  html_template?: string;
  css_template?: string;
  is_active?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
};

// ------- Helpers -------
function toISOStrict(d?: Date | string | null): string {
  if (!d) return new Date().toISOString();
  return typeof d === "string" ? new Date(d).toISOString() : d.toISOString();
}

export default async function AdminPage() {
  noStore(); // ensure nothing is cached/prerendered

  const adminKey = process.env.ADMIN_ACCESS_KEY;
  if (!adminKey) {
    redirect("/");
  }

  const db = await getDb();

  // -------- Portfolios --------
  const portfoliosDocs = await db
    .collection<PortfolioDoc>("portfolios")
    .find(
      {},
      {
        projection: {
          username: 1,
          token_name: 1,
          ticker: 1,
          slogan: 1,
          logo_url: 1,
          template: 1,
          description: 1,
          is_published: 1,
          created_at: 1,
          updated_at: 1,
        },
      }
    )
    .sort({ created_at: -1 })
    .toArray();

  const portfolios = portfoliosDocs.map((p) => ({
    id: p.id ?? p._id.toString(),
    username: p.username,
    token_name: p.token_name ?? "",
    ticker: p.ticker ?? "",
    slogan: p.slogan ?? "",
    logo_url: p.logo_url ?? "",
    template: p.template ?? "default",
    description: p.description ?? "",
    is_published: !!p.is_published,
    created_at: toISOStrict(p.created_at),
    updated_at: toISOStrict(p.updated_at ?? p.created_at),
  }));

  // -------- Payments (+ minimal related portfolio info) --------
  const paymentsDocs = await db
    .collection<PaymentDoc>("payments")
    .find(
      {},
      {
        projection: {
          id: 1,
          status: 1,
          amount: 1,
          currency: 1,
          verified_at: 1,
          created_at: 1,
          portfolio_username: 1,
          portfolio_id: 1,
        },
      }
    )
    .sort({ created_at: -1 })
    .toArray();

  const usernames = Array.from(
    new Set(paymentsDocs.map((p) => p.portfolio_username).filter(Boolean) as string[])
  );
  const portfolioIdStrings = Array.from(
    new Set(paymentsDocs.map((p) => p.portfolio_id).filter(Boolean) as string[])
  );
  const portfolioObjectIds = portfolioIdStrings
    .filter((s) => ObjectId.isValid(s))
    .map((s) => new ObjectId(s));

  const [byUsername, byId] = await Promise.all([
    usernames.length
      ? db
          .collection<PortfolioDoc>("portfolios")
          .find(
            { username: { $in: usernames } },
            { projection: { username: 1, token_name: 1, is_published: 1 } }
          )
          .toArray()
      : Promise.resolve([] as PortfolioDoc[]),
    portfolioObjectIds.length
      ? db
          .collection<PortfolioDoc>("portfolios")
          .find(
            { _id: { $in: portfolioObjectIds } },
            { projection: { username: 1, token_name: 1, is_published: 1 } }
          )
          .toArray()
      : Promise.resolve([] as PortfolioDoc[]),
  ]);

  const usernameMap = new Map(byUsername.map((p) => [p.username, p]));
  const idMap = new Map(byId.map((p) => [p._id.toString(), p]));

  const payments = paymentsDocs.map((pay) => {
    const related =
      (pay.portfolio_username && usernameMap.get(pay.portfolio_username)) ||
      (pay.portfolio_id && idMap.get(pay.portfolio_id)) ||
      undefined;

    const validStatus = ["pending", "completed", "failed"].includes(pay.status)
      ? (pay.status as "pending" | "completed" | "failed")
      : "pending";

      
    return {
      id: pay.id ?? pay._id.toString(),
      status: validStatus,
      amount: pay.amount,
      currency: pay.currency,
      portfolio_id: pay.portfolio_id ?? "",
      verified_at: pay.verified_at ? toISOStrict(pay.verified_at) : undefined,
      created_at: toISOStrict(pay.created_at),
      portfolios: related
        ? {
            username: related.username,
            token_name: related.token_name ?? "",
          }
        : undefined,
    };
  });

  // -------- Templates --------
  const templatesDocs = await db
    .collection<TemplateDoc>("templates")
    .find(
      {},
      {
        projection: {
          name: 1,
          display_name: 1,
          html_template: 1,
          css_template: 1,
          is_active: 1,
          created_at: 1,
          updated_at: 1,
        },
      }
    )
    .sort({ created_at: -1 })
    .toArray();

  const templates = templatesDocs.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    display_name: t.display_name ?? t.name,
    html_template: t.html_template ?? "<div>{{content}}</div>",
    css_template: t.css_template ?? "",
    is_active: !!t.is_active,
    created_at: toISOStrict(t.created_at),
    updated_at: toISOStrict(t.updated_at ?? t.created_at),
  }));

  return (
    <div className="container mx-auto py-8">
      <AdminDashboard portfolios={portfolios} payments={payments} templates={templates} />
    </div>
  );
}
