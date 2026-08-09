import { InfiniteSlider } from "./infinite-slider"

export function LogoCloud() {
  return (
    <div className="mask-[linear-gradient(to_right,transparent,black,transparent)] overflow-hidden py-4">
      <InfiniteSlider gap={42} reverse speed={80} speedOnHover={1}>
        {logos.map((logo) => (
          <img
            alt={logo.alt}
            className="pointer-events-none h-10 select-none md:h-10 dark:md:h-16 dark:bg-white dark:p-2 dark:rounded-3xl"
            height="auto"
            key={`logo-${logo.alt}`}
            loading="lazy"
            src={logo.src}
            width="auto"
          />
        ))}
      </InfiniteSlider>
    </div>
  )
}

const logos = [
  { src: "/companies/aditya-birla.png", alt: "Aditya Birla" },
  { src: "/companies/dewars.png", alt: "Dewar's" },
  { src: "/companies/itc-hotels.png", alt: "ITC Hotels" },
  { src: "/companies/insurance-dekho.png", alt: "Insurance Dekho" },
  { src: "/companies/veg-nonveg.png", alt: "Veg Nonveg" },
  { src: "/logos/walmart.svg", alt: "Walmart" },
  { src: "/logos/accenture.svg", alt: "Accenture" },
  { src: "/logos/jpm.svg", alt: "JPMorgan Chase" },
  { src: "/companies/aionos.png", alt: "IONOS" },
  { src: "/companies/upgrad.png", alt: "upGrad" },
  { src: "/companies/o3plus.png", alt: "O3+" },
  { src: "/companies/cars24.png", alt: "CARS24" },
  { src: "/logos/visa.svg", alt: "Visa" },
  { src: "/companies/oriflame.png", alt: "Oriflame" },
  { src: "/companies/licious.png", alt: "Licious" },
  { src: "/companies/happilo.png", alt: "Happilo" },
  { src: "/companies/minimalist.png", alt: "Minimalist" },
  { src: "/companies/boldfit.png", alt: "Boldfit" },
  { src: "/logos/linkedin.svg", alt: "LinkedIn" },
  { src: "/companies/pwc.png", alt: "PwC" },
  { src: "/logos/costco.svg", alt: "Costco" },
  { src: "/companies/biryani-blues.png", alt: "Biryani Blues" },
  { src: "/logos/tcs.svg", alt: "TCS" },
  { src: "/logos/meta.svg", alt: "Meta" },
  { src: "/companies/zomato.png", alt: "Zomato" },
  { src: "/logos/deloitte.svg", alt: "Deloitte" },
  { src: "/companies/arata.png", alt: "Arata" },
  { src: "/companies/ceat.png", alt: "CEAT" },
  { src: "/logos/infosys.png", alt: "Infosys" },
  { src: "/logos/instagram.svg", alt: "Instagram" },
  { src: "/companies/libas.png", alt: "Libas" },
  { src: "/companies/axis-life-insurance.png", alt: "Axis Life Insurance" },
  { src: "/logos/berkshire.svg", alt: "Berkshire Hathaway" },
  { src: "/companies/astro-yogi.png", alt: "Astro Yogi" },
  { src: "/companies/wow-momo.png", alt: "Wow! Momo" },
  { src: "/companies/nestle.png", alt: "Nestlé" },
  { src: "/logos/exxon.svg", alt: "ExxonMobil" },
  { src: "/logos/hcl.svg", alt: "HCL Technologies" },
  { src: "/logos/github.svg", alt: "GitHub" },
  { src: "/logos/nvidia.svg", alt: "NVIDIA" },
  { src: "/companies/body-shop.png", alt: "The Body Shop" },
  { src: "/companies/payments-bank.png", alt: "Payments Bank" },
  { src: "/logos/cognizant.svg", alt: "Cognizant" },
  { src: "/logos/ey.svg", alt: "EY" },
  { src: "/companies/salty.png", alt: "Salty" },
  { src: "/logos/wipro.png", alt: "Wipro" },
  { src: "/logos/amazon.svg", alt: "Amazon" },
  { src: "/companies/mpay.png", alt: "MPay" },
  { src: "/companies/techmahindra.png", alt: "Tech Mahindra" },
]
