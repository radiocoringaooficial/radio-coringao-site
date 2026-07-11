import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

interface FooterLinkItem {
  id: string;
  label: string;
  href: string;
  imageUrl?: string | null;
  description?: string | null;
  type: string;
  order: number;
}

async function fetchFooterLinks(): Promise<FooterLinkItem[]> {
  try {
    const res = await fetch(`${API_URL}/links-rodape`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch {
    return [];
  }
}

export async function Footer() {
  const items = await fetchFooterLinks();

  const links = items.filter((i) => i.type === "link").sort((a, b) => a.order - b.order);
  const socialItems = items.filter((i) => i.type === "social").sort((a, b) => a.order - b.order);
  const images = items.filter((i) => i.type === "image").sort((a, b) => a.order - b.order);
  const copyrightItems = items.filter((i) => i.type === "copyright");
  const descriptionItems = items.filter((i) => i.type === "description");

  const logoImage = images.find((i) => i.label?.toLowerCase().includes("logo")) || images[0];
  const siteDescription = descriptionItems[0]?.description || "O portal da Fiel. Jornalismo independente, direto e apaixonado sobre o Sport Club Corinthians Paulista.";
  const copyrightText = copyrightItems[0]?.description || "Todos os direitos reservados.";

  const half = Math.ceil(links.length / 2);
  const linksCol1 = links.slice(0, half);
  const linksCol2 = links.slice(half);

  return (
    <footer className="mt-auto w-full bg-[#111]">
      <div className="mx-auto max-w-7xl px-margin-mobile py-12 md:px-margin-desktop">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
          {/* Logo + description */}
          <div className="flex flex-col items-center gap-4 sm:items-start">
            <Link href="/" className="inline-block">
              {logoImage?.imageUrl ? (
                <img src={logoImage.imageUrl} alt="Rádio Coringão" className="h-7 object-contain" />
              ) : (
                <span className="text-lg font-bold text-white">Rádio Coringão</span>
              )}
            </Link>
            <p className="max-w-xs text-center text-[13px] leading-relaxed text-white/50 sm:text-left">
              {siteDescription}
            </p>
          </div>

          {/* Links */}
          {links.length > 0 && (
            <div className="flex gap-8">
              {linksCol1.length > 0 && (
                <div className="flex flex-col gap-3">
                  {linksCol1.map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      className="text-[13px] text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
              {linksCol2.length > 0 && (
                <div className="flex flex-col gap-3">
                  {linksCol2.map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      className="text-[13px] text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Social */}
          {socialItems.length > 0 && (
            <div className="flex flex-col items-center gap-4 sm:items-start">
              <span className="text-[12px] font-bold uppercase tracking-wider text-white/70">
                Redes Sociais
              </span>
              <div className="flex gap-3">
                {socialItems.map((social) => (
                  <a
                    key={social.id}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 transition-colors hover:border-white/30 hover:bg-white/5"
                    aria-label={social.label}
                  >
                    {social.imageUrl ? (
                      <img src={social.imageUrl} alt={social.label} className="h-5 w-5 object-contain" />
                    ) : (
                      <span className="text-[10px] font-bold text-white/70">{social.label.slice(0, 2)}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-margin-mobile py-4 text-center md:px-margin-desktop">
          <p className="text-[11px] text-white/40">
            &copy; {new Date().getFullYear()} Rádio Coringão. {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}
