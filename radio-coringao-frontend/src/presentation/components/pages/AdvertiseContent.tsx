"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

const FALLBACK_INTRO = "O Rádio Coringão é o maior portal de notícias do Corinthians, com milhares de visitas diárias de torcedores fiéis. Sua marca terá visibilidade junto ao público mais apaixonado do futebol brasileiro.";
const FALLBACK_BULLETS = ["Mais de 500 mil visitas mensais", "Público engajado e fiel ao Corinthians", "Segmentação por categorias de interesse", "Relatórios de performance detalhados"];
const FALLBACK_EMAIL = "radioncoringaocontato@gmail.com";
const FALLBACK_PHONE = "(11) 99999-9999";

export function AdvertiseContent() {
  const [intro, setIntro] = useState(FALLBACK_INTRO);
  const [bullets, setBullets] = useState(FALLBACK_BULLETS);
  const [email, setEmail] = useState(FALLBACK_EMAIL);
  const [phone, setPhone] = useState(FALLBACK_PHONE);

  useEffect(() => {
    fetch(`${API_URL}/configuracoes`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.advertiseIntro) setIntro(data.advertiseIntro);
        if (data.advertiseBullets?.length) setBullets(data.advertiseBullets);
        if (data.advertiseEmail) setEmail(data.advertiseEmail);
        if (data.advertisePhone) setPhone(data.advertisePhone);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-8 font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary md:text-headline-lg">
          Anuncie Conosco
        </h1>

        <div className="space-y-8">
          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-4 font-headline-md text-headline-md text-primary">
              Por que anunciar no Rádio Coringão?
            </h2>
            <p className="mb-4 font-body-md text-on-surface-variant">
              {intro}
            </p>
            <ul className="list-inside list-disc space-y-2 font-body-md text-on-surface-variant">
              {bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </section>

          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-4 font-headline-md text-headline-md text-primary">
              Entre em Contato
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-secondary">email</span>
                <span className="font-body-md text-primary font-bold">{email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-secondary">phone</span>
                <span className="font-body-md text-primary font-bold">{phone}</span>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
