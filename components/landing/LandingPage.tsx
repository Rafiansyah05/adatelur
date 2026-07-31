import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ForConsumer } from '@/components/landing/ForConsumer';
import { ForPeternak } from '@/components/landing/ForPeternak';
import { AppSection } from '@/components/landing/AppSection';
import { WhyUs } from '@/components/landing/WhyUs';
import { Testimonials } from '@/components/landing/Testimonials';
import { Faq } from '@/components/landing/Faq';
import { FinalCta } from '@/components/landing/FinalCta';
import { LandingFooter } from '@/components/landing/LandingFooter';

export function LandingPage() {
  return (
    <div className="bg-white">
      <LandingNav />
      <main>
        <Hero />
        <HowItWorks />
        <ForConsumer />
        <ForPeternak />
        <AppSection />
        <WhyUs />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
