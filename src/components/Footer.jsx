import logos from "@/assets/logos-financiacion.png";

const Footer = () => (
  <footer className="shrink-0 border-t border-border bg-white">
    <div className="px-4 py-2.5 sm:px-6">
      <img
        src={logos}
        width={2288}
        height={200}
        alt="Financiado por la Unión Europea NextGenerationEU, Gobierno de España, Plan de Recuperación, Transformación y Resiliencia, Generalitat Valenciana y GVA Next"
        className="mx-auto h-auto w-[min(100%,720px)]"
      />
    </div>
  </footer>
);

export default Footer;
