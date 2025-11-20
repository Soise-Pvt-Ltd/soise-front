import Footer from "@/components/footer";
import ExploreCollection from "@/components/home/explore-collection";
import BeforeExploreCollection from "@/components/home/before-explore-collection";
import MensTops from "@/components/home/mens-tops";
import AfterHero from "@/components/home/after-hero";
import Hero from "@/components/home/hero";

export default function Home() {
  return (
    <>
      <Hero />
      <AfterHero />
      <MensTops />
      <BeforeExploreCollection />
      <ExploreCollection />
      <Footer />
    </>
  );
}
