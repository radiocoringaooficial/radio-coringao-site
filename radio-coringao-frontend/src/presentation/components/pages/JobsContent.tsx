"use client";

import { motion } from "framer-motion";

export function JobsContent() {
  return (
    <div className="mx-auto w-full max-w-4xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-8 font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary md:text-headline-lg">
          Trabalhe Conosco
        </h1>

        <div className="space-y-8">
          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-4 font-headline-md text-headline-md text-primary">
              Faça Parte do Time
            </h2>
            <p className="mb-4 font-body-md leading-relaxed text-on-surface-variant">
              O Rádio Coringão está sempre em busca de profissionais talentosos e apaixonados pelo
              Corinthians. Se você tem experiência em jornalismo, design, programação ou marketing
              digital, queremos conhecer você.
            </p>
          </section>

          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-4 font-headline-md text-headline-md text-primary">
              Como se Candidatar
            </h2>
            <p className="mb-4 font-body-md leading-relaxed text-on-surface-variant">
              Envie seu currículo e portfólio para nosso e-mail. Coloque no assunto o nome da vaga
              que deseja se candidatar. Analisaremos sua candidatura e entraremos em contato caso
              seu perfil seja compatível.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-secondary">email</span>
                <span className="font-body-md text-primary font-bold">radioncoringaocontato@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-secondary">phone</span>
                <span className="font-body-md text-primary font-bold">(11) 96064-7414</span>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
