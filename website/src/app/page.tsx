import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/Hero";
import { SurfConditions } from "@/components/SurfConditions";
import { NewArrivals } from "@/components/NewArrivals";
import { Products } from "@/components/Products";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { Brands } from "@/components/Brands";
import { Opportunities } from "@/components/Opportunities";
import { Visit } from "@/components/Visit";
import { Contact } from "@/components/Contact";
import { Athletes } from "@/components/Athletes";
import { Footer } from "@/components/Footer";
import { listCatalogBrandNames } from "@/lib/ecommerce/catalog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalogBrands = await listCatalogBrandNames();

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <SurfConditions />
        <NewArrivals />
        <About />
        <Products />
        <Services />
        <Opportunities />
        <Athletes />
        <Brands catalogBrands={catalogBrands} />
        <Visit />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
